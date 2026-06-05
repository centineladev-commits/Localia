"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { getPublicClient } from "@/lib/db";

const STATS = [
  {
    label: "Pedidos hoy",
    value: "3",
    trend: "+2 vs ayer",
    trendUp: true,
    from: "from-blue-500",
    to: "to-blue-600",
    lightBg: "bg-blue-50",
    lightText: "text-blue-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
  },
  {
    label: "Ingresos del mes",
    value: "284 €",
    trend: "+18% este mes",
    trendUp: true,
    from: "from-emerald-500",
    to: "to-emerald-600",
    lightBg: "bg-emerald-50",
    lightText: "text-emerald-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Productos activos",
    value: "8",
    trend: "2 agotados",
    trendUp: false,
    from: "from-violet-500",
    to: "to-violet-600",
    lightBg: "bg-violet-50",
    lightText: "text-violet-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: "Valoración media",
    value: "4.8",
    trend: "12 reseñas",
    trendUp: true,
    from: "from-amber-400",
    to: "to-amber-500",
    lightBg: "bg-amber-50",
    lightText: "text-amber-600",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
      </svg>
    ),
  },
];

// Datos del gráfico de barras (últimos 7 días, valores porcentuales de altura)
const CHART_BARS = [
  { day: "L", pct: 40, value: "1.2k" },
  { day: "M", pct: 65, value: "2.0k" },
  { day: "X", pct: 30, value: "0.9k" },
  { day: "J", pct: 80, value: "2.5k" },
  { day: "V", pct: 55, value: "1.7k" },
  { day: "S", pct: 90, value: "2.8k" },
  { day: "D", pct: 45, value: "1.4k" },
];

const RECENT_ORDERS = [
  { id: "#0041", product: "Pan de masa madre × 2", time: "Hace 12 min", status: "pending",   total: "9.00 €" },
  { id: "#0040", product: "Croissant × 3",          time: "Hace 1h",   status: "ready",     total: "6.60 €" },
  { id: "#0039", product: "Torta de aceite × 1",    time: "Hace 3h",   status: "delivered", total: "3.80 €" },
];

const STATUS: Record<string, { label: string; dot: string; cls: string }> = {
  pending:    { label: "Nuevo",      dot: "bg-blue-500",    cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200"     },
  processing: { label: "Preparando", dot: "bg-amber-500",   cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200"   },
  ready:      { label: "Listo",      dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  delivered:  { label: "Entregado",  dot: "bg-slate-400",   cls: "bg-slate-50 text-slate-600 ring-1 ring-slate-200"   },
};

interface Exemption { ends_at: string; reason: string | null; }

export default function DashboardOverview() {
  const { user }    = useAuthStore();
  const name        = user?.user_metadata?.display_name ?? "comerciante";
  const firstName   = name.split(" ")[0];
  const [exemption, setExemption] = useState<Exemption | null>(null);

  const hour     = new Date().getHours();
  const greeting = hour < 13 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";

  // Cargar exención activa
  useEffect(() => {
    if (!user) return;
    getPublicClient()
      .from("shops").select("id").eq("owner_user_id", user.id).limit(1).single()
      .then(({ data: shop }) => {
        if (!shop) return;
        fetch(`/api/my-exemption?shop_id=${shop.id}`)
          .then((r) => r.json())
          .then((d) => setExemption(d.exemption ?? null));
      });
  }, [user]);

  return (
    <div className="p-6 max-w-5xl space-y-6">

      {/* Banner de exención activa */}
      {exemption && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Gift className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-emerald-800">Exención de comisión activa</p>
            <p className="text-xs text-emerald-600 truncate">
              {exemption.reason ? `${exemption.reason} · ` : ""}
              Válida hasta el {new Date(exemption.ends_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">0 % comisión</span>
        </div>
      )}

      {/* Cabecera de bienvenida */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-400 mb-0.5">{greeting},</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{firstName}</h1>
          <p className="text-slate-400 text-sm mt-1">Aquí tienes el resumen de hoy en tu comercio</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-slate-400 font-medium">
            {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p className="text-xs text-slate-300 mt-0.5">Última actualización: ahora</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="relative bg-white rounded-2xl p-5 shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-shadow"
          >
            {/* Fondo decorativo */}
            <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${s.from} ${s.to} opacity-5 group-hover:opacity-10 transition-opacity`} />

            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.lightBg} ${s.lightText}`}>
              {s.icon}
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{s.label}</p>
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${s.trendUp ? "text-emerald-600" : "text-amber-500"}`}>
              {s.trendUp ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9" />
                </svg>
              )}
              {s.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de actividad semanal (CSS puro, sin librería) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-black text-slate-800">Actividad semanal</h2>
            <p className="text-xs text-slate-400 mt-0.5">Visitas a tu perfil esta semana</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full ring-1 ring-emerald-100">
            +23% vs semana anterior
          </span>
        </div>
        <div className="flex items-end gap-2 h-28">
          {CHART_BARS.map((bar, i) => {
            const isToday = i === 5; // Sábado como "hoy" en demo
            return (
              <div key={bar.day} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="relative w-full flex items-end" style={{ height: "88px" }}>
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      isToday
                        ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                        : "bg-slate-100 group-hover:bg-slate-200"
                    }`}
                    style={{ height: `${bar.pct}%` }}
                  />
                  {/* Tooltip al hover */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap">
                      {bar.value}
                    </div>
                  </div>
                </div>
                <span className={`text-[11px] font-bold ${isToday ? "text-emerald-600" : "text-slate-400"}`}>
                  {bar.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Pedidos recientes — ocupa 3 columnas */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-black text-slate-800">Pedidos recientes</h2>
            <Link
              href="/dashboard/comercio/pedidos"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
            >
              Ver todos
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {RECENT_ORDERS.map((o, idx) => {
              const s = STATUS[o.status];
              return (
                <div key={o.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                  {/* Número de pedido */}
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-slate-500">#{String(idx + 39).slice(-2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{o.product}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{o.id} · {o.time}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${s.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                    <span className="text-sm font-black text-slate-700">{o.total}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Acciones rápidas — ocupa 2 columnas */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-black text-slate-800 mb-4">Acciones rápidas</h2>
          <div className="space-y-2.5">

            {/* Añadir producto */}
            <Link
              href="/dashboard/comercio/productos/nuevo"
              className="flex items-center gap-3.5 p-3.5 bg-emerald-50 rounded-xl hover:bg-emerald-100 active:scale-[0.98] transition-all group ring-1 ring-emerald-100"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-emerald-800">Añadir producto</p>
                <p className="text-xs text-emerald-600/80">Publica un nuevo artículo</p>
              </div>
              <svg className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>

            {/* Gestionar pedidos */}
            <Link
              href="/dashboard/comercio/pedidos"
              className="flex items-center gap-3.5 p-3.5 bg-blue-50 rounded-xl hover:bg-blue-100 active:scale-[0.98] transition-all group ring-1 ring-blue-100"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-blue-800">Gestionar pedidos</p>
                <p className="text-xs text-blue-600/80">3 pedidos pendientes</p>
              </div>
              <svg className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>

            {/* Mis productos */}
            <Link
              href="/dashboard/comercio/productos"
              className="flex items-center gap-3.5 p-3.5 bg-violet-50 rounded-xl hover:bg-violet-100 active:scale-[0.98] transition-all group ring-1 ring-violet-100"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-violet-800">Mis productos</p>
                <p className="text-xs text-violet-600/80">8 activos · 2 agotados</p>
              </div>
              <svg className="w-4 h-4 text-violet-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
