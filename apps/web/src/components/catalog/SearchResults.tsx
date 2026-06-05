"use client";

import Link from "next/link";
import { Store, Package } from "lucide-react";
import type { SearchResponse } from "@/app/api/search/route";

interface Props {
  data: SearchResponse;
  query: string;
}

function ShopCard({ shop }: { shop: SearchResponse["shops"][number] }) {
  return (
    <Link
      href={`/tienda/${shop.slug}`}
      className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-sm transition-all group"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden"
        style={{ backgroundColor: shop.categoryColor }}
      >
        {shop.logoUrl ? (
          <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
        ) : (
          shop.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
          {shop.name}
        </p>
        <p className="text-xs text-slate-400 truncate mt-0.5">
          {shop.categoryName}{shop.cityName ? ` · ${shop.cityName}` : ""}
        </p>
      </div>
    </Link>
  );
}

function ProductCard({ product }: { product: SearchResponse["products"][number] }) {
  return (
    <Link
      href={`/producto/${product.id}`}
      className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-sm transition-all group"
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-5 h-5 text-slate-200" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
          {product.name}
        </p>
        <p className="text-xs text-slate-400 truncate">{product.shopName}</p>
      </div>
      <span className="text-sm font-bold text-slate-900 shrink-0">
        {product.price.toFixed(2).replace(".", ",")} €
      </span>
    </Link>
  );
}

export function SearchResults({ data, query }: Props) {
  const hasShops    = data.shops.length > 0;
  const hasProducts = data.products.length > 0;

  if (!hasShops && !hasProducts) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl p-6 text-center z-50">
        <p className="text-sm font-semibold text-slate-700">Sin resultados para &ldquo;{query}&rdquo;</p>
        <p className="text-xs text-slate-400 mt-1">Prueba con otros términos o navega por categorías</p>
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-50">
      <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-50">

        {/* Seccion: Negocios */}
        {hasShops && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Negocios encontrados
              </span>
            </div>
            <div className="space-y-2">
              {data.shops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          </div>
        )}

        {/* Seccion: Productos */}
        {hasProducts && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Productos relacionados
              </span>
            </div>
            <div className="space-y-2">
              {data.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {data.expandedCategories.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50">
            <p className="text-[11px] text-slate-400">
              Resultados ampliados por categorias: {data.expandedCategories.join(", ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
