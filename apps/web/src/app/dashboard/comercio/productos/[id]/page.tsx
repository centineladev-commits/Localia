"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { getPublicClient } from "@/lib/db";
import { ImageGalleryUpload } from "@/components/ui/ImageGalleryUpload";
import { useAuthStore } from "@/store/auth.store";

const CATEGORIES = [
  { id: "22222222-0000-0000-0000-000000000001", label: "Alimentación", color: "#22c55e" },
  { id: "22222222-0000-0000-0000-000000000002", label: "Moda",         color: "#ec4899" },
  { id: "22222222-0000-0000-0000-000000000003", label: "Electrónica",  color: "#3b82f6" },
  { id: "22222222-0000-0000-0000-000000000004", label: "Hogar",        color: "#f59e0b" },
  { id: "22222222-0000-0000-0000-000000000005", label: "Artesanía",    color: "#8b5cf6" },
  { id: "22222222-0000-0000-0000-000000000006", label: "Deportes",     color: "#06b6d4" },
  { id: "22222222-0000-0000-0000-000000000007", label: "Belleza",      color: "#f43f5e" },
];

export default function EditProductPage() {
  const router    = useRouter();
  const { id }    = useParams<{ id: string }>();
  const { user }  = useAuthStore();

  const [form, setForm] = useState({
    name: "", description: "", price: "", stock: "",
    categoryId: "", images: [] as string[], tags: "", active: true,
  });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    getPublicClient().from("products").select("*").eq("id", id).single().then(({ data }) => {
      if (data) setForm({
        name:        data.name ?? "",
        description: data.description ?? "",
        price:       String(data.price ?? ""),
        stock:       String(data.stock ?? ""),
        categoryId:  data.category_id ?? "",
        images:      data.images ?? [],
        tags:        (data.tags ?? []).join(", "),
        active:      data.active ?? true,
      });
      setLoading(false);
    });
  }, [id]);

  function set(field: string, value: any) { setForm((p) => ({ ...p, [field]: value })); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    const { error: err } = await getPublicClient().from("products").update({
      name:        form.name,
      description: form.description,
      price:       parseFloat(form.price),
      stock:       parseInt(form.stock),
      category_id: form.categoryId,
      images:      form.images,
      tags:        form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      active:      form.active,
    }).eq("id", id);
    setSaving(false);
    if (err) setError(err.message);
    else router.push("/dashboard/comercio/productos");
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    await getPublicClient().from("products").delete().eq("id", id);
    router.push("/dashboard/comercio/productos");
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/comercio/productos" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
            ← Productos
          </Link>
          <span className="text-slate-200">/</span>
          <h1 className="text-xl font-bold text-slate-900">Editar producto</h1>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {deleting ? "Eliminando..." : "Eliminar"}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Información básica */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Información básica</h2>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre *</label>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required className="input-base" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Descripción</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="input-base resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Precio (€) *</label>
              <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} required className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Stock *</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => set("stock", e.target.value)} required className="input-base" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set("active", !form.active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.active ? "bg-emerald-500" : "bg-slate-300"}`}
            >
              <span className={`inline-block w-5 h-5 transform rounded-full bg-white shadow transition-transform ${form.active ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className="text-sm font-medium text-slate-700">
              {form.active ? "Activo (visible en catálogo)" : "Inactivo (oculto)"}
            </span>
          </div>
        </div>

        {/* Categoría */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría *</h2>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat.id} type="button" onClick={() => set("categoryId", cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border-2 text-[11px] font-semibold transition-all ${
                  form.categoryId === cat.id ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-100 hover:border-slate-200 text-slate-600"
                }`}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Imágenes */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
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
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Etiquetas (separadas por coma)
          </label>
          <input type="text" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="artesano, local..." className="input-base" />
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        <div className="flex gap-3">
          <Link href="/dashboard/comercio/productos" className="flex-1 py-3 text-center border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-sm transition-colors">
            Cancelar
          </Link>
          <button type="submit" disabled={saving}
            className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-60 text-sm transition-colors">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
