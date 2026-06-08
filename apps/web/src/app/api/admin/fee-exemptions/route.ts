import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

/** GET /api/admin/fee-exemptions?shop_id=... — lista exenciones (activas y pasadas) de un comercio */
export async function GET(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const shopId = req.nextUrl.searchParams.get("shop_id") ?? "";
  const supabase = getAdminClient();

  let q = supabase
    .from("fee_exemptions")
    .select("*, shops(name, slug)")
    .order("created_at", { ascending: false });

  if (shopId) q = q.eq("shop_id", shopId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exemptions: data ?? [] });
}

/** POST /api/admin/fee-exemptions — conceder nueva exención */
export async function POST(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { shop_id, granted_by, starts_at, ends_at, reason } = body;

  if (!shop_id || !ends_at) {
    return NextResponse.json({ error: "shop_id y ends_at son obligatorios" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("fee_exemptions")
    .insert({ shop_id, granted_by: granted_by ?? null, starts_at: starts_at ?? new Date().toISOString(), ends_at, reason: reason ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exemption: data }, { status: 201 });
}

/** DELETE /api/admin/fee-exemptions?id=... — revocar exención */
export async function DELETE(req: NextRequest) {
  if (!await isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const supabase = getAdminClient();
  const { error } = await supabase.from("fee_exemptions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
