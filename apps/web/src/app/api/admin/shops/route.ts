import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

/* ─── GET: lista de comercios (para verificación) ─────────────────────────── */
export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("shops")
    .select("id, name, slug, status, active, address, phone, created_at, users!owner_user_id(display_name, email)")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("[admin/shops GET]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
  const shops = (data ?? []).map((s: any) => ({
    id: s.id, name: s.name, slug: s.slug, status: s.status, active: s.active,
    address: s.address, phone: s.phone, created_at: s.created_at,
    owner: s.users ?? null,
  }));
  return NextResponse.json({ shops });
}

/* ─── PATCH: cambiar el estado de verificación de un comercio ─────────────── */
export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { shopId, status } = (await req.json()) as { shopId?: string; status?: string };
  if (!shopId || !["pending", "verified", "suspended"].includes(status ?? "")) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const supabase = getAdminClient();
  // verified → visible (active=true); suspended → oculto (active=false)
  const active = status === "verified";
  const { error } = await supabase
    .from("shops")
    .update({ status, active, updated_at: new Date().toISOString() })
    .eq("id", shopId);

  if (error) {
    console.error("[admin/shops PATCH]", error);
    return NextResponse.json({ error: "No se pudo actualizar el comercio" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, status });
}
