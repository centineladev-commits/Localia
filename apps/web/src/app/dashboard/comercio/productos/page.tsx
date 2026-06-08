"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { getPublicClient } from "@/lib/db";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  active: boolean;
  category_id: string;
}

export default function ProductosPage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadProducts();
  }, [user]);

  async function loadProducts() {
    setLoading(true);
    const supabase = getPublicClient();

    // Obtener shop del usuario
    const { data: shops } = await supabase
      .from("shops")
      .select("id")
      .eq("owner_user_id", user!.id)
      .limit(1);

    const shopId = shops?.[0]?.id;
    if (!shopId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("products")
      .select("id, name, description, price, stock, images, active, category_id")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });

    setProducts((data as Product[]) ?? []);
    setLoading(false);
  }

  async function toggleActive(id: string, currentActive: boolean) {
    setToggling(id);
    const supabase = getPublicClient();
    const { error } = await supabase
      .from("products")
      .update({ active: !currentActive })
      .eq("id", id);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, active: !currentActive } : p))
      );
    }
    setToggling(null);
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = products.filter((p) => p.active).length;
  const inactiveCount = products.filter((p) => !p.active).length;

  return (
    <div className="p-6 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Mis productos</h1>
          {loading ? (
            <p className="text-slate-400 text-sm mt-1">Cargando…</p>
          ) : (
            <p className="text-slate-400 text-sm mt-1">
              {activeCount} activo{activeCount !== 1 ? "s" : ""} ·{" "}
              {inactiveCount} inactivo{inactiveCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Link
          href="/dashboard/comercio/productos/nuevo"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <span className="text-lg font-black">+</span> Nuevo producto
        </Link>
      </div>

      {/* Búsqueda */}
      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
        />
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="font-semibold text-slate-600">
              {search ? "No hay productos que coincidan" : "Aún no tienes productos"}
            </p>
            {!search && (
              <Link
                href="/dashboard/comercio/productos/nuevo"
                className="mt-4 inline-flex px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Añadir primer producto
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide px-5 py-3">Producto</th>
                <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Precio</th>
                <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Stock</th>
                <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        {product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate max-w-[160px]">{product.name}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[160px]">
                          {product.description ? product.description.slice(0, 45) + (product.description.length > 45 ? "…" : "") : "Sin descripción"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className="font-black text-sm text-slate-800">{Number(product.price).toFixed(2)} €</span>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className={`text-sm font-semibold ${product.stock === 0 ? "text-red-500" : product.stock <= 5 ? "text-amber-500" : "text-slate-600"}`}>
                      {product.stock} uds
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => toggleActive(product.id, product.active)}
                      disabled={toggling === product.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-60 ${product.active ? "bg-emerald-500" : "bg-slate-300"}`}
                      title={product.active ? "Desactivar producto" : "Activar producto"}
                    >
                      <span className={`inline-block w-4 h-4 transform rounded-full bg-white shadow transition-transform ${product.active ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/dashboard/comercio/productos/${product.id}`}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Editar →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
