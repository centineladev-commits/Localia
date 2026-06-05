"use client";

import Link from "next/link";
import { MapPin, Star, ChevronRight } from "lucide-react";
import type { ShopMapPin } from "@/lib/types";
import { SHOP_CATEGORY_COLORS } from "@/lib/constants";

export function ShopPopup({ shop }: { shop: ShopMapPin }) {
  const distanceText =
    shop.distanceMeters < 1000
      ? `${Math.round(shop.distanceMeters)} m`
      : `${(shop.distanceMeters / 1000).toFixed(1)} km`;

  const color = SHOP_CATEGORY_COLORS[shop.categoryId] ?? SHOP_CATEGORY_COLORS.otros;

  return (
    <div className="w-64 overflow-hidden rounded-xl shadow-lg">
      {/* Cabecera: imagen de portada o gradiente */}
      <div className="h-24 w-full relative overflow-hidden">
        {shop.coverUrl ? (
          <img src={shop.coverUrl} alt={shop.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${color}cc, ${color})` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div className="p-3 bg-white -mt-5 relative">
        <div className="flex items-center gap-2.5 mb-2.5">
          {shop.logoUrl ? (
            <img src={shop.logoUrl} alt={shop.name} className="w-10 h-10 rounded-xl object-cover shrink-0 border-2 border-white shadow-sm" />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0 border-2 border-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              {shop.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-900 leading-tight truncate">{shop.name}</p>
            {shop.distanceMeters > 0 && (
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                {distanceText} de aquí
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          {shop.rating != null && (
            <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-amber-50 px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              {shop.rating.toFixed(1)}
            </span>
          )}
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
            shop.isOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${shop.isOpen ? "bg-emerald-500" : "bg-slate-400"}`} />
            {shop.isOpen ? "Abierto" : "Cerrado"}
          </span>
        </div>

        <Link
          href={`/tienda/${shop.slug}`}
          className="flex items-center justify-center gap-1.5 w-full text-center py-2 font-semibold text-sm text-white rounded-xl transition-opacity hover:opacity-90 active:scale-95"
          style={{ backgroundColor: color }}
        >
          Ver escaparate
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
