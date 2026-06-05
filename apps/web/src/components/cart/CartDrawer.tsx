"use client";

import { useCartStore } from "@/store/cart.store";
import Link from "next/link";

export function CartDrawer() {
  const { items, shop, isOpen, closeCart, removeItem, updateQuantity, total, itemCount } = useCartStore();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={closeCart} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-black text-lg text-gray-900">Tu carrito</h2>
            {shop && (
              <p className="text-xs text-gray-400 mt-0.5">
                Pedido en <span className="font-bold text-emerald-600">{shop.name}</span>
              </p>
            )}
          </div>
          <button onClick={closeCart} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-lg">
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16 text-gray-400 animate-fade-in">
              <div className="text-5xl mb-3">🛒</div>
              <p className="font-semibold text-gray-500">Tu carrito está vacío</p>
              <p className="text-sm mt-1 text-gray-400">Explora el mapa y añade productos</p>
              <button onClick={closeCart} className="mt-5 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-full hover:bg-emerald-700 transition-colors">
                Explorar mapa
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex gap-3 bg-gray-50 rounded-2xl p-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0 border border-gray-100">
                  {item.product.images[0] ? (
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{item.product.name}</p>
                  <p className="text-emerald-600 font-black text-sm mt-0.5">{item.product.price.toFixed(2)} €</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 px-1 py-0.5">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-800 font-bold transition-colors">−</button>
                      <span className="text-sm font-black text-gray-800 w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-800 font-bold transition-colors">+</button>
                    </div>
                    <button onClick={() => removeItem(item.product.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-auto">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">{itemCount()} artículo{itemCount() !== 1 ? "s" : ""}</span>
              <span className="font-black text-xl text-gray-900">{total().toFixed(2)} €</span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full text-center py-3.5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100 active:scale-95"
            >
              Finalizar pedido →
            </Link>
            <p className="text-xs text-center text-gray-400">Recogida en tienda · Entrega local</p>
          </div>
        )}
      </div>
    </>
  );
}
