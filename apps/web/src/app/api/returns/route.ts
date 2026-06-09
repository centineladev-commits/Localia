import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminClient } from "@/lib/db";
import { getRequestUser, isAdminUser } from "@/lib/auth-server";
import { sendReturnRequestedEmail, sendReturnResolvedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-04-30.basil" as any })
  : null;

// Ventana de elegibilidad para devoluciones (coincide con /terminos: 14 días)
const RETURN_WINDOW_DAYS = 14;
// Estados de pedido desde los que se puede devolver (pagado en adelante, no cancelado)
const RETURNABLE_STATES = new Set(["paid", "processing", "ready", "delivered"]);

/* ─── GET: ADMIN lista todas las devoluciones ─────────────────────────────── */
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!(await isAdminUser(user))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("returns")
    .select("id, order_id, shop_id, status, reason, refund_amount, resolution_note, requested_at, created_at, users!buyer_user_id(display_name, email), shops(name)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) {
    console.error("[returns GET]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
  const returns = (data ?? []).map((r: any) => ({
    id: r.id, order_id: r.order_id, shop_id: r.shop_id, status: r.status,
    reason: r.reason, refund_amount: r.refund_amount, resolution_note: r.resolution_note,
    requested_at: r.requested_at, created_at: r.created_at,
    buyer: r.users ?? null, shop: r.shops ?? null,
  }));
  return NextResponse.json({ returns });
}

/* ─── POST: el COMPRADOR solicita una devolución ──────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { orderId, reason } = (await req.json()) as { orderId?: string; reason?: string };
    if (!orderId) return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
    const cleanReason = (reason ?? "").trim();
    if (cleanReason.length < 5) {
      return NextResponse.json({ error: "Explica brevemente el motivo de la devolución." }, { status: 400 });
    }
    if (cleanReason.length > 1000) {
      return NextResponse.json({ error: "El motivo es demasiado largo (máx. 1000 caracteres)." }, { status: 400 });
    }

    const supabase = getAdminClient();

    const { data: order } = await supabase
      .from("orders")
      .select("id, buyer_user_id, shop_id, status, total, paid_at, created_at")
      .eq("id", orderId)
      .single();

    if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    if ((order as any).buyer_user_id !== user.id) {
      return NextResponse.json({ error: "Este pedido no es tuyo" }, { status: 403 });
    }
    if (!RETURNABLE_STATES.has((order as any).status)) {
      return NextResponse.json({ error: "Este pedido no admite devolución en su estado actual." }, { status: 400 });
    }

    // Plazo de 14 días desde el pago (o creación si no hay paid_at)
    const base = new Date((order as any).paid_at ?? (order as any).created_at).getTime();
    const ageDays = (Date.now() - base) / 86_400_000;
    if (ageDays > RETURN_WINDOW_DAYS) {
      return NextResponse.json(
        { error: `El plazo de devolución (${RETURN_WINDOW_DAYS} días) ha expirado.` },
        { status: 400 }
      );
    }

    // No permitir solicitudes duplicadas activas
    const { data: existing } = await supabase
      .from("returns")
      .select("id, status")
      .eq("order_id", orderId)
      .in("status", ["pending", "accepted", "completed"])
      .limit(1);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "Ya existe una solicitud de devolución para este pedido." }, { status: 409 });
    }

    const refundAmount = Number((order as any).total);

    const { data: created, error: insErr } = await supabase
      .from("returns")
      .insert({
        order_id: orderId,
        buyer_user_id: user.id,
        shop_id: (order as any).shop_id,
        status: "pending",
        reason: cleanReason,
        refund_amount: refundAmount,
        requested_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insErr) {
      console.error("[returns POST] insert error:", insErr);
      return NextResponse.json({ error: "No se pudo registrar la devolución." }, { status: 500 });
    }

    // Email al vendedor (best-effort)
    try {
      const { data: shop } = await supabase
        .from("shops").select("name, owner_user_id").eq("id", (order as any).shop_id).single();
      let sellerEmail: string | undefined;
      if ((shop as any)?.owner_user_id) {
        const { data: owner } = await supabase
          .from("users").select("email").eq("id", (shop as any).owner_user_id).single();
        sellerEmail = (owner as any)?.email;
      }
      await sendReturnRequestedEmail({
        sellerEmail,
        orderId,
        shopName: (shop as any)?.name ?? "tu tienda",
        buyerName: user.user_metadata?.display_name ?? user.email ?? "Un comprador",
        reason: cleanReason,
        amount: refundAmount,
      });
    } catch (e) { console.error("[returns POST] email:", e); }

    return NextResponse.json({ ok: true, id: (created as any)?.id });
  } catch (err) {
    console.error("[returns POST]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/* ─── PATCH: el VENDEDOR o ADMIN resuelve la devolución ───────────────────── */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { returnId, action, note } = (await req.json()) as {
      returnId?: string;
      action?: "accept" | "reject" | "complete";
      note?: string;
    };
    if (!returnId || !action || !["accept", "reject", "complete"].includes(action)) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const supabase = getAdminClient();

    const { data: ret } = await supabase
      .from("returns")
      .select("id, order_id, shop_id, buyer_user_id, status, refund_amount, stripe_refund_id")
      .eq("id", returnId)
      .single();
    if (!ret) return NextResponse.json({ error: "Devolución no encontrada" }, { status: 404 });

    // Autorización: admin o dueño de la tienda de la devolución
    const admin = await isAdminUser(user);
    let authorized = admin;
    if (!authorized) {
      const { data: shop } = await supabase
        .from("shops").select("owner_user_id").eq("id", (ret as any).shop_id).single();
      authorized = (shop as any)?.owner_user_id === user.id;
    }
    if (!authorized) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    if ((ret as any).status === "completed" || (ret as any).status === "rejected") {
      return NextResponse.json({ error: "Esta devolución ya está cerrada." }, { status: 409 });
    }

    const now = new Date().toISOString();
    const refundAmount = Number((ret as any).refund_amount ?? 0);

    // Datos para el email al comprador
    const [{ data: buyer }, { data: shopRow }] = await Promise.all([
      supabase.from("users").select("email").eq("id", (ret as any).buyer_user_id).single(),
      supabase.from("shops").select("name").eq("id", (ret as any).shop_id).single(),
    ]);
    const buyerEmail = (buyer as any)?.email as string | undefined;
    const shopName = (shopRow as any)?.name ?? "la tienda";

    if (action === "reject") {
      await supabase.from("returns").update({
        status: "rejected", resolution_note: note ?? null,
        resolved_by: user.id, resolved_at: now, updated_at: now,
      }).eq("id", returnId);
      await sendReturnResolvedEmail({ buyerEmail, orderId: (ret as any).order_id, shopName, status: "rejected", note, amount: refundAmount });
      return NextResponse.json({ ok: true, status: "rejected" });
    }

    // accept / complete → emitir reembolso real en Stripe si es posible
    let stripeRefundId: string | null = (ret as any).stripe_refund_id ?? null;
    let finalStatus: "accepted" | "completed" = "completed";
    let refundError: string | null = null;

    if (!stripeRefundId) {
      const { data: order } = await supabase
        .from("orders").select("stripe_payment_id").eq("id", (ret as any).order_id).single();
      const paymentId = (order as any)?.stripe_payment_id as string | undefined;

      if (stripe && paymentId && refundAmount > 0) {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: paymentId,
            amount: Math.round(refundAmount * 100),
          });
          stripeRefundId = refund.id;
          finalStatus = "completed";
        } catch (e: any) {
          console.error("[returns PATCH] stripe refund:", e?.message);
          refundError = e?.message ?? "refund_failed";
          // Se acepta la devolución pero el reembolso queda pendiente (manual)
          finalStatus = "accepted";
        }
      } else {
        // Sin Stripe o sin payment id → marcar aceptada, reembolso manual
        finalStatus = "accepted";
      }
    }

    await supabase.from("returns").update({
      status: finalStatus,
      stripe_refund_id: stripeRefundId,
      resolution_note: note ?? null,
      resolved_by: user.id,
      resolved_at: finalStatus === "completed" ? now : null,
      updated_at: now,
    }).eq("id", returnId);

    await sendReturnResolvedEmail({
      buyerEmail, orderId: (ret as any).order_id, shopName,
      status: finalStatus === "completed" ? "accepted" : "accepted",
      note, amount: refundAmount,
    });

    return NextResponse.json({ ok: true, status: finalStatus, refundError });
  } catch (err) {
    console.error("[returns PATCH]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
