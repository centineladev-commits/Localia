"use client";

import { useCallback, useState, useEffect } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import type { ShopMapPin } from "@/lib/types";
import { MAP_ZOOM_DEFAULT, SHOP_CATEGORY_COLORS } from "@/lib/constants";
import { useMapStore } from "@/store/map.store";
import { useLocationStore } from "@/store/location.store";
import { ShopPopup } from "./ShopPopup";
// CSS imported in globals.css to avoid dynamic-import resolution issues

// Estilo CARTO Positron — gratuito, sin token
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const DEFAULT_VIEWPORT = { longitude: -3.7038, latitude: 40.4168, zoom: MAP_ZOOM_DEFAULT };

export function MapView() {
  const { shops, activeShop, setActiveShop, isLoading } = useMapStore();
  const { location, openModal } = useLocationStore();
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);

  useEffect(() => {
    if (location) setViewport({ longitude: location.lng, latitude: location.lat, zoom: location.zoom });
  }, [location?.lat, location?.lng]);

  const handleMarkerClick = useCallback((shop: ShopMapPin) => setActiveShop(shop), [setActiveShop]);

  return (
    <div className="absolute inset-0">
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 pointer-events-none">
          <div className="bg-white rounded-full px-4 py-2 shadow-md text-sm font-semibold text-slate-600 animate-pulse">
            Cargando comercios...
          </div>
        </div>
      )}
      {!location && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none text-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-8 py-6 shadow-xl pointer-events-auto border border-slate-100 max-w-xs">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
            </div>
            <p className="font-black text-slate-900 text-lg leading-tight">Descubre comercios cerca de ti</p>
            <p className="text-slate-500 text-sm mt-1.5 leading-snug">Selecciona tu ciudad para ver las tiendas del barrio</p>
            <button onClick={openModal} className="mt-4 w-full px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-full hover:bg-indigo-700 transition-colors shadow-sm">
              Elegir ubicación
            </button>
          </div>
        </div>
      )}
      <Map
        longitude={viewport.longitude}
        latitude={viewport.latitude}
        zoom={viewport.zoom}
        onMove={(e) => setViewport(e.viewState)}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
      >
        <NavigationControl position="bottom-right" />
        {shops.map((shop) => (
          <Marker key={shop.id} longitude={shop.coordinates.lng} latitude={shop.coordinates.lat} anchor="bottom"
            onClick={(e) => { e.originalEvent.stopPropagation(); handleMarkerClick(shop); }}>
            <ShopMarker shop={shop} isActive={activeShop?.id === shop.id} />
          </Marker>
        ))}
        {activeShop && (
          <Popup longitude={activeShop.coordinates.lng} latitude={activeShop.coordinates.lat}
            anchor="top" onClose={() => setActiveShop(null)} closeButton={false}>
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
    <div className={`w-9 h-9 rounded-full border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${isActive ? "scale-125 ring-2 ring-white ring-offset-1" : ""}`}
      style={{ backgroundColor: color }}>
      <span className="text-white text-xs font-black">{shop.name.charAt(0)}</span>
    </div>
  );
}
