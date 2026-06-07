"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { getPublicClient } from "@/lib/db";
import { ImageGalleryUpload } from "@/components/ui/ImageGalleryUpload";

const CATEGORIES = [
  { id: "22222222-0000-0000-0000-000000000001", label: "Alimentación", color: "#22c55e" },
  { id: "22222222-0000-0000-0000-000000000002", label: "Moda",         color: "#ec4899" },
  { id: "22222222-0000-0000-0000-000000000003", label: "Electrónica",  color: "#3b82f6" },
  { id: "22222222-0000-0000-0000-000000000004", label: "Hogar",        color: "#f59e0b" },
  { id: "22222222-0000-0000-0000-000000000005", label: "Artesanía",    color: "#8b5cf6" },
  { id: "22222222-0000-0000-0000-000000000006", label: "Deportes",     color: "#06b6d4" },
  { id: "22222222-0000-0000-0000-000000000007", label: "Belleza",      color: "#f43f5e" },
];

export default function NuevoProductoPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [form, setForm] = useState({
    name: "", description: "", price: "", stock: "",
    categoryId: "", images: [] as string[], tags: "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  function set(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock || !form.categoryId) {
      setError("Rellena todos los campos obligatorios.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const supabase = getPublicClient();

      const { data: shops } = await supabase
        .from("shops")
        .select("id, city_id")
        .eq("owner_user_id", user?.id)
        .limit(1);

      const shop = shops?.[0];
      if (!shop) {
        setError("No tienes ningún comercio registrado. Contacta con el equipo para darlo de alta.");
        setLoading(false);
        return;
      }

      if (!shop.city_id) {
        setError("Tu comercio no tiene ciudad asignada. Contacta con el equipo de Localia para configurarla antes de publicar productos.");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from("products").insert({
        shop_id:     shop.id,
        city_id:     shop.city_id,
        category_id: form.categoryId,
        name:        form.name,
        description: form.description,
        price:       parseFloat(form.price),
        stock:       parseInt(form.stock),
        images:      form.images,
        tags:        form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        condition:   "new",
        active:      true,
      });

      if (insertError) throw insertError;
      router.push("/dashboard/comercio/productos");
    } catch (err: any) {
      setError(err.message ?? "Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/comercio/productos" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
          ← Productos
        </Link>
        <span className="text-slate-200">/</span>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo producto</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Información básica */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Información básica</h2>

          <Field label="Nombre del producto *">
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej: Pan de masa madre"
              required
              className="input-base"
            />
          </Field>

          <Field label="Descripción">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe tu producto..."
              rows={3}
              className="input-base resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio (€) *">
              <input
                type="number" step="0.01" min="0"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="0.00" required className="input-base"
              />
            </Field>
            <Field label="Stock *">
              <input
                type="number" min="0"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
                placeholder="0" required className="input-base"
              />
            </Field>
          </div>
        </div>

        {/* Categoría */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría *</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => set("categoryId", cat.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                  form.categoryId === cat.id
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-100 hover:border-slate-200 text-slate-600"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Imágenes */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fotos del producto</h2>
          {user && (
            <ImageGalleryUpload
              userId={user.id}
              images={form.images}
              onChange={(imgs) => set("images", imgs)}
              maxImages={6}
            />
          )}
        </div>

        {/* Etiquetas */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <Field label="Etiquetas (separadas por coma)">
            <input
              type="text"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="artesano, sin gluten, local..."
              className="input-base"
            />
          </Field>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        <div className="flex gap-3">
          <Link
            href="/dashboard/comercio/productos"
            className="flex-1 py-3 text-center border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 shadow-sm text-sm"
          >
            {loading ? "Guardando..." : "Publicar producto"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}
