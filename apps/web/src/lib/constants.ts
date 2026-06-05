// Re-exporta desde shared para uso en la web
export const PLATFORM_FEE_PERCENT = 8; // fallback legacy
export const DEFAULT_SEARCH_RADIUS_KM = 3;

// ── Escalera de tarifas ──────────────────────────────────────────────────────
export interface FeeTier {
  min: number;           // subtotal mínimo (exclusivo)
  max: number;           // subtotal máximo (inclusivo)
  feePercent: number;    // comisión plataforma
  shippingFee: number;   // coste envío local_delivery
}

export const FEE_TIERS: FeeTier[] = [
  { min: 0,   max: 10,       feePercent: 8,    shippingFee: 3.50 },
  { min: 10,  max: 25,       feePercent: 6.5,  shippingFee: 2.90 },
  { min: 25,  max: 50,       feePercent: 4,    shippingFee: 2.50 },
  { min: 50,  max: Infinity, feePercent: 3.25, shippingFee: 0    },
];

export function getTier(subtotal: number): FeeTier {
  return FEE_TIERS.find((t) => subtotal > t.min && subtotal <= t.max) ?? FEE_TIERS[FEE_TIERS.length - 1];
}

export function calcFee(subtotal: number): number {
  return +(subtotal * getTier(subtotal).feePercent / 100).toFixed(2);
}

export function calcShipping(subtotal: number, deliveryType: "pickup" | "local_delivery"): number {
  if (deliveryType === "pickup") return 0;
  return getTier(subtotal).shippingFee;
}
export const MAP_ZOOM_DEFAULT = 13;
export const MAP_ZOOM_MIN = 10;
export const MAP_ZOOM_MAX = 18;

export const SHOP_CATEGORY_COLORS: Record<string, string> = {
  alimentacion: "#22c55e",
  moda: "#ec4899",
  electronica: "#3b82f6",
  hogar: "#f97316",
  artesania: "#a855f7",
  deportes: "#eab308",
  belleza: "#f43f5e",
  otros: "#6b7280",
};
