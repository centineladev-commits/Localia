import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db";
import { getRequestUser, isAdminUser } from "@/lib/auth-server";
import { sendSellerEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "tienda";
}

/* ─── GET: lista de solicitudes (admin), con URLs firmadas de los documentos ── */
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user || !(await isAdminUser(user))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("seller_applications")
    .select("*, users!user_id(email, display_name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: "Error interno" }, { status: 500 });

  // Firmar las URLs de los documentos privados (válidas 10 min). Solo admin.
  const applications = await Promise.all((data ?? []).map(async (a: any) => {
    const docs = await Promise.all((a.documents ?? []).map(async (doc: any) => {
      let signedUrl: string | null = null;
      try {
        const { data: s } = await supabase.storage.from("seller-docs").createSignedUrl(doc.url, 600);
        signedUrl = s?.signedUrl ?? null;
      } catch { /* ignore */ }
      return { ...doc, signedUrl };
    }));
    return { ...a, documents: docs, applicant: a.users ?? null };
  }));

  return NextResponse.json({ applications });
}

/* ─── PATCH: aprobar / rechazar / pedir más documentación ──────────────────── */
export async function PATCH(req: NextRequest) {
  const admin = await getRequestUser(req);
  if (!admin || !(await isAdminUser(admin))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { applicationId, action, note } = (await req.json()) as {
    applicationId?: string; action?: "approve" | "reject" | "needs_docs"; note?: string;
  };
  if (!applicationId || !["approve", "reject", "needs_docs"].includes(action ?? "")) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data: app } = await supabase.from("seller_applications").select("*").eq("id", applicationId).single();
  if (!app) return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
  const a = app as any;
  const now = new Date().toISOString();

  if (action === "reject" || action === "needs_docs") {
    const status = action === "reject" ? "rejected" : "needs_more_docs";
    await supabase.from("seller_applications").update({
      status, review_note: note ?? null, reviewed_by: admin.id, reviewed_at: now, updated_at: now,
    }).eq("id", applicationId);
    await sendSellerEmail({ to: a.business_email, type: action === "reject" ? "rejected" : "needs_docs", businessName: a.business_name, note });
    await logAudit({ actorId: admin.id, action: `seller.${action}`, targetType: "seller_application", targetId: applicationId, metadata: { note } });
    return NextResponse.json({ ok: true, status });
  }

  // ── approve ──
  // 1) rol vendedor (preservando admin)
  const { data: u } = await supabase.from("users").select("role").eq("id", a.user_id).single();
  if ((u as any)?.role !== "admin") {
    await supabase.from("users").update({ role: "seller" }).eq("id", a.user_id);
    await logAudit({ actorId: admin.id, action: "role.change", targetType: "user", targetId: a.user_id, metadata: { to: "seller" } });
  }

  // 2) crear la tienda si no existe
  let { data: shop } = await supabase.from("shops").select("id").eq("owner_user_id", a.user_id).maybeSingle();
  let shopId = (shop as any)?.id as string | undefined;
  if (!shopId) {
    const { data: city } = await supabase.from("cities").select("id").limit(1).single();
    if (!city) return NextResponse.json({ error: "No hay ciudades configuradas" }, { status: 500 });
    let slug = slugify(a.business_name);
    const { data: clash } = await supabase.from("shops").select("id").eq("slug", slug).maybeSingle();
    if (clash) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: created, error: shopErr } = await supabase.from("shops").insert({
      owner_user_id: a.user_id,
      name: a.business_name,
      slug,
      description: a.description ?? null,
      city_id: (city as any).id,
      // Punto por defecto (centro de Madrid); el vendedor lo ajustará en su panel.
      location_point: "SRID=4326;POINT(-3.7038 40.4168)",
      address: a.fiscal_address,
      phone: a.phone,
      website: a.website ?? null,
      status: "verified",
      active: true,
    }).select("id").single();
    if (shopErr || !created) {
      console.error("[seller-applications approve] shop:", shopErr);
      return NextResponse.json({ error: "No se pudo crear la tienda." }, { status: 500 });
    }
    shopId = (created as any).id;
  }

  await supabase.from("seller_applications").update({
    status: "approved", reviewed_by: admin.id, reviewed_at: now, shop_id: shopId, updated_at: now,
  }).eq("id", applicationId);
  await sendSellerEmail({ to: a.business_email, type: "approved", businessName: a.business_name });
  await logAudit({ actorId: admin.id, action: "seller.approve", targetType: "seller_application", targetId: applicationId, metadata: { shopId } });

  return NextResponse.json({ ok: true, status: "approved", shopId });
}
