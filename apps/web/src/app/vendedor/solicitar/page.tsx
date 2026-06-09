"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { getPublicClient } from "@/lib/db";
import { PageWrapper } from "@/components/layout/PageWrapper";

interface DocRef { type: string; url: string; name: string; }

const CATS = ["Alimentación", "Moda", "Electrónica", "Hogar", "Artesanía", "Deportes", "Belleza", "Otros"];

async function token(): Promise<string | null> {
  try { const { data: { session } } = await getPublicClient().auth.getSession(); return session?.access_token ?? null; }
  catch { return null; }
}

export default function SolicitarVendedorPage() {
  const { user, openAuthModal } = useAuthStore();
  const [form, setForm] = useState({
    business_name: "", nif: "", fiscal_address: "", contact_name: "", phone: "",
    business_email: "", category: "", website: "", social: "", description: "",
  });
  const [docs, setDocs] = useState<DocRef[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [existing, setExisting] = useState<{ status: string; review_note: string | null } | null>(null);
  const [checking, setChecking] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      if (!user) { setChecking(false); return; }
      setForm((f) => ({ ...f, business_email: f.business_email || user.email || "" }));
      const t = await token();
      const res = await fetch("/api/seller/apply", { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      if (data.application && ["pending", "needs_more_docs", "approved"].includes(data.application.status)) {
        setExisting(data.application);
      }
      setChecking(false);
    })();
  }, [user]);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>, type: string) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) { setError("El documento supera los 10 MB."); return; }
    setError(null); setUploading(true);
    try {
      const supabase = getPublicClient();
      const path = `${user.id}/${type}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("seller-docs").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      setDocs((d) => [...d.filter((x) => x.type !== type), { type, url: path, name: file.name }]);
    } catch (err: any) {
      setError(err?.message?.includes("Bucket not found")
        ? "Falta el bucket 'seller-docs' (aplica la migración 0011)."
        : "No se pudo subir el documento.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.business_name || !form.nif || !form.fiscal_address || !form.contact_name || !form.phone || !form.business_email) {
      setError("Rellena todos los campos obligatorios (*)."); return;
    }
    setSubmitting(true);
    try {
      const t = await token();
      const res = await fetch("/api/seller/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ ...form, documents: docs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo enviar");
      setDone(true);
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  const L = "block text-xs font-bold text-slate-500 mb-1.5 tracking-wide";
  const I = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent";

  let content: React.ReactNode;
  if (!user) {
    content = (
      <div className="text-center py-20">
        <p className="text-lg font-black text-slate-800">Inicia sesión para solicitar tu cuenta de vendedor</p>
        <button onClick={() => openAuthModal("login")} className="mt-5 px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">Iniciar sesión</button>
      </div>
    );
  } else if (checking) {
    content = <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  } else if (done || existing?.status === "pending" || existing?.status === "approved") {
    const approved = existing?.status === "approved";
    content = (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl ${approved ? "bg-emerald-100" : "bg-indigo-100"}`}>{approved ? "🎉" : "📨"}</div>
        <h1 className="text-2xl font-black text-slate-900">{approved ? "¡Ya eres vendedor!" : "Solicitud enviada"}</h1>
        <p className="text-slate-500 mt-2 text-sm">{approved ? "Tu comercio está verificado. Accede a tu panel para publicar productos." : "Hemos recibido tu solicitud. Nuestro equipo la revisará en 24–48 h y te avisará por email."}</p>
        <Link href={approved ? "/dashboard/comercio" : "/"} className="mt-6 inline-flex px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors">{approved ? "Ir a mi panel" : "Volver al inicio"}</Link>
      </div>
    );
  } else {
    content = (
      <form onSubmit={submit} className="max-w-2xl mx-auto space-y-5 pb-10">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Vende en Localia</h1>
          <p className="text-slate-400 text-sm mt-1">Completa tus datos y verificaremos tu comercio en 24–48 h.</p>
        </div>
        {existing?.status === "needs_more_docs" && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
            <strong>Documentación adicional requerida.</strong> {existing.review_note}
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Datos del negocio</h2>
          <div><label className={L}>Nombre del negocio *</label><input className={I} value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="Panadería García" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={L}>CIF / NIF *</label><input className={I} value={form.nif} onChange={(e) => setForm({ ...form, nif: e.target.value })} placeholder="B12345678" /></div>
            <div><label className={L}>Categoría</label>
              <select className={I} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Selecciona…</option>{CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div><label className={L}>Dirección fiscal *</label><input className={I} value={form.fiscal_address} onChange={(e) => setForm({ ...form, fiscal_address: e.target.value })} placeholder="Calle Mayor 12, 28013 Madrid" /></div>
          <div><label className={L}>Descripción del comercio</label><textarea rows={3} className={I + " resize-none"} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="¿Qué vendes? ¿Qué te hace especial?" /></div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Persona de contacto</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={L}>Nombre y apellidos *</label><input className={I} value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
            <div><label className={L}>Teléfono *</label><input className={I} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+34 600 000 000" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={L}>Email de negocio *</label><input type="email" className={I} value={form.business_email} onChange={(e) => setForm({ ...form, business_email: e.target.value })} /></div>
            <div><label className={L}>Web o redes</label><input className={I} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://… o @instagram" /></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Documentación de verificación</h2>
          <p className="text-xs text-slate-400">Sube imágenes o PDF. Solo nuestro equipo de verificación puede verlos (almacenamiento privado).</p>
          {[{ k: "cif", label: "CIF / Alta autónomo" }, { k: "dni", label: "DNI del representante" }, { k: "licencia", label: "Licencia (si aplica)" }].map((doc) => {
            const up = docs.find((d) => d.type === doc.k);
            return (
              <div key={doc.k} className="flex items-center justify-between gap-3 p-3 border border-dashed border-slate-200 rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700">{doc.label}</p>
                  {up && <p className="text-xs text-emerald-600 truncate">✓ {up.name}</p>}
                </div>
                <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 cursor-pointer whitespace-nowrap">
                  {up ? "Cambiar" : "Subir"}
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFiles(e, doc.k)} disabled={uploading} />
                </label>
              </div>
            );
          })}
        </div>

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        <button type="submit" disabled={submitting || uploading} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-xl shadow-indigo-100 disabled:opacity-60">
          {submitting ? "Enviando solicitud…" : uploading ? "Subiendo documento…" : "Enviar solicitud"}
        </button>
        <p className="text-xs text-center text-slate-400">Al enviar aceptas los <Link href="/terminos" className="underline hover:text-indigo-600">términos para vendedores</Link>.</p>
      </form>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-full bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-10">{content}</div>
      </div>
    </PageWrapper>
  );
}
