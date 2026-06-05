"use client";

import { useState, useRef, useEffect } from "react";

export interface Filters {
  q: string;
  category: string;
  priceMin: string;
  priceMax: string;
  sort: string;
  radius: number;
}

const CATS = [
  { slug: "",             label: "Todo",         icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
  { slug: "alimentacion", label: "Alimentación",  icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" },
  { slug: "moda",         label: "Moda",          icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" },
  { slug: "electronica",  label: "Electrónica",   icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" },
  { slug: "hogar",        label: "Hogar",         icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { slug: "artesania",    label: "Artesanía",     icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" },
  { slug: "deportes",     label: "Deportes",      icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { slug: "belleza",      label: "Belleza",       icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
];

const SORT_OPTIONS = [
  { value: "newest",     label: "Más reciente" },
  { value: "price_asc",  label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
];

interface Props {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  total: number;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function SearchFilters({ filters, onChange, total, mobileOpen, onMobileClose }: Props) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [localMin, setLocalMin] = useState(filters.priceMin);
  const [localMax, setLocalMax] = useState(filters.priceMax);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setPanelOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function applyPrice() {
    onChange({ priceMin: localMin, priceMax: localMax });
  }

  const activeFilters = [filters.category, filters.priceMin, filters.priceMax]
    .filter(Boolean).length + (filters.sort !== "newest" ? 1 : 0);

  const filterPanel = (
    <div className="space-y-6">
      {/* Ordenar */}
      <div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Ordenar por</p>
        <div className="space-y-0.5">
          {SORT_OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                filters.sort === o.value
                  ? "bg-indigo-50 text-indigo-700"
                  : "hover:bg-slate-50 text-slate-600"
              }`}
            >
              <input
                type="radio"
                name="sort"
                value={o.value}
                checked={filters.sort === o.value}
                onChange={() => onChange({ sort: o.value })}
                className="accent-indigo-600"
              />
              <span className="text-sm font-medium">{o.label}</span>
              {filters.sort === o.value && (
                <svg className="w-4 h-4 ml-auto text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Precio */}
      <div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Rango de precio</p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">€</span>
            <input
              type="number"
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              onBlur={applyPrice}
              placeholder="Mín"
              min="0"
              className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
            />
          </div>
          <div className="w-4 h-px bg-slate-300 shrink-0" />
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">€</span>
            <input
              type="number"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              onBlur={applyPrice}
              placeholder="Máx"
              min="0"
              className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Limpiar */}
      {activeFilters > 0 && (
        <button
          onClick={() => {
            onChange({ category: "", priceMin: "", priceMax: "", sort: "newest" });
            setLocalMin("");
            setLocalMax("");
            setPanelOpen(false);
          }}
          className="w-full py-2.5 text-sm font-bold text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="w-full flex flex-col gap-3">
        {/* Category chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATS.map((c) => {
            const active = filters.category === c.slug;
            return (
              <button
                key={c.slug}
                onClick={() => onChange({ category: c.slug })}
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                  active
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                <svg
                  className={`w-3.5 h-3.5 shrink-0 ${active ? "text-indigo-200" : "text-slate-400"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.icon} />
                </svg>
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Results count + filter button */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            <span className="font-black text-slate-800">{total}</span>
            {" "}producto{total !== 1 ? "s" : ""}
          </p>

          <div className="relative" ref={ref}>
            <button
              onClick={() => setPanelOpen((p) => !p)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                panelOpen || activeFilters > 0
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
              {activeFilters > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 bg-white text-indigo-600 text-[10px] font-black rounded-full">
                  {activeFilters}
                </span>
              )}
            </button>

            {/* Panel desplegable con animacion */}
            {panelOpen && (
              <div className="absolute right-0 top-full mt-2.5 w-72 bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-100 p-5 z-30 animate-scale-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-900">Filtros</h3>
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {filterPanel}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-fade-in">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-black text-slate-900">Filtros</h3>
              <span className="text-xs text-slate-400 font-medium">{total} resultados</span>
            </div>
            {filterPanel}
            <button onClick={onMobileClose} className="mt-6 btn-primary w-full py-3 text-base">
              Ver {total} resultado{total !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
