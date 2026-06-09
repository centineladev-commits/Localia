import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db";
import { expandToCategories } from "@/lib/search-synonyms";
import { SHOP_CATEGORY_COLORS } from "@/lib/constants";
import { DEMO_SHOPS } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export interface SearchShop {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  cityName: string;
  categoryName: string;
  categorySlug: string;
  categoryColor: string;
  logoUrl: string | null;
}

export interface SearchProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  shopName: string;
  shopSlug: string;
  categoryName: string;
  categoryColor: string;
}

export interface SearchResponse {
  shops: SearchShop[];
  products: SearchProduct[];
  query: string;
  expandedCategories: string[];
}

/** Normaliza texto para comparaciones insensibles a tildes y mayúsculas */
function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Sanea el término antes de interpolarlo en el DSL .or()/.ilike() de PostgREST. */
function safeTerm(q: string): string {
  return q.replace(/[,.()*:%_\\"'\n\r]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

/** Demo fallback: filtra comercios y productos por término libre + expansión de categorías */
function demoSearch(q: string, expandedCategories: string[]): { shops: SearchShop[]; products: SearchProduct[] } {
  const qn = normalize(q);

  const shops: SearchShop[] = DEMO_SHOPS
    .filter((s) => {
      const nameMatch = normalize(s.name).includes(qn) || normalize(s.description ?? "").includes(qn);
      const catMatch  = expandedCategories.includes(s.categoryId);
      return nameMatch || catMatch;
    })
    .map((s) => ({
      id: s.id, name: s.name, slug: s.slug,
      description: s.description ?? "",
      address: s.address,
      cityName: "Madrid",
      categoryName: s.categoryId,
      categorySlug: s.categoryId,
      categoryColor: s.categoryColor,
      logoUrl: s.logoUrl,
    }));

  const products: SearchProduct[] = DEMO_SHOPS
    .flatMap((s) =>
      (s.products ?? [])
        .filter((p) => {
          const nameMatch  = normalize(p.name).includes(qn) || normalize(p.description ?? "").includes(qn);
          const tagMatch   = p.tags.some((t) => normalize(t).includes(qn));
          const catMatch   = expandedCategories.includes(p.categoryId);
          return nameMatch || tagMatch || catMatch;
        })
        .map((p) => ({
          id: p.id, name: p.name, price: p.price, images: p.images,
          shopName: s.name, shopSlug: s.slug,
          categoryName: p.categoryId,
          categoryColor: SHOP_CATEGORY_COLORS[p.categoryId] ?? "#6b7280",
        }))
    );

  return { shops, products };
}

/** Convierte un texto libre en una query PostgreSQL FTS */
function toFtsQuery(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/g, ""))
    .filter(Boolean)
    .join(" & ");
}

export async function GET(req: NextRequest) {
  const q      = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const cityId = req.nextUrl.searchParams.get("city_id") ?? "";
  const limit  = Math.min(20, parseInt(req.nextUrl.searchParams.get("limit") ?? "12"));

  if (!q) {
    return NextResponse.json<SearchResponse>({ shops: [], products: [], query: "", expandedCategories: [] });
  }

  const expandedCategories = expandToCategories(q);
  const ftsQuery           = toFtsQuery(q);

  try {
    const supabase = getAdminClient();

    // ── Comercios: por nombre (ilike) + por categoría expandida ──
    const shopByNamePromise = (async (): Promise<SearchShop[]> => {
      let q2 = supabase
        .from("shops")
        .select("id, name, slug, description, address, cities(name), shop_categories(name, slug, color), logo_url")
        .eq("active", true)
        .eq("status", "verified")
        .ilike("name", `%${safeTerm(q)}%`)
        .limit(limit);
      if (cityId) q2 = q2.eq("city_id", cityId);
      const { data } = await q2;
      return (data ?? []).map((s: any) => ({
        id: s.id, name: s.name, slug: s.slug,
        description: s.description ?? "", address: s.address ?? "",
        cityName: s.cities?.name ?? "",
        categoryName: s.shop_categories?.name ?? "",
        categorySlug: s.shop_categories?.slug ?? "",
        categoryColor: s.shop_categories?.color ?? "#6b7280",
        logoUrl: s.logo_url ?? null,
      }));
    })();

    const shopByCatPromise = expandedCategories.length > 0
      ? (async (): Promise<SearchShop[]> => {
          let q2 = supabase
            .from("shops")
            .select("id, name, slug, description, address, cities(name), shop_categories!inner(name, slug, color), logo_url")
            .eq("active", true)
            .eq("status", "verified")
            .in("shop_categories.slug", expandedCategories)
            .limit(limit);
          if (cityId) q2 = q2.eq("city_id", cityId);
          const { data } = await q2;
          return (data ?? []).map((s: any) => ({
            id: s.id, name: s.name, slug: s.slug,
            description: s.description ?? "", address: s.address ?? "",
            cityName: s.cities?.name ?? "",
            categoryName: s.shop_categories?.name ?? "",
            categorySlug: s.shop_categories?.slug ?? "",
            categoryColor: s.shop_categories?.color ?? "#6b7280",
            logoUrl: s.logo_url ?? null,
          }));
        })()
      : Promise.resolve([] as SearchShop[]);

    // ── Productos: FTS primario + ilike de respaldo ──
    const productPromise = (async (): Promise<SearchProduct[]> => {
      const base = () =>
        supabase
          .from("products")
          .select("id, name, price, images, city_id, shops!inner(name, slug, shop_categories(name, slug, color))")
          .eq("active", true)
          .eq("shops.active", true)
          .eq("shops.status", "verified")
          .gt("stock", 0)
          .limit(limit);

      let results: any[] = [];

      if (ftsQuery) {
        let q2 = base();
        if (cityId) q2 = q2.eq("city_id", cityId);
        const { data } = await q2.textSearch("search_vector", ftsQuery, { type: "websearch", config: "spanish" });
        results = data ?? [];
      }

      if (results.length < 4) {
        let q2 = base();
        if (cityId) q2 = q2.eq("city_id", cityId);
        const t = safeTerm(q);
        const { data } = await q2.or(`name.ilike.%${t}%,description.ilike.%${t}%`);
        const seen = new Set(results.map((r: any) => r.id));
        results = [...results, ...(data ?? []).filter((r: any) => !seen.has(r.id))].slice(0, limit);
      }

      return results.map((p: any) => {
        const cat = p.shops?.shop_categories ?? {};
        return {
          id: p.id, name: p.name, price: Number(p.price), images: p.images ?? [],
          shopName: p.shops?.name ?? "", shopSlug: p.shops?.slug ?? "",
          categoryName: cat.name ?? "",
          categoryColor: cat.color ?? SHOP_CATEGORY_COLORS[cat.slug ?? ""] ?? "#6b7280",
        };
      });
    })();

    const [shopByName, shopByCat, products] = await Promise.all([
      shopByNamePromise, shopByCatPromise, productPromise,
    ]);

    // Deduplicar comercios
    const seen = new Set<string>();
    const shops = [...shopByName, ...shopByCat].filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    }).slice(0, limit);

    // Si no hay resultados reales, caer en demo
    if (shops.length === 0 && products.length === 0) {
      const demo = demoSearch(q, expandedCategories);
      return NextResponse.json<SearchResponse>({ ...demo, query: q, expandedCategories });
    }

    return NextResponse.json<SearchResponse>({ shops, products, query: q, expandedCategories });
  } catch {
    // Fallback a demo data si Supabase no responde
    const demo = demoSearch(q, expandedCategories);
    return NextResponse.json<SearchResponse>({ ...demo, query: q, expandedCategories });
  }
}
