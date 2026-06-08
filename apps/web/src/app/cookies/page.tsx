import { PageWrapper } from "@/components/layout/PageWrapper";

export const metadata = {
  title: "Política de cookies — Localia",
};

const sections = [
  {
    title: "1. ¿Qué son las cookies?",
    content:
      "Las cookies son pequeños archivos de texto que los sitios web almacenan en tu navegador cuando los visitas. Permiten que el sitio recuerde tus preferencias, mantenga tu sesión activa y recopile información anónima sobre el uso de la plataforma. Según la normativa europea (Directiva ePrivacy y RGPD), debemos informarte sobre las cookies que utilizamos y obtener tu consentimiento para aquellas que no sean estrictamente necesarias.",
  },
  {
    title: "2. Cookies técnicas necesarias",
    content:
      "Estas cookies son imprescindibles para el funcionamiento básico de Localia. Sin ellas no podrías navegar por la plataforma ni completar compras. No requieren tu consentimiento porque su único fin es prestar el servicio que solicitas.",
  },
  {
    title: "3. Cookies analíticas",
    content:
      "Utilizamos Vercel Analytics para comprender cómo se usa Localia de forma agregada y anónima: páginas más visitadas, tiempo de carga, origen del tráfico, etc. Estos datos nunca incluyen información personal identificable y nos ayudan a mejorar la experiencia de la plataforma. Puedes rechazar estas cookies sin que ello afecte al funcionamiento del servicio.",
  },
  {
    title: "4. Cómo gestionar las cookies",
    content:
      "Puedes configurar o desactivar las cookies desde los ajustes de tu navegador en cualquier momento. Ten en cuenta que desactivar las cookies técnicas puede impedir el correcto funcionamiento de Localia.",
  },
  {
    title: "5. Duración de las cookies",
    content:
      "Las cookies de sesión se eliminan automáticamente al cerrar el navegador. Las cookies persistentes permanecen en tu dispositivo durante el plazo indicado en cada caso, que en ningún caso supera los 13 meses. Transcurrido ese plazo, o si retiras tu consentimiento, las cookies son eliminadas.",
  },
  {
    title: "6. Contacto",
    content:
      "Si tienes preguntas sobre nuestra política de cookies o quieres ejercer tus derechos, escríbenos a privacidad@localia.es. Responderemos en un plazo máximo de 30 días hábiles.",
  },
];

const technicalCookies = [
  {
    name: "sb-access-token",
    purpose: "Autenticación de sesión de usuario (Supabase)",
    duration: "Sesión",
    type: "Necesaria",
  },
  {
    name: "sb-refresh-token",
    purpose: "Renovación automática de sesión",
    duration: "7 días",
    type: "Necesaria",
  },
  {
    name: "__session",
    purpose: "Mantener el estado del carrito de compra",
    duration: "Sesión",
    type: "Necesaria",
  },
];

const analyticsCookies = [
  {
    name: "_va",
    purpose: "Identificador anónimo de visita para Vercel Analytics",
    duration: "1 año",
    type: "Analítica",
  },
  {
    name: "_vei",
    purpose: "Métricas de rendimiento de página (Vercel Speed Insights)",
    duration: "30 días",
    type: "Analítica",
  },
];

const browsers = [
  {
    name: "Chrome",
    url: "https://support.google.com/chrome/answer/95647",
    label: "Configurar cookies en Chrome",
  },
  {
    name: "Firefox",
    url: "https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias",
    label: "Configurar cookies en Firefox",
  },
  {
    name: "Safari",
    url: "https://support.apple.com/es-es/guide/safari/sfri11471/mac",
    label: "Configurar cookies en Safari",
  },
  {
    name: "Edge",
    url: "https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09",
    label: "Configurar cookies en Edge",
  },
];

export default function CookiesPage() {
  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Política de cookies
        </h1>
        <p className="text-sm text-slate-400 mb-12">
          Última actualización: enero 2025
        </p>

        {/* Intro section */}
        <div className="space-y-10">
          {/* Section 1 */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">
              {sections[0].title}
            </h2>
            <p className="text-slate-600 leading-relaxed">{sections[0].content}</p>
          </div>

          {/* Section 2: Technical cookies with table */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">
              {sections[1].title}
            </h2>
            <p className="text-slate-600 leading-relaxed mb-5">
              {sections[1].content}
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">
                      Cookie
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">
                      Finalidad
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">
                      Duración
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {technicalCookies.map((c) => (
                    <tr key={c.name} className="bg-white">
                      <td className="px-4 py-3 font-mono text-xs text-indigo-700 whitespace-nowrap">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.purpose}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {c.duration}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Analytics cookies with table */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">
              {sections[2].title}
            </h2>
            <p className="text-slate-600 leading-relaxed mb-5">
              {sections[2].content}
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">
                      Cookie
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">
                      Finalidad
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">
                      Duración
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analyticsCookies.map((c) => (
                    <tr key={c.name} className="bg-white">
                      <td className="px-4 py-3 font-mono text-xs text-indigo-700 whitespace-nowrap">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.purpose}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {c.duration}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Browser management */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">
              {sections[3].title}
            </h2>
            <p className="text-slate-600 leading-relaxed mb-5">
              {sections[3].content}
            </p>
            <ul className="space-y-2">
              {browsers.map((b) => (
                <li key={b.name}>
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 hover:underline text-sm"
                  >
                    {b.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 5: Duration */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">
              {sections[4].title}
            </h2>
            <p className="text-slate-600 leading-relaxed">{sections[4].content}</p>
          </div>

          {/* Section 6: Contact */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">
              {sections[5].title}
            </h2>
            <p className="text-slate-600 leading-relaxed">{sections[5].content}</p>
          </div>
        </div>

        {/* Cookie consent buttons */}
        <div className="mt-14 bg-slate-50 border border-slate-200 rounded-2xl p-8">
          <h2 className="text-base font-semibold text-slate-800 mb-2">
            Preferencias de cookies
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Puedes elegir qué tipos de cookies permites en Localia. Las cookies
            técnicas siempre están activas porque son necesarias para el
            funcionamiento del servicio.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-sm"
            >
              Aceptar todas
            </button>
            <button
              type="button"
              className="flex-1 sm:flex-none border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 text-sm font-semibold px-6 py-3 rounded-lg transition-all duration-200"
            >
              Solo necesarias
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
