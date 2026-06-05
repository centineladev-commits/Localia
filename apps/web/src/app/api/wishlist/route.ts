import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/wishlist?userId=...&productId=... — check if product is in wishlist
export async function GET(req: NextRequest) {
  const userId    = req.nextUrl.searchParams.get("userId");
  const productId = req.nextUrl.searchParams.get("productId");
  if (!userId || !productId) return NextResponse.json({ inWishlist: false });

  const supabase = getAdminClient();
  const { data } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  return NextResponse.json({ inWishlist: !!data, wishId: data?.id ?? null });
}

// POST /api/wishlist — toggle
export async function POST(req: NextRequest) {
  const { userId, productId } = await req.json();
  if (!userId || !productId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const supabase = getAdminClient();
  const { data: existing } = await supabase
    .from("wishlists").select("id").eq("user_id", userId).eq("product_id", productId).maybeSingle();

  if (existing) {
    await supabase.from("wishlists").delete().eq("id", existing.id);
    return NextResponse.json({ inWishlist: false });
  } else {
    await supabase.from("wishlists").insert({ user_id: userId, product_id: productId });
    return NextResponse.json({ inWishlist: true });
  }
}
