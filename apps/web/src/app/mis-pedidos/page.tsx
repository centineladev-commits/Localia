"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { getPublicClient } from "@/lib/db";

interface Order {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  delivery_type: string;
  delivery_address: string | null;
  stripe_payment_id: string | null;
  paid_at: string | null;
  created_at: string;
  tracking_number: string | null;
  carrier: string | null;
  items: { id: string; name: string; qty: number; price: number }[];
  shop: { name: string; slug: string; logo_url: string | null } | null;
}

interface ReturnRow { id: string; order_id: string; status: string; }

const STATUS: Record<string, { label: string; cls: string; icon: string }> = {
  pending:    { label: "Pendiente de pago", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",    icon: "⏳" },
  paid:       { label: "Pagado",            cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",       icon: "💳" },
  processing: { label: "Preparando",        cls: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200", icon: "🔧" },
  ready:      { label: "Listo para recoger",cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", icon: "✅" },
  shipped:    { label: "Enviado",           cls: "bg-violet-50 text-violet-700 ring-1 ring-violet-200", icon: "🚚" },
  delivered:  { label: "Entregado",         cls: "bg-gray-50 text-gray-500 ring-1 ring-gray-200",       icon: "📦" },
  completed:  { label: "Completado",        cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", icon: "✅" },
  cancelled:  { label: "Cancelado",         cls: "bg-red-50 text-red-600 ring-1 ring-red-200",          icon: "❌" },
};

const RETURN_STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Devolución solicitada", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  accepted:  { label: "Devolución aceptada",   cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  rejected:  { label: "Devolución rechazada",  cls: "bg-red-50 text-red-600 ring-1 ring-red-200" },
  completed: { label: "Reembolso completado",  cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
};

const RETURNABLE = new Set(["paid", "processing", "ready", "delivered"]);
const RETURN_WINDOW_DAYS = 14;

async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await getPublicClient().auth.getSession();
    return session?.access_token ?? null;
  } catch { return null; }
}

export default function MisPedidosPage() {
  const { user, openAuthModal } = useAuthStore();
  const [orders, setOrders]     = useState<Order[]>([]);
  const [returns, setReturns]   = useState<Record<string, ReturnRow>>({});
  const [loading, setLoading]   = useState(true);

  // modal de solicitud de devolución
  const [returnFor, setReturnFor] = useState<Order | null>(null);
  const [reason, setReason]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  async function load() {
    if (!user) { setLoading(false); return; }
    const supabase = getPublicClient();
    const [{ data: ord }, { data: rets }] = await Promise.all([
      supabase
        .from("orders")
        .select("id, status, total, subtotal, delivery_type, delivery_address, stripe_payment_id, paid_at, created_at, tracking_number, carrier, items, shops(name, slug, logo_url)")
        .eq("buyer_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("returns").select("id, order_id, status").eq("buyer_user_id", user.id),
    ]);
    setOrders(
      (ord ?? []).map((o: any) => ({ ...o, items: Array.isArray(o.items) ? o.items : [], shop: o.shops ?? null }))
    );
    const map: Record<string, ReturnRow> = {};
    for (const r of (rets ?? []) as any[]) map[r.order_id] = r;
    setReturns(map);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  function isEligible(o: Order): boolean {
    if (returns[o.id]) return false;
    if (!RETURNABLE.has(o.status)) return false;
    const base = new Date(o.paid_at ?? o.created_at).getTime();
    return (Date.now() - base) / 86_400_000 <= RETURN_WINDOW_DAYS;
  }

  async function submitReturn() {
    if (!returnFor) return;
    setSubmitting(true);
    setModalError(null);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: returnFor.id, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo solicitar la devolución");
      setReturnFor(null);
      setReason("");
      await load();
    } catch (e: any) {
      setModalError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 py-24">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-4xl">🛍️</div>
        <div className="text-center">
          <p className="text-lg font-black text-slate-800">Accede para ver tus pedidos</p>
          <p className="text-sm text-slate-400 mt-1">Historial completo de compras y estado de entrega</p>
        </div>
        <button onClick={() => openAuthModal("login")} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
          Iniciar sesión
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 pb-10">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Mis pedidos</h1>
            <p className="text-slate-400 text-sm mt-0.5">{orders.length} pedido{orders.length !== 1 ? "s" : ""} en total</p>
          </div>
          <Link href="/" className="text-sm text-indigo-600 font-bold hover:underline">+ Seguir comprando</Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-lg font-black text-slate-700">Aún no tienes pedidos</p>
            <p className="text-sm text-slate-400 mt-1">Cuando compres algo aparecerá aquí</p>
            <Link href="/" className="mt-6 inline-flex px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors">
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const cfg = STATUS[order.status] ?? STATUS.pending;
              const ret = returns[order.id];
              const retCfg = ret ? RETURN_STATUS[ret.status] : null;
              const date = new Date(order.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
              const itemSummary = order.items.length > 0 ? order.items.map((i) => `${i.name} ×${i.qty}`).join(", ") : "Pedido";

              return (
                <div key={order.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-black text-slate-600 text-sm font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.cls}`}>{cfg.icon} {cfg.label}</span>
                      {retCfg && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${retCfg.cls}`}>↩️ {retCfg.label}</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{date}</span>
                  </div>
                  <div className="px-5 py-4">
                    {order.shop && (
                      <Link href={`/tienda/${order.shop.slug}`} className="flex items-center gap-2 mb-3 group w-fit">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm">{order.shop.name.charAt(0)}</div>
                        <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{order.shop.name}</span>
                      </Link>
                    )}
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">{itemSummary}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{order.delivery_type === "pickup" ? "📍 Recogida en tienda" : "🛵 Entrega local"}</span>
                      </div>
                      <span className="text-lg font-black text-slate-900">{Number(order.total).toFixed(2)} €</span>
                    </div>
                    {order.tracking_number && (
                      <p className="mt-2 text-xs text-violet-600 font-semibold">🚚 {order.carrier} · Seguimiento: {order.tracking_number}</p>
                    )}
                    {isEligible(order) && (
                      <div className="mt-3 pt-3 border-t border-slate-50 flex justify-end">
                        <button
                          onClick={() => { setReturnFor(order); setReason(""); setModalError(null); }}
                          className="text-xs font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-lg px-3 py-1.5 transition-colors"
                        >
                          ↩️ Solicitar devolución
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de solicitud de devolución */}
      {returnFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={() => !submitting && setReturnFor(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-black text-slate-900">Solicitar devolución</h2>
            <p className="text-sm text-slate-400 mt-1">
              Pedido <span className="font-mono font-bold">#{returnFor.id.slice(0, 8).toUpperCase()}</span> · {Number(returnFor.total).toFixed(2)} €
            </p>
            <label className="block text-xs font-bold text-slate-500 mt-4 mb-1.5 uppercase tracking-wide">Motivo de la devolución</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Cuéntanos qué ha pasado (producto defectuoso, no corresponde a la descripción, no recibido...)"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none"
            />
            {modalError && <p className="text-xs text-red-500 mt-2 font-medium">{modalError}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setReturnFor(null)} disabled={submitting} className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={submitReturn} disabled={submitting || reason.trim().length < 5} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? "Enviando..." : "Enviar solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
