"use client";

import { useState, useEffect } from "react";
import { Gift, ShieldCheck, X, Clock, ShieldAlert, RotateCcw, Store, FileText } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { getPublicClient } from "@/lib/db";

// ─────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────
interface AdminShop {
  id: string; name: string; slug: string; status: string; active: boolean;
  address: string | null; phone: string | null; created_at: string;
  owner: { display_name: string | null; email: string } | null;
}
interface AdminReturn {
  id: string; order_id: string; status: string; reason: string;
  refund_amount: number | null; resolution_note: string | null;
  requested_at: string | null; created_at: string;
  buyer: { display_name: string | null; email: string } | null;
  shop: { name: string } | null;
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

const SHOP_BADGE: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  verified:  "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  suspended: "bg-red-50 text-red-600 ring-1 ring-red-200",
};
const SHOP_LABEL: Record<string, string> = { pending: "Pendiente", verified: "Verificado", suspended: "Suspendido" };

const RET_BADGE: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  accepted:  "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  rejected:  "bg-red-50 text-red-600 ring-1 ring-red-200",
};
const RET_LABEL: Record<string, string> = { pending: "Pendiente", accepted: "Aceptada", completed: "Reembolsada", rejected: "Rechazada" };

// ─────────────────────────────────────────────
//  Página principal
// ─────────────────────────────────────────────
export default function AdminPage() {
  const { user, loading } = useAuthStore();
  const [tab, setTab]         = useState<"applications" | "shops" | "returns" | "exemptions">("applications");
  const [token, setToken]     = useState<string | null>(null);
  const [isAdmin, setIsAdmin]           = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    setAdminChecked(false);
    setIsAdmin(false);
    let cancelled = false;

    if (!user) { setAdminChecked(true); return () => { cancelled = true; }; }

    if (user?.app_metadata?.is_admin === true) {
      setIsAdmin(true);
      setAdminChecked(true);
    } else {
      Promise.resolve(
        getPublicClient().from("users").select("role").eq("id", user.id).single()
      )
        .then(({ data }) => {
          if (!cancelled) {
            setIsAdmin((data as { role?: string } | null)?.role === "admin");
            setAdminChecked(true);
          }
        })
        .catch(() => { if (!cancelled) setAdminChecked(true); });
    }

    getPublicClient().auth.getSession().then(({ data }) => {
      if (!cancelled) setToken(data.session?.access_token ?? null);
    });

    return () => { cancelled = true; };
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
        <p className="text-sm text-slate-400 mt-1">Gestiona comercios, devoluciones y beneficios de la plataforma.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-0">
        {([
          { key: "applications", label: "Solicitudes de vendedor", icon: Store       },
          { key: "shops",        label: "Verificación de comercios", icon: ShieldCheck },
          { key: "returns",      label: "Devoluciones",              icon: RotateCcw   },
          { key: "exemptions",   label: "Exenciones de comisión",    icon: Gift        },
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

      {tab === "applications" && <SellerApplicationsTab token={token} />}
      {tab === "shops"        && <ShopsTab token={token} />}
      {tab === "returns"      && <ReturnsTab token={token} />}
      {tab === "exemptions"   && <ExemptionsTab adminId={user.id} token={token} />}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Pestaña: Solicitudes de vendedor (onboarding)
// ─────────────────────────────────────────────
interface SellerApp {
  id: string; business_name: string; nif: string; fiscal_address: string;
  contact_name: string; phone: string; business_email: string; category: string | null;
  website: string | null; description: string | null; status: string; review_note: string | null;
  documents: { type: string; name?: string; signedUrl: string | null }[];
  created_at: string; applicant: { email: string; display_name: string | null } | null;
}
const APP_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  rejected: "bg-red-50 text-red-600 ring-1 ring-red-200",
  needs_more_docs: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
};
const APP_LABEL: Record<string, string> = { pending: "Pendiente", approved: "Aprobada", rejected: "Rechazada", needs_more_docs: "Faltan documentos" };

function SellerApplicationsTab({ token }: { token: string | null }) {
  const [apps, setApps]     = useState<SellerApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [acting, setActing] = useState<string | null>(null);

  function load() {
    if (!token) return;
    fetch("/api/admin/seller-applications", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => { setApps(d.applications ?? []); setLoading(false); }).catch(() => setLoading(false));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

  async function act(id: string, action: "approve" | "reject" | "needs_docs") {
    let note: string | undefined;
    if (action === "reject") { note = window.prompt("Motivo del rechazo (se envía al comercio):") ?? undefined; if (note === undefined) return; }
    if (action === "needs_docs") { note = window.prompt("¿Qué documentación falta?") ?? undefined; if (note === undefined) return; }
    if (action === "approve" && !window.confirm("¿Aprobar este comercio? Se creará su tienda y podrá vender.")) return;
    setActing(id);
    try {
      const res = await fetch("/api/admin/seller-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ applicationId: id, action, note }),
      });
      const d = await res.json();
      if (!res.ok) alert(d.error ?? "Error");
      load();
    } finally { setActing(null); }
  }

  const pending  = apps.filter((a) => a.status === "pending" || a.status === "needs_more_docs");
  const filtered = filter === "pending" ? pending : apps;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {(["pending", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === f ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}>
            {f === "pending" ? "Pendientes" : "Todas"}
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${filter === f ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{f === "pending" ? pending.length : apps.length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><Store className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-semibold">No hay solicitudes {filter === "pending" ? "pendientes" : "registradas"}</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-slate-900">{a.business_name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${APP_BADGE[a.status] ?? APP_BADGE.pending}`}>{APP_LABEL[a.status] ?? a.status}</span>
                    {a.category && <span className="text-xs text-slate-400">· {a.category}</span>}
                  </div>
                  <p className="text-xs text-slate-500">NIF {a.nif} · {a.fiscal_address}</p>
                  <p className="text-xs text-slate-500">{a.contact_name} · {a.phone} · {a.business_email}</p>
                  {a.website && <p className="text-xs text-slate-400">{a.website}</p>}
                  {a.description && <p className="text-sm text-slate-600 mt-2">{a.description}</p>}
                  {a.documents?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {a.documents.map((doc, i) => (
                        <a key={i} href={doc.signedUrl ?? "#"} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                          <FileText className="w-3 h-3" /> {doc.type}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {(a.status === "pending" || a.status === "needs_more_docs") && (
                <div className="flex gap-2 justify-end pt-3 border-t border-slate-50">
                  <button onClick={() => act(a.id, "needs_docs")} disabled={acting === a.id} className="px-3 py-1.5 bg-white border border-blue-200 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-50 disabled:opacity-50">Pedir documentación</button>
                  <button onClick={() => act(a.id, "reject")} disabled={acting === a.id} className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 disabled:opacity-50">Rechazar</button>
                  <button onClick={() => act(a.id, "approve")} disabled={acting === a.id} className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50">{acting === a.id ? "..." : "Aprobar"}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Pestaña: Verificación de comercios (usa /api/admin/shops)
// ─────────────────────────────────────────────
function ShopsTab({ token }: { token: string | null }) {
  const [shops,   setShops]   = useState<AdminShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<"pending" | "verified" | "all">("pending");
  const [acting,  setActing]  = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/admin/shops", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setShops(d.shops ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  async function setStatus(shopId: string, status: "verified" | "suspended") {
    setActing(shopId);
    try {
      const res = await fetch("/api/admin/shops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shopId, status }),
      });
      if (res.ok) {
        setShops((prev) => prev.map((s) => s.id === shopId ? { ...s, status, active: status === "verified" } : s));
      } else {
        const d = await res.json(); alert(d.error ?? "No se pudo actualizar");
      }
    } finally { setActing(null); }
  }

  const pending      = shops.filter((s) => s.status === "pending");
  const verified     = shops.filter((s) => s.status === "verified");
  const verifiedToday = verified.filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString());
  const filtered     = filter === "pending" ? pending : filter === "verified" ? verified : shops;
  const counts       = { pending: pending.length, verified: verified.length, all: shops.length };
  const LABELS = { pending: "Pendientes", verified: "Verificados", all: "Todos" };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total comercios",        value: shops.length },
          { label: "Pendientes de revisión", value: pending.length },
          { label: "Verificados",            value: verified.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {(["pending", "verified", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}>
            {LABELS[f]}
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${filter === f ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><p className="font-semibold">{filter === "pending" ? "No hay comercios pendientes" : "Sin resultados"}</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const initials = (s.name ?? "?").slice(0, 2).toUpperCase();
            const color    = nameToColor(s.name ?? "?");
            const date     = new Date(s.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 hover:border-slate-200 hover:shadow-md transition-all">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 ${color.bg} ${color.text}`}>{initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h2 className="font-bold text-slate-900 text-base">{s.name}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SHOP_BADGE[s.status] ?? SHOP_BADGE.pending}`}>{SHOP_LABEL[s.status] ?? s.status}</span>
                  </div>
                  <p className="text-sm text-slate-400">{s.owner?.email ?? "—"}</p>
                  {s.phone   && <p className="text-xs text-slate-500 mt-1">{s.phone}</p>}
                  {s.address && <p className="text-xs text-slate-500">{s.address}</p>}
                  <p className="text-xs text-slate-300 mt-2">Alta del {date}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {s.status !== "verified" && (
                    <button onClick={() => setStatus(s.id, "verified")} disabled={acting === s.id}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50">
                      {acting === s.id ? "..." : "Verificar"}
                    </button>
                  )}
                  {s.status !== "suspended" && (
                    <button onClick={() => setStatus(s.id, "suspended")} disabled={acting === s.id}
                      className="px-4 py-2 bg-white text-red-500 text-sm font-semibold rounded-xl hover:bg-red-50 border border-red-100 transition-all disabled:opacity-50">
                      Suspender
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

// ─────────────────────────────────────────────
//  Pestaña: Devoluciones (admin override)
// ─────────────────────────────────────────────
function ReturnsTab({ token }: { token: string | null }) {
  const [rows,    setRows]    = useState<AdminReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<"pending" | "all">("pending");
  const [acting,  setActing]  = useState<string | null>(null);

  function load() {
    if (!token) return;
    fetch("/api/returns", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setRows(d.returns ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

  async function override(id: string, action: "accept" | "reject") {
    let note: string | undefined;
    if (action === "reject") { note = window.prompt("Motivo del rechazo:") ?? undefined; if (note === undefined) return; }
    else if (!window.confirm("¿Aceptar y reembolsar esta devolución?")) return;
    setActing(id);
    try {
      const res = await fetch("/api/returns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ returnId: id, action, note }),
      });
      const d = await res.json();
      if (!res.ok) alert(d.error ?? "Error");
      else if (d.refundError) alert("Aceptada, pero el reembolso automático falló. Reembolsa manualmente en Stripe.");
      load();
    } finally { setActing(null); }
  }

  const pending  = rows.filter((r) => r.status === "pending");
  const filtered = filter === "pending" ? pending : rows;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {(["pending", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}>
            {f === "pending" ? "Pendientes" : "Todas"}
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${filter === f ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{f === "pending" ? pending.length : rows.length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><RotateCcw className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-semibold">No hay devoluciones {filter === "pending" ? "pendientes" : "registradas"}</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const buyerName = r.buyer?.display_name || r.buyer?.email?.split("@")[0] || "Cliente";
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-black text-slate-600 font-mono text-sm">#{r.order_id.slice(0, 8).toUpperCase()}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${RET_BADGE[r.status] ?? RET_BADGE.pending}`}>{RET_LABEL[r.status] ?? r.status}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">{buyerName} · <span className="font-normal text-slate-400">{r.shop?.name ?? ""}</span></p>
                    <p className="text-sm text-slate-600 mt-1"><span className="font-semibold">Motivo:</span> {r.reason}</p>
                    {r.resolution_note && <p className="text-xs text-slate-400 mt-1 italic">Nota: {r.resolution_note}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-slate-900">{Number(r.refund_amount ?? 0).toFixed(2)} €</p>
                    {r.status === "pending" && (
                      <div className="mt-2 flex flex-col gap-1.5">
                        <button onClick={() => override(r.id, "accept")} disabled={acting === r.id} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">{acting === r.id ? "..." : "Aceptar y reembolsar"}</button>
                        <button onClick={() => override(r.id, "reject")} disabled={acting === r.id} className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">Rechazar</button>
                      </div>
                    )}
                  </div>
                </div>
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
      setShops((shopData as Shop[]) ?? []);
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
