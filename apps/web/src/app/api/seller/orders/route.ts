import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/db";
import { getRequestUser, isAdminUser } from "@/lib/auth-server";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const ALLOWED_STATUS = new Set(["processing", "ready", "shipped", "delivered", "completed", "cancelled"]);

/**
 * Actualiza el estado de un pedido y/o su información de envío.
 * Autorizado SOLO para el dueño de la tienda del pedido o un admin (servidor),
 * en lugar del update client-side directo a Supabase (cierra el agujero que
 * señaló la auditoría: las transiciones de estado se validan en servidor).
 */
export async function PATCH(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { orderId, status, trackingNumber, carrier } = (await req.json()) as {
    orderId?: string; status?: string; trackingNumber?: string; carrier?: string;
  };
  if (!orderId) return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
  if (status && !ALLOWED_STATUS.has(status)) {
    return NextResponse.json({ error: "Estado no permitido" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data: order } = await supabase.from("orders").select("id, shop_id, status").eq("id", orderId).single();
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  // Autorización: dueño de la tienda o admin
  const admin = await isAdminUser(user);
  let authorized = admin;
  if (!authorized) {
    const { data: shop } = await supabase.from("shops").select("owner_user_id").eq("id", (order as any).shop_id).single();
    authorized = (shop as any)?.owner_user_id === user.id;
  }
  if (!authorized) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { updated_at: now };
  if (status) update.status = status;
  if (trackingNumber !== undefined) update.tracking_number = trackingNumber || null;
  if (carrier !== undefined) update.carrier = carrier || null;
  if (status === "shipped") update.shipped_at = now;

  const { error } = await supabase.from("orders").update(update).eq("id", orderId);
  if (error) {
    console.error("[seller/orders PATCH]", error);
    return NextResponse.json({ error: "No se pudo actualizar el pedido" }, { status: 500 });
  }

  await logAudit({
    actorId: user.id, action: "order.update", targetType: "order", targetId: orderId,
    metadata: { status, trackingNumber, carrier },
  });

  return NextResponse.json({ ok: true });
}
