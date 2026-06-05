"use client";

import Link from "next/link";
import type { Product, Shop } from "@/lib/types";
import { useCartStore } from "@/store/cart.store";

export function ProductGrid({ products, shop }: { products: Product[]; shop: Shop }) {
  const { addItem, openCart } = useCartStore();

  function handleAdd(product: Product) {
    const result = addItem(product, shop);
    if (result === "different_shop") {
      if (confirm(`Tu carrito tiene productos de "${useCartStore.getState().shop?.name}". ¿Vaciar carrito y añadir de ${shop.name}?`)) {
        useCartStore.getState().clearCart();
        addItem(product, shop);
        openCart();
      }
      return;
    }
    openCart();
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-5xl mb-3">📦</div>
        <p className="font-medium text-gray-500">Este comercio aún no tiene productos publicados</p>
        <p className="text-sm mt-1">Vuelve pronto</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
        >
          <Link href={`/producto/${product.id}`}>
            <div className="aspect-square overflow-hidden bg-gray-100 relative">
              {product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-50">📦</div>
              )}
              {product.stock <= 3 && product.stock > 0 && (
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                  ¡Últimas {product.stock}!
                </span>
              )}
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="px-3 py-1 bg-black/60 text-white text-xs font-bold rounded-full">Agotado</span>
                </div>
              )}
            </div>
          </Link>
          <div className="p-3">
            <Link href={`/producto/${product.id}`}>
              <p className="font-semibold text-sm leading-tight line-clamp-2 text-gray-800 hover:text-emerald-600 transition-colors mb-1">
                {product.name}
              </p>
            </Link>
            <div className="flex items-center justify-between mt-2">
              <p className="text-emerald-600 font-black text-base">
                {product.price.toFixed(2)}<span className="text-xs font-semibold ml-0.5">€</span>
              </p>
            </div>
            <button
              onClick={() => handleAdd(product)}
              disabled={product.stock === 0}
              className="mt-2.5 w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {product.stock > 0 ? "Añadir al carrito" : "Agotado"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
