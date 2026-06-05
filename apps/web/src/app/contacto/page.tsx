import { PageWrapper } from "@/components/layout/PageWrapper";

export const metadata = {
  title: "Contacto — Localia",
};

export default function ContactoPage() {
  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Contacto</h1>
        <p className="text-slate-500 mb-10">
          Escríbenos y te responderemos en menos de 48 horas laborables.
        </p>

        <div className="grid md:grid-cols-3 gap-10">
          {/* Form */}
          <form className="md:col-span-2 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Tu nombre"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="tu@email.com"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Asunto
              </label>
              <select
                name="subject"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Selecciona un asunto</option>
                <option value="soporte">Soporte técnico</option>
                <option value="vendedor">Quiero vender en Localia</option>
                <option value="facturacion">Facturación</option>
                <option value="prensa">Prensa y colaboraciones</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mensaje
              </label>
              <textarea
                name="message"
                required
                rows={5}
                placeholder="Cuéntanos en qué podemos ayudarte..."
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-2.5 rounded-lg text-sm font-medium"
            >
              Enviar mensaje
            </button>
          </form>

          {/* Contact info */}
          <aside className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Email
              </h2>
              <a
                href="mailto:hello@localia.es"
                className="text-sm text-indigo-600 hover:underline"
              >
                hello@localia.es
              </a>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Tiempo de respuesta
              </h2>
              <p className="text-sm text-slate-600">
                Respondemos en menos de 48 horas laborables.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PageWrapper>
  );
}
