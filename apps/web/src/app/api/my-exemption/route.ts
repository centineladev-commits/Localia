import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/my-exemption?shop_id=... — devuelve la exención activa del comercio si existe */
export async function GET(req: NextRequest) {
  const shopId = req.nextUrl.searchParams.get("shop_id");
  if (!shopId) return NextResponse.json({ exemption: null });

  const supabase = getAdminClient();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("fee_exemptions")
    .select("id, starts_at, ends_at, reason")
    .eq("shop_id", shopId)
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("ends_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ exemption: data ?? null });
}
