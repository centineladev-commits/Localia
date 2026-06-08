"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { getPublicClient } from "@/lib/db";

interface Reservation {
  id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  amount_paid: number;
  status: string;
  notes: string | null;
  expires_at: string | null;
  created_at: string;
  product: { name: string; images: string[] } | null;
  shop: { name: string; slug: string } | null;
}

const STATUS: Record<string, { label: string; cls: string; icon: string }> = {
  pending:   { label: "Pendiente",  cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",    icon: "⏳" },
  confirmed: { label: "Confirmada", cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",       icon: "✅" },
  rejected:  { label: "Rechazada",  cls: "bg-red-50 text-red-600 ring-1 ring-red-200",          icon: "❌" },
  completed: { label: "Completada", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", icon: "🎉" },
  cancelled: { label: "Cancelada",  cls: "bg-gray-50 text-gray-500 ring-1 ring-gray-200",       icon: "🚫" },
};

export default function ReservasPage() {
  const { user, openAuthModal } = useAuthStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
  }, [user]);

  async function load() {
    const supabase = getPublicClient();
    const { data } = await supabase
      .from("reservations")
      .select("id, quantity, unit_price, total_amount, amount_paid, status, notes, expires_at, created_at, products(name, images), shops(name, slug)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    setReservations(
      (data ?? []).map((r: any) => ({
        ...r,
        product: r.products ?? null,
        shop: r.shops ?? null,
      }))
    );
    setLoading(false);
  }

  async function cancel(id: string) {
    if (!confirm("¿Seguro que quieres cancelar esta reserva?")) return;
    const supabase = getPublicClient();
    await supabase.from("reservations").update({ status: "cancelled" }).eq("id", id);
    setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: "cancelled" } : r));
  }

  if (!user) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 py-24">
      <div className="text-5xl">🔖</div>
      <p className="text-lg font-black text-slate-800">Tus reservas</p>
      <button onClick={() => openAuthModal("login")} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-full">
        Iniciar sesión
      </button>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 pb-10">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Mis reservas</h1>
        <p className="text-slate-400 text-sm mb-6">Productos reservados con pago escalonado de 5 € hasta completar el total</p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">🔖</div>
            <p className="text-lg font-black text-slate-700">No tienes reservas activas</p>
            <p className="text-sm text-slate-400 mt-1">Puedes reservar productos desde su página de detalle</p>
            <Link href="/" className="mt-6 inline-flex px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700">
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map((r) => {
              const cfg = STATUS[r.status] ?? STATUS.pending;
              const progress = r.total_amount > 0 ? (r.amount_paid / r.total_amount) * 100 : 0;
              const remaining = r.total_amount - r.amount_paid;

              return (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-50 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-600 text-sm">#{r.id.slice(0, 8).toUpperCase()}</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.cls}`}>{cfg.icon} {cfg.label}</span>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString("es-ES")}</span>
                  </div>
                  <div className="px-5 py-4">
                    <div className="flex items-start gap-4">
                      {r.product?.images?.[0] && (
                        <img src={r.product.images[0]} alt="" loading="lazy" decoding="async" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800">{r.product?.name ?? "Producto"}</p>
                        {r.shop && (
                          <Link href={`/tienda/${r.shop.slug}`} className="text-xs text-indigo-600 hover:underline">{r.shop.name}</Link>
                        )}
                        <p className="text-xs text-slate-400 mt-1">×{r.quantity} · {r.unit_price.toFixed(2)} € c/u</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-slate-900">{r.total_amount.toFixed(2)} €</p>
                        <p className="text-xs text-slate-400">total</p>
                      </div>
                    </div>

                    {/* Barra de progreso de pago */}
                    {r.status === "confirmed" && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                          <span>Pagado: <strong className="text-emerald-600">{r.amount_paid.toFixed(2)} €</strong></span>
                          <span>Pendiente: <strong className="text-indigo-600">{remaining.toFixed(2)} €</strong></span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all"
                            style={{ width: `${Math.min(100, progress)}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5 text-center">{Math.round(progress)}% completado</p>
                        {remaining > 0 && (
                          <button className="mt-3 w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                            Pagar siguiente tramo — 5,00 €
                          </button>
                        )}
                      </div>
                    )}

                    {r.status === "pending" && (
                      <p className="mt-3 text-xs text-amber-600 font-medium bg-amber-50 rounded-lg px-3 py-2">
                        Esperando confirmación de la tienda. Te avisaremos cuando la acepten.
                      </p>
                    )}

                    {(r.status === "pending" || r.status === "confirmed") && (
                      <button onClick={() => cancel(r.id)} className="mt-3 text-xs text-red-400 hover:text-red-600 transition-colors font-semibold">
                        Cancelar reserva
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
