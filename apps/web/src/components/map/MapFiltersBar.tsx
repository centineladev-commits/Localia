"use client";

import { MapPin, ChevronDown } from "lucide-react";
import { useMapStore } from "@/store/map.store";
import { useLocationStore } from "@/store/location.store";

const CATEGORIES = [
  { id: "all",          label: "Todos",        color: "#6b7280" },
  { id: "alimentacion", label: "Alimentación", color: "#22c55e" },
  { id: "moda",         label: "Moda",         color: "#ec4899" },
  { id: "electronica",  label: "Electrónica",  color: "#3b82f6" },
  { id: "hogar",        label: "Hogar",        color: "#f59e0b" },
  { id: "artesania",    label: "Artesanía",    color: "#8b5cf6" },
  { id: "deportes",     label: "Deportes",     color: "#06b6d4" },
  { id: "belleza",      label: "Belleza",      color: "#f43f5e" },
];

export function MapFiltersBar() {
  const { filters, setFilters } = useMapStore();
  const { location, openModal } = useLocationStore();

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col gap-2 items-center pointer-events-none">
      {/* Selector de ubicación */}
      <button
        onClick={openModal}
        className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md text-sm font-semibold hover:bg-gray-50 transition-colors border border-gray-100"
      >
        <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span className="text-slate-700">{location ? location.shortLabel : "Selecciona ubicación"}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {/* Filtros de categoría */}
      <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-1 max-w-2xl px-2 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isActive = (cat.id === "all" && !filters.categoryId) || filters.categoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setFilters({ categoryId: cat.id === "all" ? undefined : cat.id })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all shadow-sm font-semibold ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-100"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: isActive ? "white" : cat.color }}
              />
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
