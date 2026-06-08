"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { getPublicClient } from "@/lib/db";

async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await getPublicClient().auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

interface Reservation {
  id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  amount_paid: number;
  status: string;
  notes: string | null;
  created_at: string;
  buyer: { display_name: string | null; email: string } | null;
  product: { name: string; images: string[] } | null;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Pendiente",  cls: "bg-amber-50 text-amber-700" },
  confirmed: { label: "Confirmada", cls: "bg-blue-50 text-blue-700"   },
  rejected:  { label: "Rechazada",  cls: "bg-red-50 text-red-600"     },
  completed: { label: "Completada", cls: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelada",  cls: "bg-gray-100 text-gray-500"  },
};

export default function DashboardReservasPage() {
  const { user } = useAuthStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId]   = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    const supabase = getPublicClient();
    const { data: shops } = await supabase.from("shops").select("id").eq("owner_user_id", user!.id).limit(1);
    const sid = shops?.[0]?.id ?? null;
    setShopId(sid);
    if (!sid) { setLoading(false); return; }

    const { data } = await supabase
      .from("reservations")
      .select("id, quantity, unit_price, total_amount, amount_paid, status, notes, created_at, users!user_id(display_name, email), products(name, images)")
      .eq("shop_id", sid)
      .order("created_at", { ascending: false })
      .limit(50);

    setReservations(
      (data ?? []).map((r: any) => ({
        ...r,
        buyer:   r.users ?? null,
        product: r.products ?? null,
      }))
    );
    setLoading(false);
  }

  async function respond(id: string, action: "confirmed" | "rejected") {
    const token = await getAccessToken();
    const res = await fetch("/api/reservations", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ reservationId: id, action }),
    });
    if (res.ok) {
      setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: action } : r));
    }
  }

  const pending = reservations.filter((r) => r.status === "pending").length;

  return (
    <div className="p-6 max-w-4xl animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Reservas</h1>
          <p className="text-gray-400 text-sm mt-1">
            {pending > 0 ? (
              <span className="text-amber-600 font-semibold">{pending} pendiente{pending !== 1 ? "s" : ""} de responder</span>
            ) : "No hay reservas pendientes"}
          </p>
        </div>
        <button onClick={load} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">🔖</div>
          <p className="font-bold text-gray-600">No hay reservas todavía</p>
          <p className="text-sm text-gray-400 mt-1">Cuando un cliente reserve un producto aparecerá aquí</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => {
            const cfg = STATUS[r.status] ?? STATUS.pending;
            const progress = r.total_amount > 0 ? (r.amount_paid / r.total_amount) * 100 : 0;
            const buyerName = r.buyer?.display_name || r.buyer?.email?.split("@")[0] || "Cliente";

            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-black text-gray-600 text-sm">#{r.id.slice(0, 8).toUpperCase()}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString("es-ES")}</span>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-start gap-4">
                    {r.product?.images?.[0] && (
                      <img src={r.product.images[0]} alt="" loading="lazy" decoding="async" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800">{r.product?.name ?? "Producto"}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Comprador: <strong>{buyerName}</strong> · ×{r.quantity} · {r.unit_price.toFixed(2)} €/ud
                      </p>
                      {r.notes && (
                        <p className="text-xs text-indigo-600 mt-1 bg-indigo-50 px-2 py-1 rounded-lg">💬 {r.notes}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-gray-900">{r.total_amount.toFixed(2)} €</p>
                      <p className="text-xs text-emerald-600">{r.amount_paid.toFixed(2)} € pagado</p>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  {r.amount_paid > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, progress)}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Acciones para pendientes */}
                  {r.status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => respond(r.id, "confirmed")}
                        className="flex-1 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                      >
                        ✓ Aceptar reserva
                      </button>
                      <button
                        onClick={() => respond(r.id, "rejected")}
                        className="flex-1 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors"
                      >
                        ✕ Rechazar
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
  );
}
