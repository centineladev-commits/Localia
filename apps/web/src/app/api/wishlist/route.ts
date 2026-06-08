import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db";
import { getRequestUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

/**
 * GET /api/wishlist?productId=... — check if current user has product in wishlist.
 * Requires Authorization header.
 */
export async function GET(req: NextRequest) {
  const authUser = await getRequestUser(req);
  if (!authUser) return NextResponse.json({ inWishlist: false });

  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return NextResponse.json({ inWishlist: false });

  const supabase = getAdminClient();
  const { data } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", authUser.id)
    .eq("product_id", productId)
    .maybeSingle();

  return NextResponse.json({ inWishlist: !!data, wishId: data?.id ?? null });
}

/**
 * POST /api/wishlist — toggle wishlist item for current user.
 * Requires Authorization header. userId is extracted from JWT, never from body.
 */
export async function POST(req: NextRequest) {
  const authUser = await getRequestUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { productId } = await req.json();
  if (!productId) {
    return NextResponse.json({ error: "productId requerido" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", authUser.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase.from("wishlists").delete().eq("id", existing.id);
    return NextResponse.json({ inWishlist: false });
  } else {
    await supabase
      .from("wishlists")
      .insert({ user_id: authUser.id, product_id: productId });
    return NextResponse.json({ inWishlist: true });
  }
}
