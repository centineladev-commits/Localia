import { getAdminClient } from "./db";

/**
 * Comisión de la plataforma (%) configurable desde platform_settings.
 * Soporta override por categoría (commission_by_category). El cálculo SIEMPRE
 * se hace en servidor, nunca con datos del cliente.
 * Fallback al 8% si la tabla no existe aún o falla.
 */
export async function getCommissionPercent(category?: string | null): Promise<number> {
  try {
    const supabase = getAdminClient();
    const { data } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["commission_percent", "commission_by_category"]);

    const rows = (data ?? []) as { key: string; value: any }[];
    const global = Number(rows.find((r) => r.key === "commission_percent")?.value ?? 8);
    const byCat = rows.find((r) => r.key === "commission_by_category")?.value ?? {};
    if (category && byCat && typeof byCat === "object" && byCat[category] != null) {
      return Number(byCat[category]);
    }
    return Number.isFinite(global) ? global : 8;
  } catch {
    return 8;
  }
}

/** ¿Los productos nuevos requieren moderación de admin antes de publicarse? */
export async function productModerationEnabled(): Promise<boolean> {
  try {
    const { data } = await getAdminClient()
      .from("platform_settings").select("value").eq("key", "product_moderation").single();
    return (data as any)?.value === true;
  } catch {
    return false;
  }
}
