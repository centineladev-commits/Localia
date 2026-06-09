import { getAdminClient } from "./db";

/**
 * Registra una acción sensible en audit_logs (service-role, best-effort).
 * Nunca lanza: la auditoría no debe romper el flujo principal.
 * Acciones: 'seller.apply', 'seller.approve', 'seller.reject', 'role.change',
 *           'product.delete', 'refund.process', 'order.ship'...
 */
export async function logAudit(params: {
  actorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await getAdminClient().from("audit_logs").insert({
      actor_id: params.actorId ?? null,
      action: params.action,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (e) {
    console.error("[audit] no se pudo registrar:", (e as Error)?.message);
  }
}
