import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db";
import { getRequestUser, isRateLimited } from "@/lib/auth-server";
import { validateBody, z } from "@/lib/validation";
import { sendSellerEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const ApplySchema = z.object({
  business_name: z.string().min(2).max(120),
  nif: z.string().min(5).max(20),
  fiscal_address: z.string().min(5).max(200),
  contact_name: z.string().min(2).max(120),
  phone: z.string().min(6).max(20),
  business_email: z.string().email(),
  category: z.string().max(60).optional(),
  website: z.string().max(200).optional(),
  social: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  documents: z.array(z.object({
    type: z.string().max(40),
    url: z.string().max(500),   // path en el bucket privado seller-docs
    name: z.string().max(200).optional(),
  })).max(10).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (isRateLimited(`seller-apply:${user.id}`, 3, 3_600_000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Inténtalo más tarde." }, { status: 429 });
  }

  const parsed = await validateBody(req, ApplySchema);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  const supabase = getAdminClient();
  const { data: existing } = await supabase
    .from("seller_applications").select("id").eq("user_id", user.id)
    .in("status", ["pending", "needs_more_docs"]).limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "Ya tienes una solicitud en revisión." }, { status: 409 });
  }

  const { data: created, error } = await supabase.from("seller_applications").insert({
    user_id: user.id,
    business_name: d.business_name, nif: d.nif, fiscal_address: d.fiscal_address,
    contact_name: d.contact_name, phone: d.phone, business_email: d.business_email,
    category: d.category ?? null, website: d.website ?? null, social: d.social ?? null,
    description: d.description ?? null, documents: d.documents ?? [], status: "pending",
  }).select("id").single();

  if (error || !created) {
    console.error("[seller/apply]", error);
    return NextResponse.json({ error: "No se pudo enviar la solicitud." }, { status: 500 });
  }

  await logAudit({ actorId: user.id, action: "seller.apply", targetType: "seller_application", targetId: (created as any).id });
  await sendSellerEmail({ to: d.business_email, type: "received", businessName: d.business_name });

  return NextResponse.json({ ok: true, id: (created as any).id });
}

/** Estado de la solicitud del usuario actual (para la página de solicitud). */
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("seller_applications").select("id, status, review_note, created_at")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return NextResponse.json({ application: data ?? null });
}
