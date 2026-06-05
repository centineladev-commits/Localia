"use client";

import { useState } from "react";
import Link from "next/link";
import { DEMO_SHOPS } from "@/lib/demo-data";

const MOCK_PRODUCTS = (DEMO_SHOPS[0].products ?? []).map((p) => ({ ...p, active: true }));

export default function ProductosPage() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggleActive(id: string) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  }

  return (
    <div className="p-6 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Mis productos</h1>
          <p className="text-gray-400 text-sm mt-1">{products.filter((p) => p.active).length} activos · {products.filter((p) => !p.active).length} inactivos</p>
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
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
        />
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">📦</div>
            <p className="font-medium">No hay productos que coincidan</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-3">Producto</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Precio</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Stock</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        {product.images[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate max-w-[160px]">{product.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[160px]">{product.description.slice(0, 40)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className="font-black text-sm text-gray-800">{product.price.toFixed(2)} €</span>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className={`text-sm font-semibold ${product.stock === 0 ? "text-red-500" : product.stock <= 5 ? "text-orange-500" : "text-gray-600"}`}>
                      {product.stock} uds
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => toggleActive(product.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${product.active ? "bg-emerald-500" : "bg-gray-300"}`}
                    >
                      <span className={`inline-block w-4 h-4 transform rounded-full bg-white shadow transition-transform ${product.active ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/dashboard/comercio/productos/${product.id}`} className="text-xs font-semibold text-gray-700 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
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
