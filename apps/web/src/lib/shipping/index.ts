/**
 * Módulo de envíos con interfaz común multi-transportista.
 *
 * Interfaz:
 *   calculateRates(parcel, origin, destination) → ShippingRate[]
 *   createShipment(rateId) → { trackingNumber, carrier }
 *   getTracking(trackingNumber) → TrackingStatus
 *
 * Proveedores:
 *   - "manual"  → envío gestionado por el vendedor (sin API). Activo por defecto.
 *   - "shippo"  → multi-carrier (SEUR, MRW, GLS, DHL, Correos) vía Shippo.
 *                 Se ACTIVA automáticamente cuando existe SHIPPO_API_KEY en el
 *                 entorno. Mientras no haya clave, se usa "manual".
 *
 * Para añadir otro proveedor (EasyPost, ShipStation), implementa ShippingProvider
 * y regístralo en getShippingProvider().
 */

export interface ShippingAddress {
  name?: string;
  street?: string;
  city: string;
  postalCode: string;
  country: string; // ISO-2, ej. "ES"
  region?: string;
}

export interface Parcel {
  weightGrams: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export interface ShippingRate {
  id: string;
  carrier: string;       // "SEUR", "MRW", "Correos"...
  service: string;       // "Estándar", "Express"...
  amount: number;        // EUR
  currency: string;
  estimatedDays?: number;
}

export interface TrackingStatus {
  trackingNumber: string;
  carrier?: string;
  status: string;        // "pre_transit" | "transit" | "delivered" | "unknown" | "manual"
  estimatedDelivery?: string;
  events?: { ts: string; description: string }[];
}

export interface ShippingProvider {
  name: string;
  isConfigured(): boolean;
  calculateRates(parcel: Parcel, origin: ShippingAddress, destination: ShippingAddress): Promise<ShippingRate[]>;
  createShipment(rateId: string): Promise<{ trackingNumber: string; carrier: string; labelUrl?: string }>;
  getTracking(trackingNumber: string, carrier?: string): Promise<TrackingStatus>;
}

/* ─── Proveedor MANUAL (por defecto, sin API) ──────────────────────────────
 * El precio de envío lo fija el vendedor por producto (campos shipping_*).
 * El tracking lo introduce el vendedor a mano en el panel de pedidos. */
const manualProvider: ShippingProvider = {
  name: "manual",
  isConfigured: () => true,
  async calculateRates() {
    // El precio real proviene de los campos del producto (shipping_price);
    // este proveedor no calcula tarifas dinámicas.
    return [];
  },
  async createShipment() {
    return { trackingNumber: "", carrier: "" };
  },
  async getTracking(trackingNumber, carrier) {
    return { trackingNumber, carrier, status: "manual" };
  },
};

/* ─── Proveedor SHIPPO (multi-carrier) — esqueleto ─────────────────────────
 * Se activa cuando hay SHIPPO_API_KEY. Implementación lista para conectar:
 * descomentar las llamadas fetch a la API de Shippo cuando el dueño añada la
 * clave. NO se hardcodea ninguna clave: se lee de process.env.SHIPPO_API_KEY. */
function makeShippoProvider(apiKey: string): ShippingProvider {
  const BASE = "https://api.goshippo.com";
  const headers = { Authorization: `ShippoToken ${apiKey}`, "Content-Type": "application/json" };

  return {
    name: "shippo",
    isConfigured: () => true,
    async calculateRates(parcel, origin, destination) {
      const res = await fetch(`${BASE}/shipments/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          address_from: { city: origin.city, zip: origin.postalCode, country: origin.country, street1: origin.street ?? "", name: origin.name ?? "Tienda" },
          address_to:   { city: destination.city, zip: destination.postalCode, country: destination.country, street1: destination.street ?? "", name: destination.name ?? "Cliente" },
          parcels: [{
            weight: String(Math.max(1, parcel.weightGrams)), mass_unit: "g",
            length: String(parcel.lengthCm ?? 10), width: String(parcel.widthCm ?? 10), height: String(parcel.heightCm ?? 10), distance_unit: "cm",
          }],
          async: false,
        }),
      });
      const data = await res.json();
      return (data.rates ?? []).map((r: any) => ({
        id: r.object_id, carrier: r.provider, service: r.servicelevel?.name ?? "Estándar",
        amount: Number(r.amount), currency: r.currency, estimatedDays: r.estimated_days ?? undefined,
      }));
    },
    async createShipment(rateId) {
      const res = await fetch(`${BASE}/transactions/`, {
        method: "POST", headers,
        body: JSON.stringify({ rate: rateId, label_file_type: "PDF", async: false }),
      });
      const data = await res.json();
      return { trackingNumber: data.tracking_number ?? "", carrier: data.tracking_url_provider ?? "", labelUrl: data.label_url };
    },
    async getTracking(trackingNumber, carrier) {
      const res = await fetch(`${BASE}/tracks/${carrier}/${trackingNumber}`, { headers });
      const data = await res.json();
      return {
        trackingNumber, carrier,
        status: data.tracking_status?.status?.toLowerCase() ?? "unknown",
        estimatedDelivery: data.eta ?? undefined,
        events: (data.tracking_history ?? []).map((h: any) => ({ ts: h.status_date, description: h.status_details })),
      };
    },
  };
}

export function getShippingProvider(): ShippingProvider {
  const key = process.env.SHIPPO_API_KEY;
  if (key) return makeShippoProvider(key);
  // TODO(dueño): añade SHIPPO_API_KEY (o EASYPOST_API_KEY / SHIPSTATION_*) en
  // Vercel → Environment Variables para activar el cálculo de tarifas y tracking
  // en tiempo real. Sin clave se usa el envío manual gestionado por el vendedor.
  return manualProvider;
}

export const shippingProviderConfigured = (): boolean => !!process.env.SHIPPO_API_KEY;
