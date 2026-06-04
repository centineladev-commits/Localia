"use client";

import Link from "next/link";
import type { DemoProduct, DemoShop } from "@/lib/demo-data";
import { useCartStore } from "@/store/cart.store";

interface Props {
  products: DemoProduct[];
  shop: DemoShop;
}

export function ProductGrid({ products, shop }: Props) {
  const { addItem, openCart } = useCartStore();

  function handleAdd(product: DemoProduct) {
    const result = addItem(product, shop);
    if (result === "different_shop") {
      alert(
        `Tu carrito tiene productos de "${useCartStore.getState().shop?.name}". Vacía el carrito antes de comprar en otra tienda.`
      );
      return;
    }
    openCart();
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-2">📦</p>
        <p>Este comercio aún no tiene productos publicados.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <Link href={`/producto/${product.id}`}>
            <div className="aspect-square overflow-hidden bg-gray-100">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>
          <div className="p-3">
            <Link href={`/producto/${product.id}`}>
              <p className="font-medium text-sm leading-tight line-clamp-2 hover:text-emerald-600 transition-colors">
                {product.name}
              </p>
            </Link>
            <div className="flex items-center justify-between mt-2">
              <p className="text-emerald-600 font-bold">
                {product.price.toFixed(2)} €
              </p>
              <span className="text-xs text-gray-400">
                {product.stock > 0 ? `${product.stock} uds` : "Agotado"}
              </span>
            </div>
            <button
              onClick={() => handleAdd(product)}
              disabled={product.stock === 0}
              className="mt-2 w-full py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {product.stock > 0 ? "Añadir al carrito" : "Agotado"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
