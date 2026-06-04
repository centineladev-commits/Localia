import { create } from "zustand";
import type { ShopMapPin, MapFilters } from "@/lib/types";
import { DEFAULT_SEARCH_RADIUS_KM } from "@/lib/constants";

interface MapState {
  shops: ShopMapPin[];
  activeShop: ShopMapPin | null;
  filters: MapFilters;
  isLoading: boolean;

  setShops: (shops: ShopMapPin[]) => void;
  setActiveShop: (shop: ShopMapPin | null) => void;
  setFilters: (filters: Partial<MapFilters>) => void;
  setLoading: (loading: boolean) => void;
}

export const useMapStore = create<MapState>((set) => ({
  shops: [],
  activeShop: null,
  filters: {
    cityId: "",
    radiusKm: DEFAULT_SEARCH_RADIUS_KM,
  },
  isLoading: false,

  setShops: (shops) => set({ shops }),
  setActiveShop: (activeShop) => set({ activeShop }),
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  setLoading: (isLoading) => set({ isLoading }),
}));
