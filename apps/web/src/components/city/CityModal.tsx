"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, X, Navigation, Check } from "lucide-react";
import { useCityStore, SUPPORTED_CITIES, loadCitiesFromApi, type City } from "@/store/city.store";
import { geocodeQuery, getCurrentPosition, type GeoResult } from "@/store/location.store";

export function CityModal() {
  const { activeCity, modalOpen, setCity, clearCity, setCities, closeModal } = useCityStore();
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const inputRef  = useRef<HTMLInputElement>(null);
  const debounce  = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    loadCitiesFromApi(setCities);
  }, []);

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
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`;
      const res = await fetch(url, { headers: { "User-Agent": "LocalMarket/1.0" } });
      const data = await res.json();
      const addr = data.address ?? {};
      const short = addr.city ?? addr.town ?? addr.village ?? addr.suburb ?? "Mi ubicación";
      const match = SUPPORTED_CITIES.find((c) => c.name.toLowerCase() === short.toLowerCase());
      setCity(match ?? { id: "", name: short, slug: short.toLowerCase().replace(/\s+/g, "-"), center: { lat, lng }, zoomLevel: 14 });
    } catch {
      alert("No se pudo obtener tu ubicación. Activa el GPS o escribe tu ciudad.");
    } finally {
      setLocating(false);
    }
  }

  function pickCity(city: City) {
    setCity(city);
  }

  function pickCustom(r: GeoResult) {
    const match = SUPPORTED_CITIES.find(
      (c) => c.name.toLowerCase() === r.shortLabel.toLowerCase()
    );
    setCity(
      match ?? {
        id: "",
        name: r.shortLabel,
        slug: r.shortLabel.toLowerCase().replace(/\s+/g, "-"),
        center: { lat: r.lat, lng: r.lng },
        zoomLevel: 13,
      }
    );
  }

  if (!modalOpen) return null;

  const showQuick = !query.trim();

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />

      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900">¿Dónde buscas?</h2>
            <p className="text-xs text-slate-400 mt-0.5">Ciudad, barrio o cualquier lugar de España</p>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 py-3 border-b border-slate-100 space-y-2.5">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Madrid, Gracia, Chueca, Bilbao..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all placeholder:text-slate-400"
            />
            {loading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 animate-pulse">
                Buscando...
              </span>
            )}
          </div>
          <button
            onClick={useMyLocation}
            disabled={locating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            <Navigation className="w-4 h-4 text-indigo-500" />
            {locating ? "Obteniendo ubicación..." : "Usar mi ubicación actual"}
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto">
          {showQuick ? (
            <>
              {activeCity && (
                <div className="px-5 pt-3">
                  <button
                    onClick={() => { clearCity(); closeModal(); }}
                    className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition-colors"
                  >
                    Ver todos los productos (sin filtro de ciudad)
                  </button>
                </div>
              )}
              <p className="px-5 pt-3 pb-1 text-xs font-bold text-slate-400 uppercase tracking-wide">
                Ciudades principales
              </p>
              {SUPPORTED_CITIES.map((city) => {
                const isActive = activeCity?.id === city.id && city.id !== "";
                return (
                  <button
                    key={city.id}
                    onClick={() => pickCity(city)}
                    className={`w-full flex items-center gap-3 px-5 py-3 transition-colors text-left ${
                      isActive ? "bg-indigo-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-indigo-100" : "bg-slate-100"}`}>
                      <MapPin className={`w-3.5 h-3.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isActive ? "text-indigo-700" : "text-slate-800"}`}>{city.name}</p>
                      <p className="text-xs text-slate-400">España</p>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-indigo-500 shrink-0" />}
                  </button>
                );
              })}
            </>
          ) : results.length > 0 ? (
            <>
              <p className="px-5 pt-3 pb-1 text-xs font-bold text-slate-400 uppercase tracking-wide">
                Resultados
              </p>
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => pickCustom(r)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{r.shortLabel}</p>
                    <p className="text-xs text-slate-400 truncate">{r.label}</p>
                  </div>
                </button>
              ))}
            </>
          ) : !loading && query.trim() ? (
            <div className="px-5 py-8 text-center text-slate-400">
              <p className="text-sm">No encontramos &quot;{query}&quot;</p>
            </div>
          ) : null}
        </div>

        {/* Confirm button when city already selected */}
        {activeCity && !query && (
          <div className="px-5 py-3 border-t border-slate-100">
            <button
              onClick={closeModal}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors text-sm"
            >
              Buscar en {activeCity.name}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
