import { Footer } from "./Footer";

/**
 * El layout raíz usa un modelo de altura fija de viewport (body h-screen -> main
 * flex-1 min-h-0): el documento NO scrollea, cada pagina aporta su scroll.
 * PageWrapper es ese único contenedor scrollable y mete el Footer DENTRO del
 * scroll, de modo que el footer siempre queda al final del contenido y nunca
 * se solapa ni recorta, por largo que sea el contenido.
 */
export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
