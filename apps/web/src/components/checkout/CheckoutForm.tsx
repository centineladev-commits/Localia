"use client";

import { useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { FEE_TIERS, getTier, calcFee, calcShipping } from "@/lib/constants";
import { StripePaymentForm } from "./StripePaymentForm";
import { getPublicClient } from "@/lib/db";

async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await getPublicClient().auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export function CheckoutForm() {
  const { items, shop, total, clearCart } = useCartStore();
  const { user, openAuthModal }           = useAuthStore();

  const [deliveryType, setDeliveryType]   = useState<"pickup" | "local_delivery">("pickup");
  const [address, setAddress]             = useState("");
  const [step, setStep]                   = useState<"summary" | "payment" | "success">("summary");
  const [clientSecret, setClientSecret]   = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [intentError, setIntentError]     = useState<string | null>(null);
  const [finalTotal, setFinalTotal]       = useState<number | null>(null);

  const subtotal    = total();
  const tier        = getTier(subtotal);
  const shippingFee = calcShipping(subtotal, deliveryType);
  const grandTotal  = +(subtotal + shippingFee).toFixed(2);
  const platformFee = calcFee(grandTotal);

  // ─── Carrito vacío ────────────────────────────────────────────
  if (items.length === 0 && step !== "success") {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </div>
        <p className="text-xl font-bold text-slate-700">Tu carrito está vacío</p>
        <p className="text-slate-400 text-sm mt-1">Añade productos desde el catálogo para continuar</p>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors">
          Explorar catálogo
        </Link>
      </div>
    );
  }

  // ─── Pedido confirmado ─────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="text-center py-20 animate-scale-in">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-100">
          <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900">¡Pedido confirmado!</h2>
        <p className="text-slate-500 mt-2 text-sm max-w-xs mx-auto">
          El pago de <strong>{(finalTotal ?? grandTotal).toFixed(2)} €</strong> se ha procesado. Recibirás un email de confirmación en breve.
        </p>
        {deliveryType === "pickup" && shop?.address && (
          <div className="mt-5 inline-flex items-center gap-2 px-5 py-3 bg-emerald-50 rounded-2xl text-emerald-700 text-sm font-semibold border border-emerald-100">
            📍 Recoge en: {shop.address}
          </div>
        )}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/mis-pedidos" className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors">
            Ver mis pedidos
          </Link>
          <Link href="/" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors">
            Seguir comprando
          </Link>
        </div>
      </div>
    );
  }

  // ─── Paso 1: Resumen + entrega ─────────────────────────────────
  async function goToPayment() {
    if (!user) { openAuthModal("login"); return; }
    if (deliveryType === "local_delivery" && !address.trim()) {
      alert("Introduce tu dirección de entrega");
      return;
    }

    // Si Stripe no está configurado NO fingimos un pedido: mostramos error.
    // (Antes hacía clearCart()+success → "venta fantasma" sin pedido ni cobro.)
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setIntentError("El pago no está disponible ahora mismo. Vuelve a intentarlo más tarde.");
      return;
    }

    setLoadingIntent(true);
    setIntentError(null);
    try {
      const token = await getAccessToken();
      if (!token) { openAuthModal("login"); return; }

      const res = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // amount and userId are NOT sent — server re-derives prices from DB and gets userId from JWT
        body: JSON.stringify({
          shopId:          shop?.id,
          items:           items.map((i) => ({ id: i.product.id, name: i.product.name, qty: i.quantity, price: i.product.price })),
          deliveryType,
          deliveryAddress: address,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.clientSecret) throw new Error(data.error ?? "No se pudo iniciar el pago");
      setClientSecret(data.clientSecret);
      if (data.grandTotal) setFinalTotal(data.grandTotal);
      setStep("payment");
    } catch (err: any) {
      setIntentError(err.message);
    } finally {
      setLoadingIntent(false);
    }
  }

  if (step === "summary") {
    return (
      <div className="space-y-4 animate-fade-in">
        {!user && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">Inicia sesión para confirmar</p>
              <p className="text-xs text-amber-600 mt-0.5">Necesitas una cuenta para finalizar tu compra</p>
            </div>
            <button onClick={() => openAuthModal("login")} className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-colors">
              Entrar
            </button>
          </div>
        )}

        {/* Tarifa activa */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-indigo-700 font-semibold">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
          </svg>
          Tarifa activa: <strong>{tier.feePercent}% comisión</strong>
          {deliveryType === "local_delivery" && tier.shippingFee > 0 && <> · <strong>{tier.shippingFee.toFixed(2)} € envío</strong></>}
          {deliveryType === "local_delivery" && tier.shippingFee === 0 && <> · <strong>Envío gratis 🎉</strong></>}
        </div>

        {/* Escalera de tarifas */}
        <details className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <summary className="px-5 py-3 text-xs font-bold text-slate-500 cursor-pointer hover:bg-slate-50 uppercase tracking-wide list-none flex items-center justify-between">
            <span>Ver escalera de tarifas completa</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </summary>
          <div className="px-5 pb-4 space-y-1">
            {FEE_TIERS.map((t, i) => {
              const active = t === tier;
              const label = t.max === Infinity
                ? `+${t.min} €`
                : `${t.min}–${t.max} €`;
              return (
                <div key={i} className={`flex justify-between items-center px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${active ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" : "text-slate-500"}`}>
                  <span>{label}</span>
                  <span>{t.feePercent}% comisión · {t.shippingFee > 0 ? `${t.shippingFee.toFixed(2)} € envío` : "Envío gratis"}</span>
                </div>
              );
            })}
          </div>
        </details>

        {/* Resumen del pedido */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="font-black text-slate-800">Pedido en <span className="text-indigo-600">{shop?.name}</span></h2>
          </div>
          <div className="p-5 space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  {item.product.images[0] ? (
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-xl">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.product.name}</p>
                  <p className="text-xs text-slate-400">× {item.quantity} · {item.product.price.toFixed(2)} € c/u</p>
                </div>
                <p className="text-sm font-black text-slate-800 shrink-0">{(item.product.price * item.quantity).toFixed(2)} €</p>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 bg-slate-50 space-y-2 text-sm border-t border-slate-100">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{subtotal.toFixed(2)} €</span></div>
            {shippingFee > 0 && <div className="flex justify-between text-slate-500"><span>Envío local</span><span>{shippingFee.toFixed(2)} €</span></div>}
            {shippingFee === 0 && deliveryType === "local_delivery" && (
              <div className="flex justify-between text-emerald-600 font-semibold"><span>Envío local</span><span>¡Gratis!</span></div>
            )}
            <div className="flex justify-between font-black text-base text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span className="text-indigo-600">{grandTotal.toFixed(2)} €</span>
            </div>
            <p className="text-[10px] text-slate-400 text-right">
              Comisión de plataforma ({tier.feePercent}%): {platformFee.toFixed(2)} €
            </p>
          </div>
        </div>

        {/* Tipo de entrega */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <h2 className="font-black text-slate-800">Tipo de entrega</h2>
          </div>
          <div className="space-y-2">
            {[
              { value: "pickup",         title: "Recoger en tienda",  subtitle: shop?.address ?? "En el local", extra: "Gratis" },
              { value: "local_delivery", title: "Entrega local",       subtitle: "En tu ciudad · mismo día",     extra: tier.shippingFee > 0 ? `${tier.shippingFee.toFixed(2)} €` : "¡Gratis!" },
            ].map((opt) => (
              <label key={opt.value} className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${deliveryType === opt.value ? "border-indigo-500 bg-indigo-50" : "border-slate-100 hover:border-slate-200"}`}>
                <input type="radio" name="delivery" value={opt.value}
                  checked={deliveryType === opt.value as any}
                  onChange={() => setDeliveryType(opt.value as "pickup" | "local_delivery")}
                  className="mt-0.5 accent-indigo-600" />
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-800">{opt.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{opt.subtitle}</p>
                </div>
                <span className={`text-sm font-black shrink-0 ${deliveryType === opt.value ? "text-indigo-600" : "text-slate-400"}`}>{opt.extra}</span>
              </label>
            ))}
          </div>
          {deliveryType === "local_delivery" && (
            <div className="mt-3">
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Dirección de entrega</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle, número, piso..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {intentError && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">{intentError}</div>
        )}

        <button
          onClick={goToPayment}
          disabled={loadingIntent}
          className="w-full py-4 bg-indigo-600 text-white font-black text-base rounded-3xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loadingIntent ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Preparando pago...</>
          ) : (
            user ? `Continuar al pago — ${grandTotal.toFixed(2)} €` : "Inicia sesión para continuar"
          )}
        </button>
        <p className="text-xs text-center text-slate-400">
          Al continuar aceptas los{" "}
          <Link href="/terminos" className="underline hover:text-indigo-600 transition-colors">términos del servicio</Link>
        </p>
      </div>
    );
  }

  // ─── Paso 2: Formulario de pago Stripe ────────────────────────
  return (
    <div className="space-y-4 animate-fade-in">
      <button onClick={() => setStep("summary")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Volver al resumen
      </button>

      <div className="bg-indigo-600 rounded-2xl p-5 text-white flex items-center justify-between">
        <div>
          <p className="text-indigo-200 text-sm">Total a pagar</p>
          <p className="text-3xl font-black">{(finalTotal ?? grandTotal).toFixed(2)} €</p>
        </div>
        <div className="text-right">
          <p className="text-indigo-200 text-xs">{shop?.name}</p>
          <p className="text-indigo-100 text-xs mt-0.5 capitalize">{deliveryType === "pickup" ? "Recogida en tienda" : "Entrega local"}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          </div>
          <h2 className="font-black text-slate-800">Datos de pago</h2>
        </div>

        {stripePromise && clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: "stripe", variables: { colorPrimary: "#4f46e5", borderRadius: "12px", fontFamily: "Inter, system-ui, sans-serif" } },
            }}
          >
            <StripePaymentForm
              grandTotal={finalTotal ?? grandTotal}
              onSuccess={() => { clearCart(); setStep("success"); }}
            />
          </Elements>
        ) : (
          <div className="py-8 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Cargando formulario de pago...</p>
          </div>
        )}
      </div>
    </div>
  );
}
