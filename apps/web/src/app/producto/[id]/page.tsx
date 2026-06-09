import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/db";
import { getProductById, getShopByProductId } from "@/lib/demo-data";
import { SHOP_CATEGORY_COLORS } from "@/lib/constants";
import { ProductDetail } from "@/components/product/ProductDetail";
import { PageWrapper } from "@/components/layout/PageWrapper";
import type { Product, Shop } from "@/lib/types";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProductPage({ params }: { params: { id: string } }) {
  let product: Product;
  let shop: Shop;

  if (UUID_RE.test(params.id)) {
    try {
      const supabase = getAdminClient();
      const { data: p, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", params.id)
        .single();
      if (error || !p) throw new Error("not_found");

      const { data: s } = await supabase
        .from("shops")
        .select("*, shop_categories(name, color, slug)")
        .eq("id", p.shop_id)
        .single();
      if (!s) throw new Error("shop_not_found");

      const catSlug: string = s.shop_categories?.slug ?? s.category_id ?? "";
      const catColor: string = s.shop_categories?.color ?? SHOP_CATEGORY_COLORS[catSlug] ?? SHOP_CATEGORY_COLORS.otros;

      product = {
        id: p.id, shopId: p.shop_id, name: p.name, description: p.description ?? "",
        price: Number(p.price), stock: p.stock ?? 0, images: p.images ?? [],
        categoryId: p.category_id ?? "", tags: p.tags ?? [],
      };
      shop = {
        id: s.id, name: s.name, slug: s.slug, logoUrl: s.logo_url ?? null,
        categoryId: catSlug, categoryColor: catColor, categoryName: s.shop_categories?.name,
        coordinates: { lat: 0, lng: 0 }, distanceMeters: 0, rating: null, isOpen: true,
        address: s.address ?? "", phone: s.phone ?? "", description: s.description ?? "", openingHours: "",
      };
    } catch {
      notFound();
    }
  } else {
    const demoProduct = getProductById(params.id);
    const demoShop = getShopByProductId(params.id);
    if (!demoProduct || !demoShop) notFound();
    product = demoProduct;
    shop = demoShop;
  }

  return (
    <PageWrapper>
      <div className="bg-gray-50 min-h-full">
        <ProductDetail product={product!} shop={shop!} />
      </div>
    </PageWrapper>
  );
}
