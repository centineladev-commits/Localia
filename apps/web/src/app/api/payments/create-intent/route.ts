import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminClient } from "@/lib/db";
import { calcFee, calcShipping } from "@/lib/constants";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
});

/** Comprueba si un comercio tiene exención de comisión activa en este momento */
async function hasActiveExemption(shopId: string): Promise<boolean> {
  if (!shopId) return false;
  try {
    const supabase = getAdminClient();
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("fee_exemptions")
      .select("id")
      .eq("shop_id", shopId)
      .lte("starts_at", now)
      .gte("ends_at", now)
      .limit(1)
      .single();
    return !!data;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { amount, shopId, userId, items, deliveryType, deliveryAddress } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Importe inválido" }, { status: 400 });
    }

    const subtotal   = +Number(amount).toFixed(2);
    const shipping   = calcShipping(subtotal, deliveryType ?? "pickup");
    const grandTotal = +(subtotal + shipping).toFixed(2);

    // Si el comercio tiene exención activa la comisión es 0
    const exempted   = await hasActiveExemption(shopId);
    const platformFee = exempted ? 0 : calcFee(grandTotal);
    const amountCents = Math.round(grandTotal * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountCents,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: {
        shopId:          shopId ?? "",
        userId:          userId ?? "",
        deliveryType:    deliveryType ?? "pickup",
        deliveryAddress: deliveryAddress ?? "",
        platformFeeEur:  platformFee.toFixed(2),
        feeExempted:     exempted ? "true" : "false",
        items:           JSON.stringify(items ?? []),
      },
    });

    // Crear borrador de pedido
    try {
      const supabase = getAdminClient();
      await supabase.from("orders").insert({
        buyer_user_id:     userId,
        shop_id:           shopId,
        items:             items ?? [],
        subtotal:          subtotal,
        platform_fee:      platformFee,
        total:             grandTotal,
        delivery_type:     deliveryType ?? "pickup",
        delivery_address:  deliveryAddress ?? null,
        stripe_payment_id: paymentIntent.id,
        status:            "pending",
      });
    } catch (dbErr) {
      console.error("[create-intent] DB insert error:", dbErr);
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      grandTotal,
      shipping,
      platformFee,
      feeExempted: exempted,
    });
  } catch (err: any) {
    console.error("[create-intent]", err);
    return NextResponse.json({ error: err.message ?? "Error interno" }, { status: 500 });
  }
}
