"use client";

import Link from "next/link";
import type { DemoShop } from "@/lib/demo-data";
import { SHOP_CATEGORY_COLORS } from "@/lib/constants";

export function ShopHeader({ shop }: { shop: DemoShop }) {
  const color = SHOP_CATEGORY_COLORS[shop.categoryId] ?? SHOP_CATEGORY_COLORS.otros;

  return (
    <div className="bg-white shadow-sm">
      {/* Portada */}
      <div
        className="h-36 w-full relative"
        style={{ background: `linear-gradient(135deg, ${color}33, ${color}66)` }}
      >
        <Link
          href="/"
          className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur rounded-full text-sm font-medium hover:bg-white transition-colors"
        >
          ← Volver al mapa
        </Link>
      </div>

      {/* Info del comercio */}
      <div className="max-w-4xl mx-auto px-4 pb-5">
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-2xl border-4 border-white shadow-md -mt-8 mb-3 flex items-center justify-center text-2xl font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {shop.name.charAt(0)}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
            <p className="text-gray-500 text-sm mt-1">{shop.description}</p>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-600">
              {shop.rating && (
                <span className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <strong>{shop.rating.toFixed(1)}</strong>
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  shop.isOpen
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {shop.isOpen ? "Abierto ahora" : "Cerrado"}
              </span>
              <span className="text-gray-400">·</span>
              <span>📍 {shop.address}</span>
            </div>

            <p className="text-xs text-gray-400 mt-1.5">🕐 {shop.openingHours}</p>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 shrink-0">
            <a
              href={`tel:${shop.phone}`}
              className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              📞 Llamar
            </a>
            <a
              href={`https://maps.google.com/?q=${shop.coordinates.lat},${shop.coordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              🗺️ Cómo llegar
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
