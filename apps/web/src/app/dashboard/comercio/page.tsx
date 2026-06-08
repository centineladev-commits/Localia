"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { getPublicClient } from "@/lib/db";

// Datos del gráfico de barras (últimos 7 días, decorativo)
const CHART_BARS = [
  { day: "L", pct: 40, value: "1.2k" },
  { day: "M", pct: 65, value: "2.0k" },
  { day: "X", pct: 30, value: "0.9k" },
  { day: "J", pct: 80, value: "2.5k" },
  { day: "V", pct: 55, value: "1.7k" },
  { day: "S", pct: 90, value: "2.8k" },
  { day: "D", pct: 45, value: "1.4k" },
];

const STATUS: Record<string, { label: string; dot: string; cls: string }> = {
  pending:    { label: "Nuevo",      dot: "bg-blue-500",    cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200"     },
  processing: { label: "Preparando", dot: "bg-amber-500",   cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200"   },
  ready:      { label: "Listo",      dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  delivered:  { label: "Entregado",  dot: "bg-slate-400",   cls: "bg-slate-50 text-slate-600 ring-1 ring-slate-200"   },
  paid:       { label: "Pagado",     dot: "bg-emerald-400", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  cancelled:  { label: "Cancelado",  dot: "bg-red-400",     cls: "bg-red-50 text-red-600 ring-1 ring-red-200"         },
};

interface Exemption { ends_at: string; reason: string | null; }

interface OrderItem { name: string; qty: number; price: number; }

interface RecentOrder {
  id: string;
  items: OrderItem[];
  created_at: string;
  status: string;
  total: number;
}

interface DashStats {
  pedidos_hoy: number;
  ingresos_mes: number;
  productos_activos: number;
  media_valoracion: number | null;
  total_resenas: number;
  pedidos_recientes: RecentOrder[];
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

function formatOrderItems(items: OrderItem[]): string {
  if (!items || items.length === 0) return "Sin artículos";
  return items.map((i) => `${i.name} × ${i.qty}`).join(", ");
}

export default function DashboardOverview() {
  const { user }    = useAuthStore();
  const name        = user?.user_metadata?.display_name ?? "comerciante";
  const firstName   = name.split(" ")[0];
  const [exemption, setExemption] = useState<Exemption | null>(null);
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);

  const hour     = new Date().getHours();
  const greeting = hour < 13 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";

  useEffect(() => {
    if (!user) return;

    const supabase = getPublicClient();

    async function loadData() {
      try {
        // 1. Obtener el shop del usuario
        const { data: shop } = await supabase
          .from("shops")
          .select("id")
          .eq("owner_user_id", user!.id)
          .limit(1)
          .single();

        if (!shop) {
          setStats({ pedidos_hoy: 0, ingresos_mes: 0, productos_activos: 0, media_valoracion: null, total_resenas: 0, pedidos_recientes: [] });
          setLoading(false);
          return;
        }

        // Cargar exención activa
        fetch(`/api/my-exemption?shop_id=${shop.id}`)
          .then((r) => r.json())
          .then((d) => setExemption(d.exemption ?? null));

        // 2. Pedidos de hoy
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { count: pedidos_hoy } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shop.id)
          .gte("created_at", todayStart.toISOString());

        // 3. Ingresos del mes (solo pedidos con estado pagado/activo)
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const { data: ordersThisMonth } = await supabase
          .from("orders")
          .select("total")
          .eq("shop_id", shop.id)
          .in("status", ["paid", "processing", "ready", "delivered"])
          .gte("created_at", monthStart.toISOString());

        const ingresos_mes = (ordersThisMonth ?? []).reduce(
          (acc, o) => acc + (Number(o.total) || 0),
          0
        );

        // 4. Productos activos
        const { count: productos_activos } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shop.id)
          .eq("active", true);

        // 5. Valoración media
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("rating")
          .eq("shop_id", shop.id);

        const total_resenas = reviewsData?.length ?? 0;
        const media_valoracion =
          total_resenas > 0
            ? reviewsData!.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / total_resenas
            : null;

        // 6. Pedidos recientes (últimos 5)
        const { data: pedidos_recientes } = await supabase
          .from("orders")
          .select("id, items, created_at, status, total")
          .eq("shop_id", shop.id)
          .order("created_at", { ascending: false })
          .limit(5);

        setStats({
          pedidos_hoy: pedidos_hoy ?? 0,
          ingresos_mes,
          productos_activos: productos_activos ?? 0,
          media_valoracion,
          total_resenas,
          pedidos_recientes: (pedidos_recientes ?? []) as RecentOrder[],
        });
      } catch {
        setStats({ pedidos_hoy: 0, ingresos_mes: 0, productos_activos: 0, media_valoracion: null, total_resenas: 0, pedidos_recientes: [] });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const dash = stats;

  const STATS_CONFIG = [
    {
      label: "Pedidos hoy",
      value: loading ? "—" : String(dash?.pedidos_hoy ?? 0),
      trend: loading ? "" : `${dash?.pedidos_hoy ?? 0} pedidos`,
      trendUp: (dash?.pedidos_hoy ?? 0) > 0,
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
      value: loading ? "—" : `${(dash?.ingresos_mes ?? 0).toFixed(2)} €`,
      trend: loading ? "" : "este mes",
      trendUp: (dash?.ingresos_mes ?? 0) > 0,
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
      value: loading ? "—" : String(dash?.productos_activos ?? 0),
      trend: loading ? "" : `${dash?.productos_activos ?? 0} activos`,
      trendUp: (dash?.productos_activos ?? 0) > 0,
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
      value: loading ? "—" : dash?.media_valoracion != null ? dash.media_valoracion.toFixed(1) : "—",
      trend: loading ? "" : `${dash?.total_resenas ?? 0} reseñas`,
      trendUp: (dash?.media_valoracion ?? 0) >= 4,
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
        {STATS_CONFIG.map((s) => (
          <div
            key={s.label}
            className="relative bg-white rounded-2xl p-5 shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-shadow"
          >
            {/* Fondo decorativo */}
            <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${s.from} ${s.to} opacity-5 group-hover:opacity-10 transition-opacity`} />

            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.lightBg} ${s.lightText}`}>
              {s.icon}
            </div>
            <p className={`text-2xl font-black tracking-tight ${loading ? "text-slate-300 animate-pulse" : "text-slate-900"}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{s.label}</p>
            {!loading && s.trend && (
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
            )}
          </div>
        ))}
      </div>

      {/* Gráfico de actividad semanal (CSS puro, sin librería, decorativo) */}
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
            {loading ? (
              // Skeleton de carga
              [1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
                    <div className="h-2.5 bg-slate-100 rounded animate-pulse w-1/2" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="h-5 bg-slate-100 rounded-full animate-pulse w-16" />
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-12" />
                  </div>
                </div>
              ))
            ) : dash && dash.pedidos_recientes.length > 0 ? (
              dash.pedidos_recientes.map((o, idx) => {
                const statusKey = o.status in STATUS ? o.status : "pending";
                const s = STATUS[statusKey];
                const shortId = o.id.slice(0, 8).toUpperCase();
                return (
                  <div key={o.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                    {/* Número de pedido */}
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-slate-500">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{formatOrderItems(o.items)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">#{shortId} · {formatRelativeTime(o.created_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${s.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                      <span className="text-sm font-black text-slate-700">{Number(o.total).toFixed(2)} €</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                No hay pedidos todavía
              </div>
            )}
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
                <p className="text-xs text-blue-600/80">
                  {loading ? "Cargando..." : `${dash?.pedidos_hoy ?? 0} pedidos hoy`}
                </p>
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
                <p className="text-xs text-violet-600/80">
                  {loading ? "Cargando..." : `${dash?.productos_activos ?? 0} activos`}
                </p>
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
