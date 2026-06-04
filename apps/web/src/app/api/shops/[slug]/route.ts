import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db";

// GET /api/shops/:slug — comercio con sus productos
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = getAdminClient();

    const { data: shop, error: shopErr } = await supabase
      .from("shops")
      .select(`
        *,
        shop_categories ( name, color )
      `)
      .eq("slug", params.slug)
      .eq("active", true)
      .single();

    if (shopErr || !shop) {
      return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
    }

    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("*, product_categories ( name )")
      .eq("shop_id", shop.id)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (prodErr) throw prodErr;

    return NextResponse.json({ shop, products: products ?? [] });
  } catch (err: any) {
    console.error("[GET /api/shops/:slug]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
