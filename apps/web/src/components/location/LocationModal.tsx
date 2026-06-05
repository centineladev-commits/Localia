"use client";

import { useState, useEffect, useRef } from "react";
import { useLocationStore, geocodeQuery, getCurrentPosition, type GeoResult } from "@/store/location.store";

const QUICK_CITIES: GeoResult[] = [
  { label: "Madrid, España",    shortLabel: "Madrid",    lat: 40.4168, lng: -3.7038 },
  { label: "Barcelona, España", shortLabel: "Barcelona", lat: 41.3851, lng:  2.1734 },
  { label: "Valencia, España",  shortLabel: "Valencia",  lat: 39.4699, lng: -0.3763 },
  { label: "Sevilla, España",   shortLabel: "Sevilla",   lat: 37.3891, lng: -5.9845 },
  { label: "Bilbao, España",    shortLabel: "Bilbao",    lat: 43.2630, lng: -2.9350 },
  { label: "Málaga, España",    shortLabel: "Málaga",    lat: 36.7213, lng: -4.4214 },
  { label: "Zaragoza, España",  shortLabel: "Zaragoza",  lat: 41.6488, lng: -0.8891 },
  { label: "Alicante, España",  shortLabel: "Alicante",  lat: 38.3460, lng: -0.4907 },
];

export function LocationModal() {
  const { location, modalOpen, setLocation, closeModal } = useLocationStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (modalOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
    }
  }, [modalOpen]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      const r = await geocodeQuery(query);
      setResults(r);
      setLoading(false);
    }, 400);
  }, [query]);

  async function useMyLocation() {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      const { latitude: lat, longitude: lng } = pos.coords;
      // Reverse geocode
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`;
      const res = await fetch(url, { headers: { "User-Agent": "ZocoApp/1.0" } });
      const data = await res.json();
      const addr = data.address ?? {};
      const short = addr.city ?? addr.town ?? addr.village ?? addr.suburb ?? "Tu ubicación";
      setLocation({ label: data.display_name ?? short, shortLabel: short, lat, lng, zoom: 14 });
    } catch {
      alert("No se pudo obtener tu ubicación. Activa el GPS o escribe tu ciudad.");
    } finally {
      setLocating(false);
    }
  }

  function pick(r: GeoResult) {
    setLocation({ ...r, zoom: 13 });
  }

  if (!modalOpen) return null;

  const showQuick = !query.trim();

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-gray-900">¿Dónde buscas?</h2>
            <p className="text-xs text-gray-400 mt-0.5">Escribe ciudad, barrio, calle o código postal</p>
          </div>
          <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-lg">✕</button>
        </div>

        {/* Search input */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Madrid, Barrio de Salamanca, Calle Serrano..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all"
            />
            {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 animate-pulse">Buscando...</span>}
          </div>
          <button
            onClick={useMyLocation}
            disabled={locating}
            className="mt-2.5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <span className="text-base">{locating ? "⏳" : "📡"}</span>
            {locating ? "Obteniendo ubicación..." : "Usar mi ubicación actual"}
          </button>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {showQuick ? (
            <>
              <p className="px-5 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wide">Ciudades populares</p>
              {QUICK_CITIES.map((c) => (
                <button
                  key={c.shortLabel}
                  onClick={() => pick(c)}
                  className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left ${location?.shortLabel === c.shortLabel ? "bg-emerald-50" : ""}`}
                >
                  <span className="text-xl">🏙️</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{c.shortLabel}</p>
                    <p className="text-xs text-gray-400">España</p>
                  </div>
                  {location?.shortLabel === c.shortLabel && <span className="ml-auto text-emerald-600 font-bold text-sm">✓</span>}
                </button>
              ))}
            </>
          ) : results.length > 0 ? (
            <>
              <p className="px-5 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wide">Resultados</p>
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => pick(r)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-xl">📍</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{r.shortLabel}</p>
                    <p className="text-xs text-gray-400 truncate">{r.label}</p>
                  </div>
                </button>
              ))}
            </>
          ) : !loading && query.trim() ? (
            <div className="px-5 py-8 text-center text-gray-400">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm">No encontramos "{query}"</p>
            </div>
          ) : null}
        </div>

        {location && !query && (
          <div className="px-5 py-3 border-t border-gray-100">
            <button
              onClick={closeModal}
              className="w-full py-3 bg-gray-900 text-white font-black rounded-2xl hover:bg-gray-800 transition-colors"
            >
              Buscar en {location.shortLabel} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
