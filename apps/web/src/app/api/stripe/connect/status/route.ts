import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminClient } from "@/lib/db";
import { getRequestUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

/** Estado de la cuenta Stripe Connect de la tienda del vendedor. */
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ configured: false });

  const supabase = getAdminClient();
  const { data: shop } = await supabase
    .from("shops").select("id, stripe_account_id").eq("owner_user_id", user.id).maybeSingle();

  const accountId = (shop as any)?.stripe_account_id as string | null;
  if (!shop || !accountId) return NextResponse.json({ configured: true, connected: false });

  try {
    const acct = await stripe.accounts.retrieve(accountId);
    const chargesEnabled = !!acct.charges_enabled;
    const payoutsEnabled = !!acct.payouts_enabled;
    // Cachear el estado en la tienda
    await supabase.from("shops").update({
      stripe_charges_enabled: chargesEnabled,
      stripe_payouts_enabled: payoutsEnabled,
    }).eq("id", (shop as any).id);

    return NextResponse.json({
      configured: true,
      connected: true,
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted: !!acct.details_submitted,
    });
  } catch (err: any) {
    console.error("[connect/status]", err?.message);
    return NextResponse.json({ configured: true, connected: false, error: "No se pudo consultar el estado." });
  }
}
