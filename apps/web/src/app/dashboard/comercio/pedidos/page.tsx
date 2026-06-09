"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { getPublicClient } from "@/lib/db";

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string; next?: string; nextLabel?: string }> = {
  pending:    { label: "Nuevo",       cls: "bg-blue-50 text-blue-700",      dot: "bg-blue-500",    next: "processing", nextLabel: "Aceptar pedido" },
  paid:       { label: "Pagado",      cls: "bg-indigo-50 text-indigo-700",  dot: "bg-indigo-500",  next: "processing", nextLabel: "Empezar a preparar" },
  processing: { label: "Preparando",  cls: "bg-amber-50 text-amber-700",   dot: "bg-amber-500",   next: "ready",      nextLabel: "Listo para recoger" },
  ready:      { label: "Listo",       cls: "bg-emerald-50 text-emerald-700",dot: "bg-emerald-500", next: "delivered",  nextLabel: "Marcar entregado" },
  delivered:  { label: "Entregado",   cls: "bg-gray-100 text-gray-500",    dot: "bg-gray-400" },
  cancelled:  { label: "Cancelado",   cls: "bg-red-50 text-red-500",       dot: "bg-red-400" },
};

const FILTER_OPTIONS = [
  { key: null,         label: "Todos" },
  { key: "pending",    label: "Nuevos" },
  { key: "paid",       label: "Pagados" },
  { key: "processing", label: "Preparando" },
  { key: "ready",      label: "Listos" },
  { key: "delivered",  label: "Entregados" },
];

const RET_LABELS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Pendiente",                  cls: "bg-amber-50 text-amber-700" },
  accepted:  { label: "Aceptada · reembolso manual", cls: "bg-blue-50 text-blue-700" },
  completed: { label: "Reembolsada",                cls: "bg-emerald-50 text-emerald-700" },
  rejected:  { label: "Rechazada",                  cls: "bg-red-50 text-red-500" },
};

interface Order {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  delivery_type: string;
  delivery_address: string | null;
  created_at: string;
  paid_at: string | null;
  items: { name: string; qty: number; price: number }[];
  buyer: { display_name: string | null; email: string } | null;
}

interface ReturnRow {
  id: string;
  order_id: string;
  status: string;
  reason: string;
  refund_amount: number | null;
  resolution_note: string | null;
  requested_at: string | null;
  created_at: string;
  buyer: { display_name: string | null; email: string } | null;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${days}d`;
}

async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await getPublicClient().auth.getSession();
    return session?.access_token ?? null;
  } catch { return null; }
}

export default function PedidosPage() {
  const { user } = useAuthStore();
  const [orders, setOrders]   = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [view, setView]       = useState<"orders" | "returns">("orders");
  const [filter, setFilter]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId]   = useState<string | null>(null);
  const [acting, setActing]   = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadAll() {
    setLoading(true);
    const supabase = getPublicClient();
    const { data: shops } = await supabase
      .from("shops").select("id").eq("owner_user_id", user!.id).limit(1);
    const sid = shops?.[0]?.id ?? null;
    setShopId(sid);
    if (!sid) { setLoading(false); return; }

    const [{ data: ord }, { data: rets }] = await Promise.all([
      supabase
        .from("orders")
        .select("id, status, total, subtotal, delivery_type, delivery_address, created_at, paid_at, items, users!buyer_user_id(display_name, email)")
        .eq("shop_id", sid)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("returns")
        .select("id, order_id, status, reason, refund_amount, resolution_note, requested_at, created_at, users!buyer_user_id(display_name, email)")
        .eq("shop_id", sid)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    setOrders((ord ?? []).map((o: any) => ({ ...o, items: Array.isArray(o.items) ? o.items : [], buyer: o.users ?? null })));
    setReturns((rets ?? []).map((r: any) => ({ ...r, buyer: r.users ?? null })));
    setLoading(false);
  }

  async function advance(orderId: string, nextStatus: string) {
    const supabase = getPublicClient();
    await supabase.from("orders").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: nextStatus } : o));
  }

  async function resolveReturn(id: string, action: "accept" | "reject") {
    let note: string | undefined;
    if (action === "reject") {
      note = window.prompt("Motivo del rechazo (se enviará al comprador):") ?? undefined;
      if (note === undefined) return; // canceló el prompt
    } else {
      if (!window.confirm("¿Aceptar la devolución? Se emitirá el reembolso al comprador.")) return;
    }
    setActing(id);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/returns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ returnId: id, action, note }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "No se pudo procesar la devolución"); }
      else if (data.refundError) {
        alert("Devolución aceptada, pero el reembolso automático falló. Reembolsa manualmente desde Stripe.");
      }
      await loadAll();
    } finally { setActing(null); }
  }

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;
  const newCount  = orders.filter((o) => o.status === "pending" || o.status === "paid").length;
  const pendingReturns = returns.filter((r) => r.status === "pending").length;

  return (
    <div className="p-6 max-w-5xl animate-fade-in">
      {/* Header + toggle Pedidos / Devoluciones */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{view === "orders" ? "Pedidos" : "Devoluciones"}</h1>
          <div className="flex items-center gap-3 mt-1.5">
            {view === "orders" && newCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> {newCount} nuevo{newCount !== 1 ? "s" : ""}
              </span>
            )}
            {view === "orders" && newCount === 0 && <span className="text-sm text-gray-400">Todo al día ✓</span>}
            {view === "returns" && <span className="text-sm text-gray-400">{returns.length} solicitud{returns.length !== 1 ? "es" : ""}</span>}
          </div>
        </div>
        <button onClick={loadAll} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors px-3 py-2 rounded-xl hover:bg-gray-100">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
          Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setView("orders")} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${view === "orders" ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-white text-gray-500 border border-gray-200 hover:border-indigo-200"}`}>
          Pedidos
        </button>
        <button onClick={() => setView("returns")} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${view === "returns" ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-white text-gray-500 border border-gray-200 hover:border-indigo-200"}`}>
          Devoluciones
          {pendingReturns > 0 && <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${view === "returns" ? "bg-white/20 text-white" : "bg-red-100 text-red-600"}`}>{pendingReturns}</span>}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : !shopId ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">🏪</div>
          <p className="font-bold text-gray-600">No tienes ningún comercio asociado</p>
          <p className="text-sm text-gray-400 mt-1">Contacta con el equipo para dar de alta tu tienda</p>
        </div>
      ) : view === "orders" ? (
        <>
          {/* Filtros */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
            {FILTER_OPTIONS.map((f) => {
              const count = f.key ? orders.filter((o) => o.status === f.key).length : orders.length;
              const active = filter === f.key;
              return (
                <button key={String(f.key)} onClick={() => setFilter(f.key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${active ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-white text-gray-500 border border-gray-200 hover:border-indigo-200"}`}>
                  {f.label}
                  {count > 0 && <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>{count}</span>}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-bold text-gray-600">No hay pedidos en este estado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((order) => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                const itemSummary = order.items.length > 0 ? order.items.map((i) => `${i.name} ×${i.qty}`).join(" · ") : "Sin detalle";
                const buyerName = order.buyer?.display_name || order.buyer?.email?.split("@")[0] || "Cliente";
                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-gray-600 font-mono text-sm">#{order.id.slice(0, 8).toUpperCase()}</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.cls}`}><span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}</span>
                        {order.delivery_type === "local_delivery" && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-600">🛵 Envío</span>}
                      </div>
                      <span className="text-xs text-gray-400 font-medium">{timeAgo(order.created_at)}</span>
                    </div>
                    <div className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800">{buyerName}</p>
                          {order.buyer?.email && <p className="text-xs text-gray-400 mt-0.5">{order.buyer.email}</p>}
                          <p className="text-xs text-gray-400 mt-2 line-clamp-2">{itemSummary}</p>
                          {order.delivery_type === "local_delivery" && order.delivery_address && <p className="text-xs text-purple-600 mt-1 font-medium">📍 {order.delivery_address}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black text-gray-900">{Number(order.total).toFixed(2)} €</p>
                          {cfg.next && <button onClick={() => advance(order.id, cfg.next!)} className="mt-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">{cfg.nextLabel}</button>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Vista de Devoluciones */
        returns.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-4xl mb-3">↩️</div>
            <p className="font-bold text-gray-600">No hay solicitudes de devolución</p>
            <p className="text-sm text-gray-400 mt-1">Cuando un cliente solicite una devolución aparecerá aquí</p>
          </div>
        ) : (
          <div className="space-y-3">
            {returns.map((r) => {
              const cfg = RET_LABELS[r.status] ?? RET_LABELS.pending;
              const buyerName = r.buyer?.display_name || r.buyer?.email?.split("@")[0] || "Cliente";
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-gray-600 font-mono text-sm">#{r.order_id.slice(0, 8).toUpperCase()}</span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${cfg.cls}`}>{cfg.label}</span>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{timeAgo(r.requested_at ?? r.created_at)}</span>
                  </div>
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800">{buyerName}</p>
                        {r.buyer?.email && <p className="text-xs text-gray-400 mt-0.5">{r.buyer.email}</p>}
                        <p className="text-sm text-gray-600 mt-2"><span className="font-semibold">Motivo:</span> {r.reason}</p>
                        {r.resolution_note && <p className="text-xs text-gray-400 mt-1 italic">Nota: {r.resolution_note}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-black text-gray-900">{Number(r.refund_amount ?? 0).toFixed(2)} €</p>
                        {r.status === "pending" && (
                          <div className="mt-2 flex flex-col gap-1.5">
                            <button onClick={() => resolveReturn(r.id, "accept")} disabled={acting === r.id} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                              {acting === r.id ? "..." : "Aceptar y reembolsar"}
                            </button>
                            <button onClick={() => resolveReturn(r.id, "reject")} disabled={acting === r.id} className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                              Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
