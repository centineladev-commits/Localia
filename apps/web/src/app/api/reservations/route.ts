import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { userId, shopId, productId, quantity, notes } = await req.json();
    if (!userId || !shopId || !productId || !quantity) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Obtener precio del producto
    const { data: product, error: pErr } = await supabase
      .from("products").select("price, stock").eq("id", productId).single();
    if (pErr || !product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    if (product.stock < quantity) return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });

    const unitPrice   = Number(product.price);
    const totalAmount = +(unitPrice * quantity).toFixed(2);

    const { data, error } = await supabase
      .from("reservations")
      .insert({
        user_id:      userId,
        shop_id:      shopId,
        product_id:   productId,
        quantity,
        unit_price:   unitPrice,
        total_amount: totalAmount,
        amount_paid:  0,
        status:       "pending",
        notes:        notes ?? null,
        expires_at:   new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ reservationId: data.id });
  } catch (err: any) {
    console.error("[reservations]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const shopId = req.nextUrl.searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "Missing shopId" }, { status: 400 });

  const supabase = getAdminClient();
  const { data } = await supabase
    .from("reservations")
    .select("id, status, quantity, unit_price, total_amount, amount_paid, notes, created_at, users(display_name, email), products(name, images)")
    .eq("shop_id", shopId)
    .in("status", ["pending", "confirmed"])
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}

// PATCH /api/reservations — confirmar/rechazar (para la tienda)
export async function PATCH(req: NextRequest) {
  const { reservationId, action } = await req.json();
  if (!reservationId || !["confirmed", "rejected"].includes(action)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const supabase = getAdminClient();
  await supabase
    .from("reservations")
    .update({ status: action, updated_at: new Date().toISOString() })
    .eq("id", reservationId);
  return NextResponse.json({ ok: true });
}
