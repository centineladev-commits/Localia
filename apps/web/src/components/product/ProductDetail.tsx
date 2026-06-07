"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Package,
  ChevronRight,
  ShoppingBag,
  Bookmark,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sparkles,
  Zap,
  MapPin,
  Phone,
  Clock,
} from "lucide-react";
import type { Product, Shop } from "@/lib/types";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { ChatButton } from "@/components/chat/ChatButton";

export function ProductDetail({ product, shop }: { product: Product; shop: Shop }) {
  const [activeImage, setActiveImage]    = useState(0);
  const [qty, setQty]                    = useState(1);
  const [added, setAdded]                = useState(false);
  const [inWishlist, setInWishlist]      = useState(false);
  const [wishLoading, setWishLoading]    = useState(false);
  const [showReserve, setShowReserve]    = useState(false);
  const [reserveNote, setReserveNote]    = useState("");
  const [reserving, setReserving]        = useState(false);
  const [reserveOk, setReserveOk]        = useState(false);

  const router = useRouter();

  const { addItem, openCart } = useCartStore();
  const { user, openAuthModal } = useAuthStore();
  const color = shop.categoryColor;

  const images = product.images.length > 0 ? product.images : [];

  useEffect(() => {
    if (!user) return;
    fetch(`/api/wishlist?userId=${user.id}&productId=${product.id}`)
      .then((r) => r.json())
      .then((d) => setInWishlist(d.inWishlist))
      .catch(() => {});
  }, [user, product.id]);

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) {
      const result = addItem(product, shop);
      if (result === "different_shop") {
        if (confirm(`Tu carrito tiene productos de "${useCartStore.getState().shop?.name}". ¿Vaciar y añadir este?`)) {
          useCartStore.getState().clearCart();
          for (let j = 0; j < qty; j++) addItem(product, shop);
        }
        return;
      }
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    openCart();
  }

  async function toggleWishlist() {
    if (!user) { openAuthModal("login"); return; }
    setWishLoading(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, productId: product.id }),
      });
      const data = await res.json();
      setInWishlist(data.inWishlist);
    } finally {
      setWishLoading(false);
    }
  }

  async function submitReservation() {
    if (!user) { openAuthModal("login"); return; }
    setReserving(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:    user.id,
          shopId:    shop.id,
          productId: product.id,
          quantity:  qty,
          notes:     reserveNote,
        }),
      });
      if (res.ok) {
        setReserveOk(true);
        setShowReserve(false);
      }
    } finally {
      setReserving(false);
    }
  }

  const totalPrice = (product.price * qty).toFixed(2);

  const stockStatus =
    product.stock === 0 ? "out" :
    product.stock <= 5  ? "low" : "ok";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Volver + Breadcrumb */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push("/");
          }}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors group shrink-0"
        >
          <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
          Volver
        </button>
        <span className="text-gray-200 hidden sm:block">·</span>
        <nav className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400 min-w-0">
          <Link href="/" className="hover:text-gray-600 transition-colors shrink-0">Catálogo</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link
            href={`/tienda/${shop.slug}`}
            className="hover:text-gray-600 transition-colors truncate max-w-[160px]"
          >
            {shop.name}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-gray-700 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      <div className="grid lg:grid-cols-[1fr_420px] gap-10">

        {/* ── Columna izquierda: galeria ── */}
        <div className="space-y-3">
          {/* Imagen principal */}
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 relative group">
            {images.length > 0 ? (
              <img
                src={images[activeImage]}
                alt={`${product.name} — imagen ${activeImage + 1}`}
                className="w-full h-full object-cover transition-opacity duration-200"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-200">
                <Package className="w-16 h-16" />
                <span className="text-sm text-gray-300 font-medium">Sin imagen</span>
              </div>
            )}

            {/* Wishlist */}
            <button
              onClick={toggleWishlist}
              disabled={wishLoading}
              aria-label={inWishlist ? "Quitar de lista de deseos" : "Guardar en lista de deseos"}
              className={`absolute top-4 right-4 w-9 h-9 rounded-full shadow-md flex items-center justify-center transition-all border ${
                inWishlist
                  ? "bg-rose-500 border-rose-500 text-white"
                  : "bg-white border-gray-100 text-gray-400 hover:text-rose-500 hover:border-rose-200"
              }`}
            >
              {wishLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Heart className="w-4 h-4" fill={inWishlist ? "currentColor" : "none"} />
              )}
            </button>
          </div>

          {/* Miniaturas */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImage === i ? "border-gray-900" : "border-transparent hover:border-gray-200"
                  }`}
                >
                  <img src={src} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Columna derecha: info + acciones ── */}
        <div className="flex flex-col">

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
              <Sparkles className="w-3 h-3" />
              Nuevo
            </span>
            {stockStatus === "low" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-semibold rounded-full">
                <Zap className="w-3 h-3" />
                Ultimas unidades
              </span>
            )}
            {shop.categoryName && (
              <span
                className="px-2.5 py-1 text-white text-xs font-semibold rounded-full"
                style={{ backgroundColor: color }}
              >
                {shop.categoryName}
              </span>
            )}
          </div>

          {/* Nombre y precio */}
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">{product.name}</h1>
          <p className="mt-3 text-3xl font-bold text-gray-900 tracking-tight">
            {product.price.toFixed(2).replace(".", ",")}
            <span className="text-lg font-semibold text-gray-500 ml-1">€</span>
          </p>

          {/* Descripcion */}
          {product.description && (
            <p className="mt-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-5">
              {product.description}
            </p>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {product.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-gray-50 border border-gray-100 text-gray-500 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Stock */}
          <div className={`mt-5 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold ${
            stockStatus === "out" ? "bg-red-50 text-red-600" :
            stockStatus === "low" ? "bg-amber-50 text-amber-600" :
            "bg-emerald-50 text-emerald-700"
          }`}>
            {stockStatus === "out"  && <XCircle className="w-4 h-4 shrink-0" />}
            {stockStatus === "low"  && <AlertTriangle className="w-4 h-4 shrink-0" />}
            {stockStatus === "ok"   && <CheckCircle className="w-4 h-4 shrink-0" />}
            {stockStatus === "out"  && "Agotado"}
            {stockStatus === "low"  && `Solo ${product.stock} unidades disponibles`}
            {stockStatus === "ok"   && `${product.stock} unidades en stock`}
          </div>

          {/* Cantidad */}
          {product.stock > 0 && (
            <div className="flex items-center gap-4 mt-5">
              <span className="text-sm font-semibold text-gray-500">Cantidad</span>
              <div className="flex items-center gap-1 border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors font-bold text-lg"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-bold text-gray-900">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors font-bold text-lg"
                >
                  +
                </button>
              </div>
              {qty > 1 && (
                <span className="text-sm text-gray-400 font-semibold">{totalPrice} € total</span>
              )}
            </div>
          )}

          {/* CTAs */}
          <div className="mt-6 space-y-2.5">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
                added
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {added ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Añadido al carrito
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  {product.stock > 0 ? `Añadir al carrito — ${totalPrice} €` : "Agotado"}
                </>
              )}
            </button>

            {product.stock > 0 && !reserveOk && (
              <button
                onClick={() => { if (!user) { openAuthModal("login"); return; } setShowReserve(true); }}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-colors"
              >
                <Bookmark className="w-4 h-4" />
                Reservar este producto
              </button>
            )}

            {reserveOk && (
              <div className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100">
                <CheckCircle className="w-4 h-4" />
                Reserva enviada — la tienda la revisará en breve
              </div>
            )}

            <ChatButton shop={shop} product={product} />
          </div>

          {/* Info de la tienda */}
          <Link
            href={`/tienda/${shop.slug}`}
            className="mt-6 flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:border-gray-200 hover:bg-gray-50 transition-all group"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: color }}
            >
              {shop.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-sm font-semibold text-gray-800">{shop.name}</p>
              {shop.address && (
                <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {shop.address}
                </p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
          </Link>

        </div>
      </div>

      {/* Modal de reserva */}
      {showReserve && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowReserve(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Reservar producto</h2>
            <p className="text-sm text-gray-500 mb-5">
              La tienda recibirá tu reserva y la confirmará en breve. Pagarás{" "}
              <strong>{(product.price * qty).toFixed(2)} €</strong> en tramos de 5 €.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 flex justify-between items-center text-sm">
              <span className="font-medium text-gray-700">{product.name} ×{qty}</span>
              <span className="font-bold text-gray-900">{(product.price * qty).toFixed(2)} €</span>
            </div>

            <textarea
              value={reserveNote}
              onChange={(e) => setReserveNote(e.target.value)}
              placeholder="Nota para la tienda (opcional)"
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none mb-5 placeholder:text-gray-400"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowReserve(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitReservation}
                disabled={reserving}
                className="flex-1 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {reserving ? "Enviando..." : "Enviar reserva"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
