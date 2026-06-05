import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db";
import { DEMO_SHOPS } from "@/lib/demo-data";
import { SHOP_CATEGORY_COLORS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  tags: string[];
  stock: number;
  shopId: string;
  shopName: string;
  shopSlug: string;
  shopAddress: string;
  cityName: string;
  cityId: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  categoryColor: string;
  createdAt: string;
}

const DEMO_CITY_NAMES: Record<string, string> = {
  madrid: "Madrid", barcelona: "Barcelona", valencia: "Valencia",
  sevilla: "Sevilla", bilbao: "Bilbao", malaga: "Málaga", zaragoza: "Zaragoza",
};

function demoFallback(params: {
  q?: string; category?: string; priceMin?: number; priceMax?: number; sort?: string;
  page: number; limit: number; cityId?: string; national?: boolean;
}): { products: CatalogProduct[]; total: number } {
  // In demo mode, label products with the requested city so the UI feels responsive
  const cityName = params.national
    ? "Otras ciudades"
    : (params.cityId ? (DEMO_CITY_NAMES[params.cityId] ?? params.cityId) : "Madrid");
  const cityId   = params.national ? "" : (params.cityId ?? "");

  let products: CatalogProduct[] = DEMO_SHOPS.flatMap((shop) =>
    (shop.products ?? []).map((p) => ({
      id: p.id, name: p.name, description: p.description, price: p.price,
      images: p.images, tags: p.tags, stock: p.stock,
      shopId: shop.id, shopName: shop.name, shopSlug: shop.slug, shopAddress: shop.address,
      cityName, cityId,
      categoryId: p.categoryId, categoryName: shop.categoryName ?? p.categoryId,
      categorySlug: p.categoryId, categoryColor: SHOP_CATEGORY_COLORS[p.categoryId] ?? "#6b7280",
      createdAt: new Date().toISOString(),
    }))
  );

  if (params.q) {
    const q = params.q.toLowerCase();
    products = products.filter((p) =>
      p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) || p.shopName.toLowerCase().includes(q)
    );
  }
  if (params.category) products = products.filter((p) => p.categorySlug === params.category);
  if (params.priceMin != null) products = products.filter((p) => p.price >= params.priceMin!);
  if (params.priceMax != null) products = products.filter((p) => p.price <= params.priceMax!);

  if (params.sort === "price_asc") products.sort((a, b) => a.price - b.price);
  else if (params.sort === "price_desc") products.sort((a, b) => b.price - a.price);

  const total = products.length;
  const offset = (params.page - 1) * params.limit;
  return { products: products.slice(offset, offset + params.limit), total };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveCityId(supabase: ReturnType<typeof getAdminClient>, param: string): Promise<string | null> {
  if (!param) return null;
  if (UUID_RE.test(param)) return param;
  // Param is a slug — look up the UUID
  const { data } = await supabase.from("cities").select("id").eq("slug", param).single();
  return data?.id ?? null;
}

function buildProductQuery(supabase: ReturnType<typeof getAdminClient>) {
  return supabase
    .from("products")
    .select(`
      id, name, description, price, images, tags, stock, created_at, category_id, city_id,
      shops!inner (
        id, name, slug, address, city_id,
        cities ( name ),
        shop_categories ( name, slug, color )
      )
    `, { count: "exact" })
    .eq("active", true)
    .eq("shops.active", true)
    .eq("shops.status", "verified")
    .gt("stock", 0);
}

function mapProduct(p: any): CatalogProduct {
  const shop = p.shops;
  const cat = shop?.shop_categories ?? {};
  const catSlug: string = cat.slug ?? p.category_id ?? "";
  return {
    id: p.id, name: p.name, description: p.description ?? "",
    price: Number(p.price), images: p.images ?? [], tags: p.tags ?? [], stock: p.stock ?? 0,
    shopId: shop?.id ?? "", shopName: shop?.name ?? "", shopSlug: shop?.slug ?? "",
    shopAddress: shop?.address ?? "",
    cityName: shop?.cities?.name ?? "",
    cityId: p.city_id ?? shop?.city_id ?? "",
    categoryId: catSlug, categoryName: cat.name ?? catSlug, categorySlug: catSlug,
    categoryColor: cat.color ?? SHOP_CATEGORY_COLORS[catSlug] ?? "#6b7280",
    createdAt: p.created_at,
  };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q         = sp.get("q") ?? "";
  const category  = sp.get("category") ?? "";
  const priceMin  = sp.get("price_min") ? parseFloat(sp.get("price_min")!) : undefined;
  const priceMax  = sp.get("price_max") ? parseFloat(sp.get("price_max")!) : undefined;
  const cityParam = sp.get("city_id") ?? "";
  const national  = sp.get("national") === "1";
  const sort      = sp.get("sort") ?? "newest";
  const page      = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const limit     = Math.min(40, parseInt(sp.get("limit") ?? "20"));

  try {
    const supabase = getAdminClient();
    const cityId   = await resolveCityId(supabase, cityParam);

    let query = buildProductQuery(supabase);

    // Geographic filter — applied only for the local results pass
    if (cityId && !national) {
      query = query.eq("city_id", cityId);
    } else if (cityId && national) {
      // Exclude the selected city to show complementary national results
      query = query.neq("city_id", cityId);
    }

    if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    if (category) query = query.eq("shops.shop_categories.slug", category);
    if (priceMin != null) query = query.gte("price", priceMin);
    if (priceMax != null) query = query.lte("price", priceMax);

    if (sort === "price_asc") query = query.order("price", { ascending: true });
    else if (sort === "price_desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;
    if (error || !data || data.length === 0) throw error ?? new Error("no data");

    const products: CatalogProduct[] = data.map(mapProduct);
    return NextResponse.json({ products, total: count ?? products.length, page, limit });
  } catch {
    const result = demoFallback({
      q: q || undefined, category: category || undefined, priceMin, priceMax, sort, page, limit,
      cityId: cityParam || undefined, national,
    });
    return NextResponse.json({ ...result, page, limit });
  }
}
