import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminClient } from "@/lib/db";
import { sendOrderConfirmationEmails } from "@/lib/email";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Sin firma de webhook" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("[webhook] Firma inválida:", err.message);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  const supabase = getAdminClient();

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const meta = pi.metadata;

    // 1. Marcar pedido como pagado
    const { data: order } = await supabase
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("stripe_payment_id", pi.id)
      .select("id, buyer_user_id, shop_id, items, subtotal, platform_fee, total, delivery_type, delivery_address")
      .single();

    console.log(`[webhook] Pedido pagado: ${pi.id} — ${(pi.amount / 100).toFixed(2)} €`);

    // 2. Decrementar stock de cada producto
    try {
      const items: { id: string; name: string; qty: number; price: number }[] =
        order?.items ?? (meta.items ? JSON.parse(meta.items) : []);

      for (const item of items) {
        await supabase.rpc("decrement_stock", { p_product_id: item.id, p_qty: item.qty });
      }
    } catch (stockErr) {
      console.error("[webhook] Error decrementando stock:", stockErr);
    }

    // 3. Enviar emails de confirmación
    try {
      if (order) {
        // Obtener datos del comprador y tienda
        const [{ data: buyer }, { data: shop }] = await Promise.all([
          supabase.from("users").select("email, display_name").eq("id", order.buyer_user_id).single(),
          supabase.from("shops").select("name, owner_user_id").eq("id", order.shop_id).single(),
        ]);

        let shopOwnerEmail: string | undefined;
        if (shop?.owner_user_id) {
          const { data: owner } = await supabase
            .from("users").select("email").eq("id", shop.owner_user_id).single();
          shopOwnerEmail = owner?.email;
        }

        const items: { id: string; name: string; qty: number; price: number }[] = order.items ?? [];

        await sendOrderConfirmationEmails({
          orderId:       order.id,
          buyerEmail:    buyer?.email ?? meta.userId,
          buyerName:     buyer?.display_name ?? "Cliente",
          shopName:      shop?.name ?? "Tienda",
          shopEmail:     shopOwnerEmail,
          items:         items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
          subtotal:      Number(order.subtotal),
          platformFee:   Number(order.platform_fee),
          total:         Number(order.total),
          deliveryType:  order.delivery_type as "pickup" | "local_delivery",
          deliveryAddress: order.delivery_address ?? undefined,
          createdAt:     new Date().toISOString(),
        });
      }
    } catch (emailErr) {
      console.error("[webhook] Error enviando emails:", emailErr);
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("stripe_payment_id", pi.id);
  }

  return NextResponse.json({ received: true });
}
