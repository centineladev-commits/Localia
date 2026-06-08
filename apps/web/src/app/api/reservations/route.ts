import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db";
import { getRequestUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

/** POST /api/reservations — crear reserva (requiere auth) */
export async function POST(req: NextRequest) {
  try {
    // userId always comes from the verified JWT, never from the request body
    const authUser = await getRequestUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { shopId, productId, quantity, notes } = await req.json();
    if (!shopId || !productId || !quantity) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Obtener precio y stock del producto
    const { data: product, error: pErr } = await supabase
      .from("products")
      .select("price, stock")
      .eq("id", productId)
      .single();

    if (pErr || !product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    if (product.stock < quantity) {
      return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });
    }

    const unitPrice   = Number(product.price);
    const totalAmount = +(unitPrice * quantity).toFixed(2);

    const { data, error } = await supabase
      .from("reservations")
      .insert({
        user_id:      authUser.id,   // ← from JWT, not body
        shop_id:      shopId,
        product_id:   productId,
        quantity,
        unit_price:   unitPrice,
        total_amount: totalAmount,
        amount_paid:  0,
        status:       "pending",
        notes:        typeof notes === "string" ? notes.slice(0, 500) : null,
        expires_at:   new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ reservationId: data.id });
  } catch (err: unknown) {
    console.error("[reservations POST]", err);
    const msg = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** GET /api/reservations?shopId=... — listar reservas de un comercio (requiere ser dueño) */
export async function GET(req: NextRequest) {
  const authUser = await getRequestUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const shopId = req.nextUrl.searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "Missing shopId" }, { status: 400 });

  const supabase = getAdminClient();

  // Verify the authenticated user owns this shop
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("id", shopId)
    .eq("owner_user_id", authUser.id)
    .maybeSingle();

  if (!shop) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const { data } = await supabase
    .from("reservations")
    .select(
      "id, status, quantity, unit_price, total_amount, amount_paid, notes, created_at, users(display_name, email), products(name, images)"
    )
    .eq("shop_id", shopId)
    .in("status", ["pending", "confirmed"])
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}

/** PATCH /api/reservations — confirmar/rechazar (requiere ser dueño del comercio) */
export async function PATCH(req: NextRequest) {
  const authUser = await getRequestUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { reservationId, action } = body;

  if (!reservationId || !["confirmed", "rejected"].includes(action)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Verify the authenticated user owns the shop associated with this reservation
  const { data: reservation } = await supabase
    .from("reservations")
    .select("id, shop_id")
    .eq("id", reservationId)
    .maybeSingle();

  if (!reservation) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("id", reservation.shop_id)
    .eq("owner_user_id", authUser.id)
    .maybeSingle();

  if (!shop) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  await supabase
    .from("reservations")
    .update({ status: action, updated_at: new Date().toISOString() })
    .eq("id", reservationId);

  return NextResponse.json({ ok: true });
}
