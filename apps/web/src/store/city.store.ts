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

export const SUPPORTED_CITIES: City[] = [
  { id: "madrid",    name: "Madrid",    slug: "madrid",    center: { lat: 40.4168, lng: -3.7038 }, zoomLevel: 13 },
  { id: "barcelona", name: "Barcelona", slug: "barcelona", center: { lat: 41.3851, lng: 2.1734  }, zoomLevel: 13 },
  { id: "valencia",  name: "Valencia",  slug: "valencia",  center: { lat: 39.4699, lng: -0.3763 }, zoomLevel: 13 },
  { id: "sevilla",   name: "Sevilla",   slug: "sevilla",   center: { lat: 37.3891, lng: -5.9845 }, zoomLevel: 13 },
  { id: "bilbao",    name: "Bilbao",    slug: "bilbao",    center: { lat: 43.2630, lng: -2.9350 }, zoomLevel: 13 },
  { id: "malaga",    name: "Málaga",    slug: "malaga",    center: { lat: 36.7213, lng: -4.4214 }, zoomLevel: 13 },
  { id: "zaragoza",  name: "Zaragoza",  slug: "zaragoza",  center: { lat: 41.6488, lng: -0.8891 }, zoomLevel: 13 },
];

interface CityState {
  activeCity: City | null;
  modalOpen: boolean;
  setCity: (city: City) => void;
  openModal: () => void;
  closeModal: () => void;
}

export const useCityStore = create<CityState>()(
  persist(
    (set) => ({
      activeCity: null,
      modalOpen: false,
      setCity: (city) => set({ activeCity: city, modalOpen: false }),
      openModal: () => set({ modalOpen: true }),
      closeModal: () => set({ modalOpen: false }),
    }),
    { name: "localmarket-city" }
  )
);
