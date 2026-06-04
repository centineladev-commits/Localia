"use client";

import { useCallback, useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl";
import type { ShopMapPin, MapFilters } from "@localmarket/shared/types";
import { MAP_ZOOM_DEFAULT, SHOP_CATEGORY_COLORS } from "@localmarket/shared/constants";
import { useMapStore } from "@/store/map.store";
import { MapFiltersBar } from "./MapFiltersBar";
import { ShopPopup } from "./ShopPopup";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// Madrid como ciudad por defecto hasta que el usuario elija
const DEFAULT_VIEWPORT = {
  longitude: -3.7038,
  latitude: 40.4168,
  zoom: MAP_ZOOM_DEFAULT,
};

export function MapView() {
  const { shops, activeShop, setActiveShop, filters } = useMapStore();
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);

  const handleMarkerClick = useCallback((shop: ShopMapPin) => {
    setActiveShop(shop);
  }, [setActiveShop]);

  return (
    <div className="relative w-full h-full">
      {/* Filtros flotantes sobre el mapa */}
      <MapFiltersBar />

      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={viewport}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        <NavigationControl position="bottom-right" />

        {/* Pines de los comercios */}
        {shops.map((shop) => (
          <Marker
            key={shop.id}
            longitude={shop.coordinates.lng}
            latitude={shop.coordinates.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(shop);
            }}
          >
            <ShopMarker shop={shop} isActive={activeShop?.id === shop.id} />
          </Marker>
        ))}

        {/* Popup al seleccionar un comercio */}
        {activeShop && (
          <Popup
            longitude={activeShop.coordinates.lng}
            latitude={activeShop.coordinates.lat}
            anchor="top"
            onClose={() => setActiveShop(null)}
            closeButton={false}
          >
            <ShopPopup shop={activeShop} />
          </Popup>
        )}
      </Map>
    </div>
  );
}

function ShopMarker({ shop, isActive }: { shop: ShopMapPin; isActive: boolean }) {
  const color = SHOP_CATEGORY_COLORS[shop.categoryId] ?? SHOP_CATEGORY_COLORS.otros;

  return (
    <div
      className={`
        w-10 h-10 rounded-full border-2 border-white shadow-md
        flex items-center justify-center cursor-pointer
        transition-transform hover:scale-110
        ${isActive ? "scale-125 ring-2 ring-white ring-offset-1" : ""}
      `}
      style={{ backgroundColor: color }}
    >
      <span className="text-white text-xs font-bold">
        {shop.name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
