"use client";

import { useEffect, useState } from "react";
import { getPublicClient } from "@/lib/db";
import { useAuthStore } from "@/store/auth.store";

interface ConnectStatus {
  configured: boolean;
  connected?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
}

async function token(): Promise<string | null> {
  try { const { data: { session } } = await getPublicClient().auth.getSession(); return session?.access_token ?? null; }
  catch { return null; }
}

export default function PagosPage() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [sales, setSales] = useState<{ total: number; count: number; commission: number }>({ total: 0, count: 0, commission: 0 });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  async function load() {
    const t = await token();
    const res = await fetch("/api/stripe/connect/status", { headers: { Authorization: `Bearer ${t}` } });
    setStatus(await res.json());
    // Resumen de ventas (pedidos pagados de la tienda del vendedor)
    try {
      const supabase = getPublicClient();
      const { data: shops } = await supabase.from("shops").select("id").eq("owner_user_id", user!.id).limit(1);
      const sid = shops?.[0]?.id;
      if (sid) {
        const { data: orders } = await supabase
          .from("orders").select("total, platform_fee, status").eq("shop_id", sid)
          .in("status", ["paid", "processing", "ready", "shipped", "delivered", "completed"]);
        const list = (orders ?? []) as any[];
        setSales({
          count: list.length,
          total: list.reduce((s, o) => s + Number(o.total ?? 0), 0),
          commission: list.reduce((s, o) => s + Number(o.platform_fee ?? 0), 0),
        });
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { if (user) load(); else setLoading(false); /* eslint-disable-next-line */ }, [user]);

  async function connect() {
    setConnecting(true);
    const t = await token();
    const res = await fetch("/api/stripe/connect/onboard", { method: "POST", headers: { Authorization: `Bearer ${t}` } });
    const d = await res.json();
    if (d.url) window.location.href = d.url;
    else { alert(d.error ?? "No se pudo iniciar el onboarding"); setConnecting(false); }
  }

  const net = sales.total - sales.commission;

  return (
    <div className="p-6 max-w-3xl animate-fade-in">
      <h1 className="text-2xl font-black text-gray-900">Pagos</h1>
      <p className="text-sm text-gray-400 mt-1 mb-6">Configura cómo recibes el dinero de tus ventas.</p>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-5">
          {/* Resumen de ventas */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Ventas", value: `${sales.count}` },
              { label: "Ingresos brutos", value: `${sales.total.toFixed(2)} €` },
              { label: "Neto (tras comisión)", value: `${net.toFixed(2)} €` },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xl font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Estado de Stripe Connect */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-black text-gray-800">Cuenta de cobros (Stripe)</h2>
            </div>

            {!status?.configured ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                Los pagos a vendedores aún no están activados en la plataforma. El equipo debe configurar Stripe Connect.
              </div>
            ) : !status.connected ? (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Conecta tu cuenta de Stripe para recibir automáticamente el importe de tus ventas (menos la comisión de la plataforma) en tu cuenta bancaria. La verificación de identidad y los datos bancarios se gestionan de forma segura en Stripe — Localia nunca los ve.
                </p>
                <button onClick={connect} disabled={connecting} className="px-5 py-3 bg-[#635bff] text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
                  {connecting ? "Redirigiendo a Stripe…" : "Conectar con Stripe"}
                </button>
              </>
            ) : status.chargesEnabled ? (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">Cobros activos ✓</p>
                  <p className="text-xs text-emerald-600">Recibirás tus ventas automáticamente. {status.payoutsEnabled ? "Pagos a tu banco habilitados." : "Pagos al banco pendientes de verificación."}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 mb-4">
                  Tu cuenta de Stripe está creada pero falta completar la verificación (KYC / datos bancarios).
                </div>
                <button onClick={connect} disabled={connecting} className="px-5 py-3 bg-[#635bff] text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
                  {connecting ? "Redirigiendo…" : "Continuar verificación"}
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-gray-400">
            Modelo de pago: el comprador paga el total → Localia retiene su comisión → el resto se transfiere a tu cuenta de Stripe automáticamente. Los reembolsos por devolución revierten también tu transferencia.
          </p>
        </div>
      )}
    </div>
  );
}
