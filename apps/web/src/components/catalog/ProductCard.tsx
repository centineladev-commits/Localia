"use client";

import Link from "next/link";
import type { CatalogProduct } from "@/app/api/catalog/route";

function formatPrice(price: number): string {
  return price.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ProductCard({ product }: { product: CatalogProduct }) {
  const cityShort = product.cityName.split(",")[0];

  return (
    <Link href={`/producto/${product.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">

        {/* Imagen cuadrada */}
        <div className="aspect-square overflow-hidden bg-slate-100 relative">
          {product.images[0] ? (
            <>
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-out"
              />
              {/* Overlay gradiente en hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50">
              <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
          )}

          {/* Badge ciudad — bottom-left sobre la imagen */}
          {cityShort && product.stock > 0 && (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold rounded-full">
              <svg className="w-2.5 h-2.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {cityShort}
            </span>
          )}

          {/* Badge Últimas unidades */}
          {product.stock <= 3 && product.stock > 0 && (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-white text-[10px] font-black rounded-full shadow-md tracking-wide uppercase">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Últimas {product.stock}
            </span>
          )}

          {/* Overlay Agotado */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
              <span className="px-4 py-1.5 bg-slate-900/85 text-white text-xs font-black rounded-full tracking-widest uppercase shadow-lg">
                Agotado
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug mb-2">
            {product.name}
          </p>

          {/* Precio con formato español */}
          <p className="text-xl font-black text-slate-900 leading-none mb-2.5 tracking-tight">
            {formatPrice(product.price)}
            <span className="text-sm font-bold text-slate-500 ml-0.5"> €</span>
          </p>

          {/* Tienda */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <svg className="w-3 h-3 shrink-0 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="truncate font-medium text-slate-500">{product.shopName}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
