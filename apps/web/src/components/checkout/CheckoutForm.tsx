"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cart.store";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";

export function CheckoutForm() {
  const { items, shop, total, clearCart } = useCartStore();
  const [deliveryType, setDeliveryType] = useState<"pickup" | "local_delivery">("pickup");
  const [submitted, setSubmitted] = useState(false);

  const subtotal = total();
  const fee = +(subtotal * (PLATFORM_FEE_PERCENT / 100)).toFixed(2);
  const grandTotal = +(subtotal + (deliveryType === "local_delivery" ? 2.5 : 0)).toFixed(2);

  if (items.length === 0 && !submitted) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-5xl mb-4">🛒</p>
        <p className="text-lg font-medium">No tienes artículos en el carrito</p>
        <Link href="/" className="mt-4 inline-block text-emerald-600 hover:underline">
          Volver al mapa
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900">¡Pedido confirmado!</h2>
        <p className="text-gray-500 mt-2">
          Recibirás una confirmación cuando {shop?.name} prepare tu pedido.
        </p>
        {deliveryType === "pickup" && (
          <p className="mt-4 p-4 bg-emerald-50 rounded-xl text-emerald-700 text-sm font-medium">
            📍 Recoge en: {shop?.address}
          </p>
        )}
        <Link
          href="/"
          className="mt-6 inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
        >
          Seguir comprando
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Resumen del pedido */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-4">
          Pedido en <span className="text-emerald-600">{shop?.name}</span>
        </h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3">
              <img
                src={item.product.images[0]}
                alt={item.product.name}
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product.name}</p>
                <p className="text-xs text-gray-500">× {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold shrink-0">
                {(item.product.price * item.quantity).toFixed(2)} €
              </p>
            </div>
          ))}
        </div>
        <div className="border-t mt-4 pt-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span><span>{subtotal.toFixed(2)} €</span>
          </div>
          {deliveryType === "local_delivery" && (
            <div className="flex justify-between text-gray-600">
              <span>Envío local</span><span>2.50 €</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base mt-1">
            <span>Total</span><span className="text-emerald-600">{grandTotal.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* Tipo de entrega */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-3">Tipo de entrega</h2>
        <div className="space-y-2">
          <label
            className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
              deliveryType === "pickup" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
            }`}
          >
            <input
              type="radio"
              name="delivery"
              value="pickup"
              checked={deliveryType === "pickup"}
              onChange={() => setDeliveryType("pickup")}
              className="mt-0.5"
            />
            <div>
              <p className="font-semibold text-sm">🏪 Recoger en tienda — Gratis</p>
              <p className="text-xs text-gray-500 mt-0.5">{shop?.address}</p>
            </div>
          </label>
          <label
            className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
              deliveryType === "local_delivery" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"
            }`}
          >
            <input
              type="radio"
              name="delivery"
              value="local_delivery"
              checked={deliveryType === "local_delivery"}
              onChange={() => setDeliveryType("local_delivery")}
              className="mt-0.5"
            />
            <div>
              <p className="font-semibold text-sm">🛵 Entrega local — 2.50 €</p>
              <p className="text-xs text-gray-500 mt-0.5">En tu ciudad, mismo día</p>
            </div>
          </label>
        </div>
      </div>

      {/* Pago — placeholder hasta integrar Stripe */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-3">Pago</h2>
        <div className="p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-500">
          💳 Aquí irá el formulario de Stripe
          <br />
          <span className="text-xs">(pendiente de conectar Stripe Connect)</span>
        </div>
      </div>

      {/* Botón confirmar */}
      <button
        onClick={() => { clearCart(); setSubmitted(true); }}
        className="w-full py-4 bg-emerald-600 text-white font-bold text-lg rounded-2xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
      >
        Confirmar pedido — {grandTotal.toFixed(2)} €
      </button>
      <p className="text-xs text-center text-gray-400">
        Al confirmar aceptas los términos del servicio
      </p>
    </div>
  );
}
