// Tipos compartidos entre web, mobile y API

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Respuesta de la API de comercios para el mapa
export interface ShopMapPin {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  categoryId: string;
  categoryColor: string;
  coordinates: Coordinates;
  distanceMeters: number;
  rating: number | null;
  isOpen: boolean;
}

// Filtros del mapa
export interface MapFilters {
  cityId: string;
  categoryId?: string;
  radiusKm?: number;       // 1-10km, default 3
  openNow?: boolean;
  searchQuery?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
}
