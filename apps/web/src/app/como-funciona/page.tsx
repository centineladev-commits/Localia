import Link from "next/link";
import { PageWrapper } from "@/components/layout/PageWrapper";

export const metadata = {
  title: "Cómo funciona — Localia",
};

export default function ComoFuncionaPage() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-14 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Cómo funciona Localia
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Localia conecta a compradores con los comercios de su ciudad. Comprar
            local nunca había sido tan sencillo, y vender online nunca tan
            asequible.
          </p>
        </div>

        {/* Section 1: Compradores */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm shrink-0">
              1
            </span>
            <h2 className="text-2xl font-semibold text-slate-900">
              Para compradores
            </h2>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            {[
              {
                step: "Elige tu ciudad",
                desc: "Selecciona la ciudad o barrio donde quieres comprar. Localia te muestra solo los comercios y productos disponibles cerca de ti.",
              },
              {
                step: "Explora productos",
                desc: "Navega por categorías, busca lo que necesitas o descubre tiendas de tu zona. Cada producto muestra precio, stock y comercio vendedor.",
              },
              {
                step: "Haz tu pedido",
                desc: "Añade productos al carrito y completa tu compra de forma segura. Pagamos al vendedor solo cuando el pedido está confirmado.",
              },
              {
                step: "Recoge o recibe",
                desc: "Elige recogida en tienda o entrega local a domicilio. Sin grandes transportistas; el propio comercio gestiona la entrega.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
              >
                <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">
                  Paso {i + 1}
                </p>
                <h3 className="font-semibold text-slate-900 mb-2">{item.step}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Explorar productos
            </Link>
          </div>
        </section>

        <hr className="border-slate-200 mb-14" />

        {/* Section 2: Comercios */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm shrink-0">
              2
            </span>
            <h2 className="text-2xl font-semibold text-slate-900">
              Para comercios
            </h2>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            {[
              {
                step: "Regístrate",
                desc: "Crea tu cuenta en minutos. Solo necesitas el nombre de tu comercio, dirección y una descripción breve. Sin cuotas mensuales ni contratos.",
              },
              {
                step: "Publica productos",
                desc: "Sube fotos, pon precio y describe tus productos. El catálogo es tuyo: puedes actualizarlo cuando quieras desde el panel de control.",
              },
              {
                step: "Gestiona pedidos",
                desc: "Recibe notificaciones de cada nuevo pedido y confirma la disponibilidad desde tu panel. Marca los pedidos como listos para recoger o en camino.",
              },
              {
                step: "Cobra",
                desc: "El dinero llega a tu cuenta al confirmar cada venta, descontada solo la comisión de plataforma. Transparente, sin sorpresas.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
              >
                <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">
                  Paso {i + 1}
                </p>
                <h3 className="font-semibold text-slate-900 mb-2">{item.step}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Link
              href="/perfil"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Registrarme como comercio
            </Link>
          </div>
        </section>

        <hr className="border-slate-200 mb-14" />

        {/* Section 3: Comisión */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm shrink-0">
              3
            </span>
            <h2 className="text-2xl font-semibold text-slate-900">
              Precios honestos
            </h2>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-8 flex flex-col sm:flex-row gap-8 items-start">
            <div className="shrink-0 text-center">
              <p className="text-6xl font-black text-indigo-600">8%</p>
              <p className="text-sm font-medium text-indigo-500 mt-1">por venta completada</p>
            </div>
            <div className="space-y-4">
              <p className="text-slate-700 leading-relaxed">
                La única comisión que cobramos es un <strong>8% sobre el importe
                de cada venta completada</strong>. Nada más. Ni cuota mensual, ni
                tarifa de alta, ni coste por publicar productos.
              </p>
              <ul className="space-y-2">
                {[
                  "Alta gratuita para comercios",
                  "Sin cuota mensual ni anual",
                  "Publicación de productos ilimitada sin coste",
                  "Cobras el 92% de cada venta directamente",
                  "Sin comisión si no hay ventas",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-indigo-200 flex items-center justify-center shrink-0">
                      <svg className="w-2.5 h-2.5 text-indigo-700" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 5l2.5 2.5L8 3" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <div className="mt-16 text-center bg-slate-50 border border-slate-200 rounded-2xl px-8 py-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Listo para empezar
          </h2>
          <p className="text-slate-600 mb-6 max-w-lg mx-auto">
            Únete a los comercios locales que ya usan Localia para vender online
            o empieza a comprar en las tiendas de tu barrio hoy mismo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Explorar productos
            </Link>
            <Link
              href="/perfil"
              className="inline-flex items-center justify-center gap-2 border border-indigo-300 text-indigo-700 hover:bg-indigo-50 text-sm font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Registrarme como comercio
            </Link>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
