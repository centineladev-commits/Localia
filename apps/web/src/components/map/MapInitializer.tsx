"use client";

import { useEffect } from "react";
import { useMapStore } from "@/store/map.store";
import { useCityStore } from "@/store/city.store";
import { DEMO_SHOPS } from "@/lib/demo-data";

export function MapInitializer() {
  const { setShops, setFilters } = useMapStore();
  const { activeCity } = useCityStore();

  useEffect(() => {
    // En producción: fetch("/api/shops?city_id=...") según activeCity
    // De momento cargamos todos los datos de demo
    setShops(DEMO_SHOPS);
    if (activeCity) {
      setFilters({ cityId: activeCity.id });
    }
  }, [activeCity, setShops, setFilters]);

  return null;
}
