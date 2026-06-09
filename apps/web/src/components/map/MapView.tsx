"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { ShopMapPin } from "@/lib/types";
import { MAP_ZOOM_DEFAULT, MAP_ZOOM_MAX } from "@/lib/constants";
import { SHOP_CATEGORY_COLORS } from "@/lib/constants";
import { useMapStore } from "@/store/map.store";
import { useLocationStore } from "@/store/location.store";
// Leaflet CSS importado en globals.css (igual patrón que antes con maplibre).

/*
 * MapView usa LEAFLET (tiles ráster sobre DOM/Canvas2D), NO un motor WebGL
 * (maplibre/react-map-gl). Motivo: en equipos sin GPU, el WebGL de Chrome cae
 * al renderizador por software ("Microsoft Basic Render Driver" / SwiftShader),
 * donde maplibre deja el mapa EN BLANCO (los tiles vectoriales necesitan shaders
 * de GPU) y además react-map-gl + el worker disparaban un crash de React (#329).
 * Leaflet dibuja tiles ráster como imágenes normales: funciona en CUALQUIER
 * equipo, con o sin GPU. Esto resuelve de raíz el problema reincidente del mapa.
 */

const MADRID: [number, number] = [40.4168, -3.7038];

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

function popupHtml(shop: ShopMapPin): string {
  const color = SHOP_CATEGORY_COLORS[shop.categoryId] ?? SHOP_CATEGORY_COLORS.otros;
  const distance =
    shop.distanceMeters > 0
      ? shop.distanceMeters < 1000
        ? `${Math.round(shop.distanceMeters)} m de aquí`
        : `${(shop.distanceMeters / 1000).toFixed(1)} km de aquí`
      : "";
  const header = shop.coverUrl
    ? `<img src="${escapeHtml(shop.coverUrl)}" alt="" style="width:100%;height:88px;object-fit:cover;display:block"/>`
    : `<div style="width:100%;height:88px;background:linear-gradient(135deg,${color}cc,${color})"></div>`;
  const logo = shop.logoUrl
    ? `<img src="${escapeHtml(shop.logoUrl)}" alt="" style="width:40px;height:40px;border-radius:12px;object-fit:cover;border:2px solid #fff;flex:none"/>`
    : `<div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;background:${color};border:2px solid #fff;flex:none">${escapeHtml(
        shop.name.charAt(0).toUpperCase()
      )}</div>`;
  const rating =
    shop.rating != null
      ? `<span style="display:inline-flex;align-items:center;gap:3px;font-size:12px;font-weight:600;color:#475569;background:#fffbeb;padding:2px 8px;border-radius:9999px">★ ${shop.rating.toFixed(
          1
        )}</span>`
      : "";
  const openBadge = `<span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;padding:2px 8px;border-radius:9999px;${
    shop.isOpen ? "background:#ecfdf5;color:#047857" : "background:#f1f5f9;color:#64748b"
  }">${shop.isOpen ? "Abierto" : "Cerrado"}</span>`;
  return `
    <div style="width:236px">
      ${header}
      <div style="padding:12px">
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
          ${logo}
          <div style="min-width:0">
            <p style="font-weight:700;font-size:14px;color:#0f172a;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(
              shop.name
            )}</p>
            ${distance ? `<p style="font-size:12px;color:#94a3b8;margin:2px 0 0">${distance}</p>` : ""}
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:10px">${rating}${openBadge}</div>
        <a href="/tienda/${encodeURIComponent(
          shop.slug
        )}" style="display:block;text-align:center;padding:8px;font-weight:600;font-size:14px;color:#fff;border-radius:12px;background:${color};text-decoration:none">Ver escaparate ›</a>
      </div>
    </div>`;
}

function markerIcon(shop: ShopMapPin): L.DivIcon {
  const color = SHOP_CATEGORY_COLORS[shop.categoryId] ?? SHOP_CATEGORY_COLORS.otros;
  return L.divIcon({
    className: "localia-marker",
    html: `<div style="width:34px;height:34px;border-radius:9999px;border:2px solid #fff;box-shadow:0 2px 6px rgba(15,23,42,.35);display:flex;align-items:center;justify-content:center;background:${color}"><span style="color:#fff;font-size:12px;font-weight:800;line-height:1">${escapeHtml(
      shop.name.charAt(0).toUpperCase()
    )}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  });
}

export function MapView() {
  const { shops, setActiveShop, isLoading } = useMapStore();
  const { location, openModal } = useLocationStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Inicializar el mapa una sola vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: location ? [location.lat, location.lng] : MADRID,
      zoom: location?.zoom ?? MAP_ZOOM_DEFAULT,
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: MAP_ZOOM_MAX + 4,
      detectRetina: true,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Leaflet a veces calcula mal el tamaño si el contenedor se monta con flex;
    // forzamos un recálculo en el siguiente frame.
    const t = setTimeout(() => map.invalidateSize(), 60);

    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mover la vista cuando cambia la ubicación
  useEffect(() => {
    if (mapRef.current && location) {
      mapRef.current.flyTo([location.lat, location.lng], location.zoom ?? MAP_ZOOM_DEFAULT, {
        duration: 0.7,
      });
    }
  }, [location?.lat, location?.lng, location?.zoom]);

  // Reconstruir marcadores cuando cambian los comercios
  useEffect(() => {
    const group = layerRef.current;
    if (!group) return;
    group.clearLayers();

    shops.forEach((shop) => {
      const marker = L.marker([shop.coordinates.lat, shop.coordinates.lng], {
        icon: markerIcon(shop),
        title: shop.name,
      }).bindPopup(popupHtml(shop), {
        closeButton: true,
        maxWidth: 260,
        minWidth: 236,
        className: "localia-popup",
      });
      marker.on("popupopen", () => setActiveShop(shop));
      marker.on("popupclose", () => setActiveShop(null));
      group.addLayer(marker);
    });
  }, [shops, setActiveShop]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {isLoading && (
        <div className="absolute inset-0 z-[1100] flex items-center justify-center bg-white/40 pointer-events-none">
          <div className="bg-white rounded-full px-4 py-2 shadow-md text-sm font-semibold text-slate-600 animate-pulse">
            Cargando comercios...
          </div>
        </div>
      )}

      {!location && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1100] pointer-events-none text-center">
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
    </div>
  );
}
