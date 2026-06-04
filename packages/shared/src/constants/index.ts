// Comisión de la plataforma sobre cada venta (8%)
export const PLATFORM_FEE_PERCENT = 8;

// Radio de búsqueda por defecto en km
export const DEFAULT_SEARCH_RADIUS_KM = 3;

// Zoom del mapa
export const MAP_ZOOM_DEFAULT = 13;
export const MAP_ZOOM_MIN = 10;
export const MAP_ZOOM_MAX = 18;

// Colores de categorías de comercio (para pines del mapa)
export const SHOP_CATEGORY_COLORS: Record<string, string> = {
  alimentacion: "#22c55e",    // verde
  moda: "#ec4899",            // rosa
  electronica: "#3b82f6",     // azul
  hogar: "#f97316",           // naranja
  artesania: "#a855f7",       // morado
  deportes: "#eab308",        // amarillo
  belleza: "#f43f5e",         // rojo
  otros: "#6b7280",           // gris
};

// Tiempo de retención de pago antes de liberar al comercio (días)
export const PAYMENT_HOLD_DAYS = 2;
