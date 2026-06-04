export interface Coordinates {
  lat: number;
  lng: number;
}

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

export interface MapFilters {
  cityId: string;
  categoryId?: string;
  radiusKm?: number;
  openNow?: boolean;
  searchQuery?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
