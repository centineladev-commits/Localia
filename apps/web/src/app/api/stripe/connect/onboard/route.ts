import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminClient } from "@/lib/db";
import { getRequestUser } from "@/lib/auth-server";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Inicia (o reanuda) el onboarding de Stripe Connect Express para la tienda del
 * vendedor. Crea la cuenta conectada si no existe, guarda stripe_account_id y
 * devuelve la URL del flujo de onboarding de Stripe (KYC + cuenta bancaria).
 * La plataforma NUNCA toca los datos bancarios del vendedor.
 *
 * Requiere: STRIPE_SECRET_KEY + Connect habilitado en el dashboard de Stripe.
 */
export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe no está configurado (falta STRIPE_SECRET_KEY)." }, { status: 503 });
  }

  const supabase = getAdminClient();
  const { data: shop } = await supabase
    .from("shops").select("id, name, stripe_account_id").eq("owner_user_id", user.id).maybeSingle();
  if (!shop) {
    return NextResponse.json({ error: "No tienes una tienda asociada." }, { status: 400 });
  }

  try {
    let accountId = (shop as any).stripe_account_id as string | null;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "ES",
        email: user.email ?? undefined,
        business_type: "individual",
        business_profile: { name: (shop as any).name ?? undefined },
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      });
      accountId = account.id;
      await supabase.from("shops").update({ stripe_account_id: accountId }).eq("id", (shop as any).id);
      await logAudit({ actorId: user.id, action: "stripe.connect.create", targetType: "shop", targetId: (shop as any).id, metadata: { accountId } });
    }

    const origin = req.headers.get("origin") ?? "https://localia-web-nine.vercel.app";
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/comercio/pagos?connect=refresh`,
      return_url: `${origin}/dashboard/comercio/pagos?connect=done`,
      type: "account_onboarding",
    });
    return NextResponse.json({ url: link.url });
  } catch (err: any) {
    console.error("[connect/onboard]", err?.message);
    return NextResponse.json({ error: "No se pudo iniciar el onboarding de Stripe." }, { status: 500 });
  }
}
