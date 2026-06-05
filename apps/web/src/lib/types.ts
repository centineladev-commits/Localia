export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  categoryId: string;
  stock: number;
  tags: string[];
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverUrl?: string | null;
  categoryId: string;
  categoryColor: string;
  categoryName?: string;
  coordinates: Coordinates;
  distanceMeters: number;
  rating: number | null;
  isOpen: boolean;
  address: string;
  phone: string;
  description: string;
  openingHours: string;
  products?: Product[];
}

export interface ShopMapPin {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverUrl: string | null;
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
