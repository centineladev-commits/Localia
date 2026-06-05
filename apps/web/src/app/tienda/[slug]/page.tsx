import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/db";
import { getShopBySlug } from "@/lib/demo-data";
import { SHOP_CATEGORY_COLORS } from "@/lib/constants";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import type { Shop, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatHours(hours: any): string {
  if (!hours || typeof hours === "string") return hours ?? "";
  const labels: Record<string, string> = { mon: "Lun", tue: "Mar", wed: "Mié", thu: "Jue", fri: "Vie", sat: "Sáb", sun: "Dom" };
  return Object.entries(hours as Record<string, string | null>)
    .filter(([, v]) => v)
    .map(([k, v]) => `${labels[k] ?? k} ${v}`)
    .join(" · ");
}

export default async function ShopPage({ params }: { params: { slug: string } }) {
  let shop: Shop;
  let products: Product[];

  try {
    const supabase = getAdminClient();
    const { data: raw, error } = await supabase
      .from("shops")
      .select("*, shop_categories(name, color, slug)")
      .eq("slug", params.slug)
      .eq("active", true)
      .single();

    if (error || !raw) throw new Error("not_found");

    const [{ data: rawProds }, { data: rawReviews }] = await Promise.all([
      supabase.from("products").select("*").eq("shop_id", raw.id).eq("active", true).order("created_at", { ascending: false }),
      supabase.from("reviews").select("rating").eq("shop_id", raw.id),
    ]);

    const catSlug: string = raw.shop_categories?.slug ?? raw.category_id ?? "";
    const catColor: string = raw.shop_categories?.color ?? SHOP_CATEGORY_COLORS[catSlug] ?? SHOP_CATEGORY_COLORS.otros;

    shop = {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      description: raw.description ?? "",
      categoryId: catSlug,
      categoryName: raw.shop_categories?.name ?? "",
      categoryColor: catColor,
      logoUrl: raw.logo_url ?? null,
      coverUrl: raw.cover_url ?? null,
      address: raw.address ?? "",
      phone: raw.phone ?? "",
      openingHours: formatHours(raw.opening_hours),
      coordinates: { lat: 0, lng: 0 },
      distanceMeters: 0,
      rating: rawReviews && rawReviews.length > 0
        ? Math.round(rawReviews.reduce((a, r) => a + r.rating, 0) / rawReviews.length * 10) / 10
        : null,
      isOpen: true,
    };

    products = (rawProds ?? []).map((p: any): Product => ({
      id: p.id,
      shopId: p.shop_id,
      name: p.name,
      description: p.description ?? "",
      price: Number(p.price),
      stock: p.stock ?? 0,
      images: p.images ?? [],
      categoryId: p.category_id ?? "",
      tags: p.tags ?? [],
    }));
  } catch {
    const demo = getShopBySlug(params.slug);
    if (!demo) notFound();
    shop = demo;
    products = demo.products ?? [];
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <ShopHeader shop={shop} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">
            Catálogo
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({products.length} producto{products.length !== 1 ? "s" : ""})
            </span>
          </h2>
        </div>
        <ProductGrid products={products} shop={shop} />
        <ReviewsList shopId={shop.id} />
      </div>
    </div>
  );
}
