"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SelectedLocation {
  label: string;
  shortLabel: string;
  lat: number;
  lng: number;
  zoom: number;
}

interface LocationState {
  location: SelectedLocation | null;
  radius: number;
  modalOpen: boolean;
  setLocation: (loc: SelectedLocation) => void;
  setRadius: (r: number) => void;
  openModal: () => void;
  closeModal: () => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: null,
      radius: 5,
      modalOpen: false,
      setLocation: (location) => set({ location, modalOpen: false }),
      setRadius: (radius) => set({ radius }),
      openModal: () => set({ modalOpen: true }),
      closeModal: () => set({ modalOpen: false }),
      clearLocation: () => set({ location: null }),
    }),
    {
      name: "zoco-location",
      partialize: (s) => ({ location: s.location, radius: s.radius }),
    }
  )
);

// Geocoding con Nominatim (OpenStreetMap) — sin API key
export interface GeoResult {
  label: string;
  shortLabel: string;
  lat: number;
  lng: number;
}

export async function geocodeQuery(query: string): Promise<GeoResult[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=es&limit=6&addressdetails=1&accept-language=es`;
    const res = await fetch(url, { headers: { "User-Agent": "ZocoApp/1.0" } });
    const data: any[] = await res.json();
    return data.map((f) => {
      const addr = f.address ?? {};
      const short = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county ?? query;
      return {
        label: f.display_name,
        shortLabel: short,
        lat: parseFloat(f.lat),
        lng: parseFloat(f.lon),
      };
    });
  } catch {
    return [];
  }
}

// Geolocalización del dispositivo
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
  );
}
