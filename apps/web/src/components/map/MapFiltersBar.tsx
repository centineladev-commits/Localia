"use client";

import { useMapStore } from "@/store/map.store";
import { useCityStore } from "@/store/city.store";

const CATEGORIES = [
  { id: "all",          label: "Todos",        emoji: "🏪" },
  { id: "alimentacion", label: "Alimentación", emoji: "🥗" },
  { id: "moda",         label: "Moda",         emoji: "👗" },
  { id: "electronica",  label: "Electrónica",  emoji: "📱" },
  { id: "hogar",        label: "Hogar",        emoji: "🏠" },
  { id: "artesania",    label: "Artesanía",    emoji: "🎨" },
  { id: "deportes",     label: "Deportes",     emoji: "⚽" },
  { id: "belleza",      label: "Belleza",      emoji: "💄" },
];

export function MapFiltersBar() {
  const { filters, setFilters } = useMapStore();
  const { activeCity, openModal } = useCityStore();

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col gap-2 items-center pointer-events-none">
      {/* Selector de ciudad */}
      <button
        onClick={openModal}
        className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 bg-white rounded-full shadow-md text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <span>📍</span>
        <span>{activeCity ? activeCity.name : "Selecciona tu ciudad"}</span>
        <span className="text-gray-400">▾</span>
      </button>

      {/* Categorías */}
      <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-1 max-w-2xl px-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              setFilters({ categoryId: cat.id === "all" ? undefined : cat.id })
            }
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap
              transition-colors shadow-sm
              ${
                (cat.id === "all" && !filters.categoryId) ||
                filters.categoryId === cat.id
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }
            `}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
