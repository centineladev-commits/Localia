import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db";
import { getRequestUser, isAdminUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

/*
 * Endpoint TEMPORAL (solo admin) para eliminar los datos de prueba del seed
 * (comercio "tienda-demo-oscar" + su producto + pedido + devolución).
 * NO toca la fila public.users reconciliada (eso es un arreglo permanente).
 * ELIMINAR tras usarlo.
 */
export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user || !(await isAdminUser(user))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const supabase = getAdminClient();

  const { data: shop } = await supabase.from("shops").select("id").eq("slug", "tienda-demo-oscar").maybeSingle();
  if (!shop) return NextResponse.json({ ok: true, note: "no había datos de prueba" });
  const shopId = (shop as any).id;

  // Orden por FKs: returns → orders → products → shop
  const r1 = await supabase.from("returns").delete().eq("shop_id", shopId);
  const r2 = await supabase.from("orders").delete().eq("shop_id", shopId);
  const r3 = await supabase.from("products").delete().eq("shop_id", shopId);
  const r4 = await supabase.from("shops").delete().eq("id", shopId);

  const errors = {
    returns: r1.error?.message ?? null,
    orders: r2.error?.message ?? null,
    products: r3.error?.message ?? null,
    shop: r4.error?.message ?? null,
  };
  const ok = !r1.error && !r2.error && !r3.error && !r4.error;
  return NextResponse.json({ ok, errors });
}
