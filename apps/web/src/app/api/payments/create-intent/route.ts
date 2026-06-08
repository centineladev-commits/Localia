import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminClient } from "@/lib/db";
import { getRequestUser } from "@/lib/auth-server";
import { calcFee, calcShipping } from "@/lib/constants";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
});

interface CartItem {
  id: string;       // product id
  name: string;
  qty: number;
  price: number;    // client-supplied (used only for display, NOT trusted for total)
}

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
    // userId must come from the verified JWT, never from the client
    const authUser = await getRequestUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { shopId, items, deliveryType, deliveryAddress } = await req.json() as {
      shopId?: string;
      items?: CartItem[];
      deliveryType?: string;
      deliveryAddress?: string;
    };

    if (!shopId) {
      return NextResponse.json({ error: "shopId requerido" }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }
    if (items.length > 50) {
      return NextResponse.json({ error: "Demasiados artículos" }, { status: 400 });
    }

    // ── Re-derive prices from the database, never trust client-supplied prices ──
    const supabase = getAdminClient();
    const productIds = [...new Set(items.map((i) => i.id))];

    const { data: dbProducts, error: productsErr } = await supabase
      .from("products")
      .select("id, price, stock, active")
      .in("id", productIds)
      .eq("shop_id", shopId);       // also verify products belong to the given shop

    if (productsErr || !dbProducts) {
      return NextResponse.json({ error: "No se pudieron verificar los productos" }, { status: 500 });
    }

    const priceMap = new Map(dbProducts.map((p) => [p.id, p]));

    let subtotal = 0;
    const verifiedItems: { id: string; name: string; qty: number; price: number }[] = [];

    for (const item of items) {
      const dbProduct = priceMap.get(item.id);
      if (!dbProduct) {
        return NextResponse.json(
          { error: `Producto no encontrado o no pertenece a esta tienda` },
          { status: 400 }
        );
      }
      if (!dbProduct.active) {
        return NextResponse.json(
          { error: `El producto "${item.name}" ya no está disponible` },
          { status: 400 }
        );
      }

      const qty = Math.max(1, Math.floor(Number(item.qty)));
      if (dbProduct.stock < qty) {
        return NextResponse.json(
          { error: `Stock insuficiente para "${item.name}"` },
          { status: 400 }
        );
      }

      const unitPrice = Number(dbProduct.price);
      subtotal = +(subtotal + unitPrice * qty).toFixed(2);
      verifiedItems.push({ id: item.id, name: item.name, qty, price: unitPrice });
    }

    if (subtotal <= 0) {
      return NextResponse.json({ error: "Importe inválido" }, { status: 400 });
    }

    const deliveryMode = (deliveryType === "local_delivery" ? "local_delivery" : "pickup") as "pickup" | "local_delivery";
    const shipping   = calcShipping(subtotal, deliveryMode);
    const grandTotal = +(subtotal + shipping).toFixed(2);

    // Comisión de plataforma (0 si exención activa)
    const exempted    = await hasActiveExemption(shopId);
    const platformFee = exempted ? 0 : calcFee(grandTotal);
    const amountCents = Math.round(grandTotal * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountCents,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: {
        shopId,
        userId:          authUser.id,    // from JWT
        deliveryType:    deliveryMode,
        deliveryAddress: deliveryAddress ?? "",
        platformFeeEur:  platformFee.toFixed(2),
        feeExempted:     exempted ? "true" : "false",
        items:           JSON.stringify(verifiedItems),
      },
    });

    // Crear borrador de pedido con precios verificados
    try {
      await supabase.from("orders").insert({
        buyer_user_id:     authUser.id,
        shop_id:           shopId,
        items:             verifiedItems,
        subtotal,
        platform_fee:      platformFee,
        total:             grandTotal,
        delivery_type:     deliveryMode,
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
      subtotal,
      shipping,
      platformFee,
      feeExempted: exempted,
    });
  } catch (err: unknown) {
    console.error("[create-intent]", err);
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
