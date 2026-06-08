import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db";
import { getRequestUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

/** GET /api/reviews?shop_id=xxx — lista reseñas públicas de un comercio */
export async function GET(req: NextRequest) {
  const shopId = req.nextUrl.searchParams.get("shop_id");
  if (!shopId) return NextResponse.json({ error: "shop_id requerido" }, { status: 400 });

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, users(display_name, avatar_url)")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ reviews: [], average: null, total: 0 });

  const reviews = data ?? [];
  const average = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : null;

  return NextResponse.json({ reviews, average, total: reviews.length });
}

/** POST /api/reviews — crear reseña (requiere auth) */
export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { shop_id, rating, comment } = await req.json();
  if (!shop_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "shop_id y rating (1-5) son obligatorios" }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Una reseña por usuario por comercio
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("shop_id", shop_id)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (existing) {
    // Actualizar la reseña existente
    const { data, error } = await supabase
      .from("reviews")
      .update({ rating, comment: comment ?? null, created_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("id, rating, comment, created_at")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ review: data });
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({ shop_id, buyer_id: user.id, rating, comment: comment ?? null })
    .select("id, rating, comment, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Actualizar rating medio en la tabla shops
  const { data: allReviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("shop_id", shop_id);
  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((a, r) => a + r.rating, 0) / allReviews.length;
    await supabase.from("shops").update({ rating: Math.round(avg * 10) / 10 }).eq("id", shop_id);
  }

  return NextResponse.json({ review: data }, { status: 201 });
}
