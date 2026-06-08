"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { getPublicClient } from "@/lib/db";
import { useCartStore } from "@/store/cart.store";
import type { Product, Shop } from "@/lib/types";

interface WishItem {
  id: string;
  product: Product & { shopName: string; shopSlug: string; shopId: string; categoryColor: string };
}

export default function WishlistPage() {
  const { user, openAuthModal } = useAuthStore();
  const { addItem, openCart }   = useCartStore();
  const [items, setItems]       = useState<WishItem[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
  }, [user]);

  async function load() {
    const supabase = getPublicClient();
    const { data } = await supabase
      .from("wishlists")
      .select("id, products(id, name, description, price, images, tags, stock, shop_id, shops(id, name, slug, shop_categories(color)))")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    setItems(
      (data ?? []).map((w: any) => {
        const p = w.products;
        const shop = p?.shops;
        return {
          id: w.id,
          product: {
            id: p.id, name: p.name, description: p.description ?? "",
            price: Number(p.price), images: p.images ?? [], tags: p.tags ?? [],
            stock: p.stock, shopId: shop?.id ?? p.shop_id, categoryId: "",
            shopName: shop?.name ?? "", shopSlug: shop?.slug ?? "",
            categoryColor: shop?.shop_categories?.color ?? "#6b7280",
          },
        };
      })
    );
    setLoading(false);
  }

  async function remove(wishId: string) {
    const supabase = getPublicClient();
    await supabase.from("wishlists").delete().eq("id", wishId);
    setItems((prev) => prev.filter((i) => i.id !== wishId));
  }

  function addToCart(item: WishItem) {
    addItem(item.product as any, { id: item.product.shopId, name: item.product.shopName, slug: item.product.shopSlug, categoryColor: item.product.categoryColor } as Shop);
    openCart();
  }

  if (!user) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 py-24">
      <div className="text-5xl">❤️</div>
      <div className="text-center">
        <p className="text-lg font-black text-slate-800">Tu lista de deseos</p>
        <p className="text-sm text-slate-400 mt-1">Guarda los productos que te gustan para comprarlos más tarde</p>
      </div>
      <button onClick={() => openAuthModal("login")} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all">
        Iniciar sesión
      </button>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 pb-10">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Lista de deseos</h1>
            <p className="text-slate-400 text-sm mt-0.5">{items.length} producto{items.length !== 1 ? "s" : ""} guardado{items.length !== 1 ? "s" : ""}</p>
          </div>
          <Link href="/" className="text-sm text-indigo-600 font-bold hover:underline">Explorar más</Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">💔</div>
            <p className="text-lg font-black text-slate-700">Aún no has guardado nada</p>
            <p className="text-sm text-slate-400 mt-1">Pulsa el corazón en cualquier producto para añadirlo aquí</p>
            <Link href="/" className="mt-6 inline-flex px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors">
              Descubrir productos
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 p-4 hover:shadow-md transition-shadow">
                <Link href={`/producto/${item.product.id}`} className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  {item.product.images[0] ? (
                    <img src={item.product.images[0]} alt={item.product.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/producto/${item.product.id}`}>
                    <p className="font-bold text-slate-800 truncate hover:text-indigo-600 transition-colors">{item.product.name}</p>
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">{item.product.shopName}</p>
                  <p className="text-lg font-black text-slate-900 mt-1">{item.product.price.toFixed(2)} €</p>
                  {item.product.stock === 0 && (
                    <span className="text-xs text-red-500 font-semibold">Agotado</span>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => addToCart(item)}
                    disabled={item.product.stock === 0}
                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40"
                  >
                    Añadir
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    className="px-4 py-2 bg-red-50 text-red-500 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
