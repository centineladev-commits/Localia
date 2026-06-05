import Link from "next/link";

const links = {
  Explorar: [
    { label: "Catálogo", href: "/" },
    { label: "Mapa", href: "/mapa" },
    { label: "Cómo funciona", href: "/como-funciona" },
  ],
  Empresa: [
    { label: "Quiénes somos", href: "/nosotros" },
    { label: "Contacto", href: "/contacto" },
  ],
  Legal: [
    { label: "Términos", href: "/terminos" },
    { label: "Privacidad", href: "/privacidad" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-slate-100 border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-sm select-none">
                L
              </div>
              <span className="font-semibold text-slate-800 text-lg">Localia</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              El mercado de tu barrio
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                {group}
              </h3>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-400 text-center">
            &copy; 2025 Localia. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
