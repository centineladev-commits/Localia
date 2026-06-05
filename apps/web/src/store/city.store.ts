"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface City {
  id: string;
  name: string;
  slug: string;
  center: { lat: number; lng: number };
  zoomLevel: number;
}

// Fallback estático si la API no responde aún (antes de migración Supabase)
export const SUPPORTED_CITIES: City[] = [
  { id: "madrid",    name: "Madrid",    slug: "madrid",    center: { lat: 40.4168, lng: -3.7038 }, zoomLevel: 13 },
  { id: "barcelona", name: "Barcelona", slug: "barcelona", center: { lat: 41.3851, lng: 2.1734  }, zoomLevel: 13 },
  { id: "valencia",  name: "Valencia",  slug: "valencia",  center: { lat: 39.4699, lng: -0.3763 }, zoomLevel: 13 },
  { id: "sevilla",   name: "Sevilla",   slug: "sevilla",   center: { lat: 37.3891, lng: -5.9845 }, zoomLevel: 13 },
  { id: "bilbao",    name: "Bilbao",    slug: "bilbao",    center: { lat: 43.2630, lng: -2.9350 }, zoomLevel: 13 },
  { id: "malaga",    name: "Málaga",    slug: "malaga",    center: { lat: 36.7213, lng: -4.4214 }, zoomLevel: 13 },
  { id: "zaragoza",  name: "Zaragoza",  slug: "zaragoza",  center: { lat: 41.6488, lng: -0.8891 }, zoomLevel: 13 },
];

// Coordenadas de ciudades para enriquecer la respuesta de la API
const CITY_COORDS: Record<string, { lat: number; lng: number; zoom: number }> = {
  madrid:    { lat: 40.4168, lng: -3.7038, zoom: 13 },
  barcelona: { lat: 41.3851, lng: 2.1734,  zoom: 13 },
  valencia:  { lat: 39.4699, lng: -0.3763, zoom: 13 },
  sevilla:   { lat: 37.3891, lng: -5.9845, zoom: 13 },
  bilbao:    { lat: 43.2630, lng: -2.9350, zoom: 13 },
  malaga:    { lat: 36.7213, lng: -4.4214, zoom: 13 },
  zaragoza:  { lat: 41.6488, lng: -0.8891, zoom: 13 },
};

interface CityState {
  activeCity: City | null;
  cities: City[];
  modalOpen: boolean;
  setCity: (city: City) => void;
  setCities: (cities: City[]) => void;
  clearCity: () => void;
  openModal: () => void;
  closeModal: () => void;
}

export const useCityStore = create<CityState>()(
  persist(
    (set) => ({
      activeCity: null,
      cities: SUPPORTED_CITIES,
      modalOpen: false,
      setCity: (city) => set({ activeCity: city, modalOpen: false }),
      setCities: (cities) => set({ cities }),
      clearCity: () => set({ activeCity: null }),
      openModal: () => set({ modalOpen: true }),
      closeModal: () => set({ modalOpen: false }),
    }),
    {
      name: "localmarket-city",
      partialize: (state) => ({ activeCity: state.activeCity }),
    }
  )
);

// Carga ciudades desde la API al inicializar (enriquece con coords locales si faltan)
export async function loadCitiesFromApi(setCities: (cities: City[]) => void) {
  try {
    const res = await fetch("/api/cities");
    const json = await res.json();
    if (json.cities && json.cities.length > 0) {
      const cities: City[] = json.cities.map((c: any) => {
        const coords = CITY_COORDS[c.slug] ?? { lat: 40.4168, lng: -3.7038, zoom: 13 };
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          center: { lat: coords.lat, lng: coords.lng },
          zoomLevel: c.zoom_level ?? coords.zoom,
        };
      });
      setCities(cities);
    }
  } catch {
    // fallback ya establecido en el store
  }
}
