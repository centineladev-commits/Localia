"use client";

import { useState } from "react";
import Link from "next/link";
import type { DemoProduct, DemoShop } from "@/lib/demo-data";
import { SHOP_CATEGORY_COLORS } from "@/lib/constants";
import { useCartStore } from "@/store/cart.store";

interface Props {
  product: DemoProduct;
  shop: DemoShop;
}

export function ProductDetail({ product, shop }: Props) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem, openCart } = useCartStore();
  const color = SHOP_CATEGORY_COLORS[shop.categoryId] ?? "#6b7280";

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) {
      const result = addItem(product, shop);
      if (result === "different_shop") {
        alert(
          `Tu carrito tiene productos de "${useCartStore.getState().shop?.name}". Vacía el carrito antes de añadir de otra tienda.`
        );
        return;
      }
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    openCart();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-emerald-600">Mapa</Link>
        <span>›</span>
        <Link href={`/tienda/${shop.slug}`} className="hover:text-emerald-600">{shop.name}</Link>
        <span>›</span>
        <span className="text-gray-800 font-medium truncate">{product.name}</span>
      </nav>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Imagen */}
          <div className="aspect-square bg-gray-100 overflow-hidden">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="p-6 flex flex-col">
            {/* Badge nuevo */}
            <span className="inline-flex w-fit items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full mb-3">
              ✨ Producto nuevo
            </span>

            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            <p className="text-3xl font-bold text-emerald-600 mt-3">
              {product.price.toFixed(2)} <span className="text-lg">€</span>
            </p>

            <p className="text-gray-600 text-sm mt-3 leading-relaxed flex-1">
              {product.description}
            </p>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Stock */}
            <p className="text-sm text-gray-500 mt-4">
              {product.stock > 5
                ? `✅ En stock (${product.stock} disponibles)`
                : product.stock > 0
                ? `⚠️ Quedan solo ${product.stock} unidades`
                : "❌ Agotado"}
            </p>

            {/* Selector cantidad */}
            <div className="flex items-center gap-3 mt-4">
              <span className="text-sm font-medium text-gray-700">Cantidad</span>
              <div className="flex items-center gap-2 border rounded-lg px-2 py-1">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-7 h-7 flex items-center justify-center text-lg font-bold text-gray-600 hover:text-gray-900"
                >
                  −
                </button>
                <span className="w-6 text-center font-semibold">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="w-7 h-7 flex items-center justify-center text-lg font-bold text-gray-600 hover:text-gray-900"
                >
                  +
                </button>
              </div>
            </div>

            {/* Botón añadir */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`
                mt-4 w-full py-3 rounded-xl font-bold text-white transition-all
                ${added
                  ? "bg-green-500"
                  : "bg-emerald-600 hover:bg-emerald-700"}
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              {added ? "✓ Añadido al carrito" : "Añadir al carrito"}
            </button>

            {/* Tienda */}
            <Link
              href={`/tienda/${shop.slug}`}
              className="mt-4 flex items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: color }}
              >
                {shop.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{shop.name}</p>
                <p className="text-xs text-gray-500 truncate">{shop.address}</p>
              </div>
              <span className="text-gray-400 ml-auto">›</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
