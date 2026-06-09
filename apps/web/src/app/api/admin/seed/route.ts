import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db";
import { getRequestUser, isAdminUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

/*
 * Endpoint TEMPORAL de seed (solo admin) para verificar el bucle de devoluciones
 * end-to-end. Crea: 1 comercio (del admin) + 1 producto + 1 pedido entregado.
 * Devuelve el error exacto de cada paso si algo falla (para diagnosticar el
 * esquema real). ELIMINAR tras la verificación.
 */
export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user || !(await isAdminUser(user))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const supabase = getAdminClient();

  // ── Paso 0: asegurar que public.users tiene una fila con el id del auth user ──
  // (causa raíz: el auth user no estaba en public.users → fallaban las FKs y el
  //  guardado de perfil. Reconciliamos por email o insertamos.)
  const { data: byEmail } = await supabase.from("users").select("id, role").eq("email", user.email!).maybeSingle();
  if (byEmail && (byEmail as any).id !== user.id) {
    // alinear el id de la fila existente al del auth user (BD vacía → sin FKs que rompan)
    const { error: reErr } = await supabase.from("users").update({ id: user.id }).eq("email", user.email!);
    if (reErr) return NextResponse.json({ step: "reconcile-users", error: reErr }, { status: 500 });
  } else if (!byEmail) {
    const { error: insErr } = await supabase.from("users").insert({
      id: user.id, email: user.email!, role: "admin", display_name: "Óscar",
    });
    if (insErr) return NextResponse.json({ step: "insert-user", error: insErr }, { status: 500 });
  }
  // Garantizar rol admin por si acaso
  await supabase.from("users").update({ role: "admin" }).eq("id", user.id);

  // Ciudad cualquiera
  const { data: city, error: cityErr } = await supabase.from("cities").select("id").limit(1).single();
  if (cityErr || !city) return NextResponse.json({ step: "city", error: cityErr ?? "sin ciudades" }, { status: 500 });
  const cityId = (city as any).id;

  // Comercio (idempotente por slug)
  let shopId: string;
  const { data: existingShop } = await supabase.from("shops").select("id").eq("slug", "tienda-demo-oscar").maybeSingle();
  if (existingShop) {
    shopId = (existingShop as any).id;
    await supabase.from("shops").update({ status: "verified", active: true }).eq("id", shopId);
  } else {
    const { data: shop, error: shopErr } = await supabase.from("shops").insert({
      owner_user_id: user.id,
      name: "Tienda Demo Óscar",
      slug: "tienda-demo-oscar",
      description: "Comercio de prueba para verificación",
      city_id: cityId,
      location_point: "SRID=4326;POINT(-3.7038 40.4168)",
      status: "verified",
      active: true,
      address: "Calle Mayor 1, Madrid",
    }).select("id").single();
    if (shopErr || !shop) return NextResponse.json({ step: "shop", error: shopErr }, { status: 500 });
    shopId = (shop as any).id;
  }

  // Producto
  const { data: product, error: prodErr } = await supabase.from("products").insert({
    shop_id: shopId,
    city_id: cityId,
    name: "Producto de prueba",
    description: "Para test de devolución",
    price: 19.99,
    stock: 10,
    active: true,
    images: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"],
  }).select("id").single();
  if (prodErr || !product) return NextResponse.json({ step: "product", error: prodErr }, { status: 500 });
  const productId = (product as any).id;

  // Pedido entregado y pagado (comprador = admin), dentro de la ventana de devolución
  const { data: order, error: orderErr } = await supabase.from("orders").insert({
    buyer_user_id: user.id,
    shop_id: shopId,
    status: "delivered",
    subtotal: 19.99,
    platform_fee: 1.30,
    total: 19.99,
    delivery_type: "pickup",
    stripe_payment_id: "pi_seed_test_" + Math.random().toString(36).slice(2, 10),
    paid_at: new Date().toISOString(),
    items: [{ id: productId, name: "Producto de prueba", qty: 1, price: 19.99 }],
  }).select("id").single();
  if (orderErr || !order) return NextResponse.json({ step: "order", error: orderErr }, { status: 500 });

  return NextResponse.json({ ok: true, shopId, productId, orderId: (order as any).id });
}
