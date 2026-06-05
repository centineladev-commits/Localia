"use client";

import { useEffect } from "react";
import { useMapStore } from "@/store/map.store";
import { useLocationStore } from "@/store/location.store";
import { DEMO_SHOPS } from "@/lib/demo-data";
import { SHOP_CATEGORY_COLORS } from "@/lib/constants";
import type { ShopMapPin } from "@/lib/types";

export function MapInitializer() {
  const { setShops, setFilters, setLoading, filters } = useMapStore();
  const { location } = useLocationStore();

  useEffect(() => {
    if (!location) {
      setShops(DEMO_SHOPS.map((s) => ({ ...s, coverUrl: s.coverUrl ?? null })));
      return;
    }

    const params = new URLSearchParams({
      lat: String(location.lat),
      lng: String(location.lng),
      radius_km: "5",
      city_id: "11111111-0000-0000-0000-000000000001", // Madrid fallback
    });
    if (filters.categoryId) params.set("category_id", filters.categoryId);

    setLoading(true);
    fetch(`/api/shops?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.shops?.length > 0) {
          const pins: ShopMapPin[] = json.shops.map((s: any) => ({
            id: s.id, name: s.name, slug: s.slug, logoUrl: s.logo_url ?? null,
            coverUrl: s.cover_url ?? null,
            categoryId: s.category_id,
            categoryColor: SHOP_CATEGORY_COLORS[s.category_id] ?? SHOP_CATEGORY_COLORS.otros,
            coordinates: { lat: s.lat ?? location.lat, lng: s.lng ?? location.lng },
            distanceMeters: s.distance_m ?? 0, rating: s.rating ?? null, isOpen: s.is_open ?? true,
          }));
          setShops(pins);
        } else {
          setShops(DEMO_SHOPS.map((s) => ({ ...s, coverUrl: s.coverUrl ?? null })));
        }
      })
      .catch(() => setShops(DEMO_SHOPS))
      .finally(() => setLoading(false));
  }, [location, filters.categoryId]);

  return null;
}
