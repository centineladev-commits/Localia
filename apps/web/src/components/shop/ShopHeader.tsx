"use client";

import Link from "next/link";
import type { Shop } from "@/lib/types";

export function ShopHeader({ shop }: { shop: Shop }) {
  const color = shop.categoryColor;
  const mapsUrl = shop.address
    ? `https://maps.google.com/?q=${encodeURIComponent(shop.address)}`
    : `https://maps.google.com/?q=${shop.coordinates.lat},${shop.coordinates.lng}`;

  return (
    <div className="bg-white shadow-sm">
      {/* Portada */}
      <div
        className="h-44 w-full relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color}22 0%, ${color}55 50%, ${color}33 100%)` }}
      >
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `radial-gradient(circle at 20% 50%, ${color} 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${color} 0%, transparent 40%)` }}
        />
        <Link
          href="/"
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-gray-700 hover:bg-white transition-colors shadow-sm"
        >
          ← Mapa
        </Link>
        {shop.isOpen !== undefined && (
          <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${shop.isOpen ? "bg-green-500 text-white" : "bg-gray-700 text-white"}`}>
            {shop.isOpen ? "● Abierto" : "● Cerrado"}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="max-w-4xl mx-auto px-4 pb-5">
        <div className="flex items-end gap-4 -mt-8 mb-4">
          <div
            className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-2xl font-black text-white shrink-0"
            style={{ backgroundColor: color }}
          >
            {shop.logoUrl
              ? <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover rounded-xl" />
              : shop.name.charAt(0)
            }
          </div>
          {shop.categoryName && (
            <span className="mb-1 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
              style={{ backgroundColor: color }}>
              {shop.categoryName}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-gray-900">{shop.name}</h1>
            <p className="text-gray-500 text-sm mt-1 leading-relaxed">{shop.description}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-gray-500">
              {shop.rating != null && (
                <span className="flex items-center gap-1 font-medium">
                  <span className="text-yellow-400">★</span>
                  <span className="text-gray-800">{shop.rating.toFixed(1)}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <span>📍</span>
                <span className="truncate max-w-[220px]">{shop.address}</span>
              </span>
              {shop.phone && (
                <a href={`tel:${shop.phone}`} className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                  <span>📞</span>
                  <span>{shop.phone}</span>
                </a>
              )}
            </div>

            {shop.openingHours && (
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                <span>🕐</span>
                <span>{shop.openingHours}</span>
              </p>
            )}
          </div>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shrink-0 shadow-sm"
          >
            🗺️ Cómo llegar
          </a>
        </div>
      </div>
    </div>
  );
}
