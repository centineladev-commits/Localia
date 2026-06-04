"use client";

import Link from "next/link";
import type { ShopMapPin } from "@/lib/types";

export function ShopPopup({ shop }: { shop: ShopMapPin }) {
  const distanceText =
    shop.distanceMeters < 1000
      ? `${Math.round(shop.distanceMeters)}m`
      : `${(shop.distanceMeters / 1000).toFixed(1)}km`;

  return (
    <div className="w-56 p-3">
      <div className="flex items-center gap-2 mb-2">
        {shop.logoUrl ? (
          <img
            src={shop.logoUrl}
            alt={shop.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
            {shop.name.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-semibold text-sm leading-tight">{shop.name}</p>
          <p className="text-xs text-gray-500">{distanceText} de ti</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 text-xs">
        {shop.rating !== null && (
          <span className="flex items-center gap-0.5 text-gray-600">
            <span className="text-yellow-500">★</span>
            {shop.rating.toFixed(1)}
          </span>
        )}
        <span
          className={`px-1.5 py-0.5 rounded-full font-medium ${
            shop.isOpen
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {shop.isOpen ? "Abierto" : "Cerrado"}
        </span>
      </div>

      <Link
        href={`/tienda/${shop.slug}`}
        className="block w-full text-center py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
      >
        Ver escaparate →
      </Link>
    </div>
  );
}
