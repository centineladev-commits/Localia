"use client";

import { useCartStore } from "@/store/cart.store";
import Link from "next/link";

export function CartDrawer() {
  const { items, shop, isOpen, closeCart, removeItem, updateQuantity, total, itemCount } =
    useCartStore();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={closeCart}
      />

      {/* Panel lateral */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-bold text-lg">Tu carrito</h2>
            {shop && (
              <p className="text-xs text-gray-500 mt-0.5">
                Pedido en <span className="font-medium text-emerald-600">{shop.name}</span>
              </p>
            )}
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
          >
            ✕
          </button>
        </div>

        {/* Lista de productos */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🛒</p>
              <p className="font-medium">Tu carrito está vacío</p>
              <p className="text-sm mt-1">Añade productos desde el mapa</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex gap-3">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product.name}</p>
                  <p className="text-emerald-600 font-semibold text-sm mt-0.5">
                    {item.product.price.toFixed(2)} €
                  </p>
                  {/* Control de cantidad */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-full border flex items-center justify-center text-sm hover:bg-gray-100"
                    >
                      −
                    </button>
                    <span className="text-sm font-medium w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-full border flex items-center justify-center text-sm hover:bg-gray-100"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="ml-auto text-gray-400 hover:text-red-500 text-xs"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer con total y botón */}
        {items.length > 0 && (
          <div className="border-t px-5 py-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">
                Subtotal ({itemCount()} artículo{itemCount() !== 1 ? "s" : ""})
              </span>
              <span className="font-bold text-lg">{total().toFixed(2)} €</span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full text-center py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Ir al checkout →
            </Link>
            <p className="text-xs text-center text-gray-400">
              Recogida en tienda o entrega local
            </p>
          </div>
        )}
      </div>
    </>
  );
}
