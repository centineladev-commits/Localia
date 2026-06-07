"use client";

import { useState, useEffect } from "react";
import { Gift, ShieldCheck, X, Clock, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { getPublicClient } from "@/lib/db";

// ─────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────
interface BusinessRequest {
  id: string; email: string; display_name: string | null; business_name: string | null;
  phone: string | null; address: string | null; nif: string | null;
  website: string | null; instagram: string | null; commercial_type: string;
  verified: boolean | null; created_at: string; updated_at: string;
}
interface Shop { id: string; name: string; slug: string; }
interface Exemption {
  id: string; shop_id: string; starts_at: string; ends_at: string;
  reason: string | null; created_at: string; shops: { name: string; slug: string } | null;
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function nameToColor(name: string): { bg: string; text: string } {
  const palettes = [
    { bg: "bg-violet-500", text: "text-white" }, { bg: "bg-blue-500",    text: "text-white" },
    { bg: "bg-emerald-500",text: "text-white" }, { bg: "bg-amber-500",   text: "text-white" },
    { bg: "bg-rose-500",   text: "text-white" }, { bg: "bg-indigo-500",  text: "text-white" },
    { bg: "bg-teal-500",   text: "text-white" }, { bg: "bg-orange-500",  text: "text-white" },
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palettes[Math.abs(h) % palettes.length];
}

function isActive(ex: Exemption): boolean {
  const now = Date.now();
  return new Date(ex.starts_at).getTime() <= now && new Date(ex.ends_at).getTime() >= now;
}

// ─────────────────────────────────────────────
//  Página principal
// ─────────────────────────────────────────────
export default function AdminPage() {
  const { user, loading } = useAuthStore();
  const [tab, setTab]         = useState<"shops" | "exemptions">("shops");
  const [token, setToken]     = useState<string | null>(null);
  const [isAdmin, setIsAdmin]           = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    if (!user) { setAdminChecked(true); return; }

    // Check 1: app_metadata.is_admin (set via Supabase Auth dashboard)
    if (user?.app_metadata?.is_admin === true) {
      setIsAdmin(true);
      setAdminChecked(true);
    } else {
      // Check 2: users table role column (fallback for dev / missing metadata)
      getPublicClient()
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setIsAdmin(data?.role === "admin");
          setAdminChecked(true);
        });
    }

    getPublicClient().auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, [user]);

  if (loading || !adminChecked) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user || !isAdmin) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
      <ShieldAlert className="w-12 h-12 text-slate-300" />
      <p className="font-semibold text-slate-700">Acceso restringido</p>
      <p className="text-sm text-slate-400">Esta sección es solo para administradores de Localia.</p>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel de administración</h1>
        <p className="text-sm text-slate-400 mt-1">Gestiona comercios y beneficios especiales de la plataforma.</p>
      </div>

      {/* Pestañas */}
      <div className="flex gap-2 border-b border-slate-100 pb-0">
        {([
          { key: "shops",      label: "Verificación de comercios", icon: ShieldCheck },
          { key: "exemptions", label: "Exenciones de comisión",    icon: Gift        },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-colors ${
              tab === key
                ? "border-indigo-600 text-indigo-600 bg-indigo-50"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "shops"      && <ShopsTab userId={user.id} />}
      {tab === "exemptions" && <ExemptionsTab adminId={user.id} token={token} />}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Pestaña: Verificación de comercios
// ─────────────────────────────────────────────
function ShopsTab({ userId }: { userId: string }) {
  const [requests,   setRequests]   = useState<BusinessRequest[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState<"all" | "pending" | "approved">("pending");
  const [confirming, setConfirming] = useState<{ id: string; approve: boolean } | null>(null);

  useEffect(() => {
    getPublicClient().from("users").select("*").eq("commercial_type", "business")
      .order("updated_at", { ascending: false })
      .then(({ data }) => { setRequests((data as BusinessRequest[]) ?? []); setLoading(false); });
  }, []);

  async function handleVerify(id: string, approve: boolean) {
    await getPublicClient().from("users").update({ verified: approve }).eq("id", id);
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, verified: approve } : r));
    setConfirming(null);
  }

  const pending      = requests.filter((r) => r.verified === null || r.verified === undefined);
  const approved     = requests.filter((r) => r.verified === true);
  const approvedToday = approved.filter((r) => new Date(r.updated_at).toDateString() === new Date().toDateString());
  const filtered     = filter === "pending" ? pending : filter === "approved" ? approved : requests;
  const counts       = { pending: pending.length, approved: approved.length, all: requests.length };
  const FILTER_LABELS = { pending: "Pendientes", approved: "Aprobados", all: "Todos" };

  return (
    <div className="space-y-5">
      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total solicitudes",    value: requests.length,        borderClass: "border-slate-100",   iconColor: "text-slate-400",   bgClass: "bg-slate-50" },
          { label: "Pendientes de revisión",value: pending.length,         borderClass: "border-amber-100",   iconColor: "text-amber-500",   bgClass: "bg-amber-50" },
          { label: "Aprobadas hoy",         value: approvedToday.length,   borderClass: "border-emerald-100", iconColor: "text-emerald-500", bgClass: "bg-emerald-50" },
        ].map(({ label, value, borderClass, iconColor, bgClass }) => (
          <div key={label} className={`bg-white rounded-2xl border ${borderClass} shadow-sm p-4`}>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        {(["pending", "approved", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}>
            {FILTER_LABELS[f]}
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${filter === f ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Modal confirmación */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 text-center">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {confirming.approve ? "¿Aprobar comercio?" : "¿Rechazar solicitud?"}
            </h3>
            <p className="text-sm text-slate-400 mb-5">
              {confirming.approve ? "El comercio quedará verificado y visible en Localia." : "La solicitud quedará rechazada."}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirming(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={() => handleVerify(confirming.id, confirming.approve)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white ${confirming.approve ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600"}`}>
                {confirming.approve ? "Aprobar" : "Rechazar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="font-semibold">{filter === "pending" ? "No hay solicitudes pendientes" : "Sin resultados"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const status   = r.verified === true ? "approved" : r.verified === false ? "rejected" : "pending";
            const initials = (r.business_name ?? r.email ?? "?").slice(0, 2).toUpperCase();
            const color    = nameToColor(r.business_name ?? r.email ?? "?");
            const date     = new Date(r.updated_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 ${color.bg} ${color.text}`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h2 className="font-bold text-slate-900 text-base">{r.business_name ?? "(sin nombre)"}</h2>
                    {status === "pending"  && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200">Pendiente</span>}
                    {status === "approved" && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">Verificado</span>}
                    {status === "rejected" && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 ring-1 ring-red-200">Rechazado</span>}
                  </div>
                  <p className="text-sm text-slate-400">{r.email}</p>
                  {r.phone    && <p className="text-xs text-slate-500 mt-1">{r.phone}</p>}
                  {r.address  && <p className="text-xs text-slate-500">{r.address}</p>}
                  <p className="text-xs text-slate-300 mt-2">Solicitud del {date}</p>
                </div>
                {status === "pending" && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => setConfirming({ id: r.id, approve: true })}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
                      Aprobar
                    </button>
                    <button onClick={() => setConfirming({ id: r.id, approve: false })}
                      className="px-4 py-2 bg-white text-red-500 text-sm font-semibold rounded-xl hover:bg-red-50 border border-red-100 transition-colors">
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Pestaña: Exenciones de comisión
// ─────────────────────────────────────────────
function ExemptionsTab({ adminId, token }: { adminId: string; token: string | null }) {
  const [exemptions, setExemptions] = useState<Exemption[]>([]);
  const [shops,      setShops]      = useState<Shop[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [form, setForm] = useState({
    shop_id: "", starts_at: new Date().toISOString().slice(0, 10),
    ends_at: "", reason: "",
  });

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("/api/admin/fee-exemptions", { headers }).then((r) => r.json()),
      getPublicClient().from("shops").select("id, name, slug").eq("active", true).order("name"),
    ]).then(([exData, { data: shopData }]) => {
      setExemptions(exData.exemptions ?? []);
      setShops(shopData ?? []);
      setLoading(false);
    });
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.shop_id || !form.ends_at) return;
    setSaving(true);
    const res  = await fetch("/api/admin/fee-exemptions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, granted_by: adminId }),
    });
    const data = await res.json();
    if (data.exemption) {
      const shop = shops.find((s) => s.id === form.shop_id);
      setExemptions((prev) => [{ ...data.exemption, shops: shop ? { name: shop.name, slug: shop.slug } : null }, ...prev]);
      setShowForm(false);
      setForm({ shop_id: "", starts_at: new Date().toISOString().slice(0, 10), ends_at: "", reason: "" });
    }
    setSaving(false);
  }

  async function handleRevoke(id: string) {
    if (!confirm("¿Revocar esta exención?")) return;
    await fetch(`/api/admin/fee-exemptions?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setExemptions((prev) => prev.filter((e) => e.id !== id));
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Exenciones de comisión</h2>
          <p className="text-sm text-slate-400 mt-0.5">Los comercios exentos no pagan comisión a la plataforma durante el periodo activo.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Gift className="w-4 h-4" />
          Nueva exención
        </button>
      </div>

      {/* Formulario de nueva exención */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-indigo-800">Conceder exención</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Comercio *</label>
              <select
                value={form.shop_id}
                onChange={(e) => setForm((p) => ({ ...p, shop_id: e.target.value }))}
                required className="input-base"
              >
                <option value="">Selecciona un comercio…</option>
                {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Motivo</label>
              <input type="text" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Ej: Comercio nuevo — periodo de gracia" className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Desde *</label>
              <input type="date" value={form.starts_at} onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))}
                required className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hasta *</label>
              <input type="date" value={form.ends_at} onChange={(e) => setForm((p) => ({ ...p, ends_at: e.target.value }))}
                required className="input-base" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              {saving ? "Guardando…" : "Conceder exención"}
            </button>
          </div>
        </form>
      )}

      {/* Lista de exenciones */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-7 h-7 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : exemptions.length === 0 ? (
        <div className="text-center py-14 text-slate-400">
          <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No hay exenciones registradas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {exemptions.map((ex) => {
            const active = isActive(ex);
            return (
              <div key={ex.id} className={`bg-white rounded-2xl border p-4 flex items-center gap-4 ${active ? "border-emerald-200" : "border-slate-100 opacity-60"}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? "bg-emerald-50" : "bg-slate-100"}`}>
                  <Gift className={`w-4 h-4 ${active ? "text-emerald-500" : "text-slate-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{ex.shops?.name ?? ex.shop_id}</p>
                  {ex.reason && <p className="text-xs text-slate-400 truncate">{ex.reason}</p>}
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {fmt(ex.starts_at)} — {fmt(ex.ends_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {active ? "Activa" : "Expirada"}
                  </span>
                  {active && (
                    <button onClick={() => handleRevoke(ex.id)}
                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
