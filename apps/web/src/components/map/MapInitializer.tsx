"use client";

import { useEffect } from "react";
import { useMapStore } from "@/store/map.store";
import { DEMO_SHOPS } from "@/lib/demo-data";

// Carga los datos de demo al montar. Cuando la BD esté lista,
// reemplazar por un fetch a /api/shops?city_id=...
export function MapInitializer() {
  const { setShops } = useMapStore();

  useEffect(() => {
    setShops(DEMO_SHOPS);
  }, [setShops]);

  return null;
}
