import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-4">
        Error 404
      </p>
      <h1 className="text-4xl font-bold text-slate-900 mb-4">
        Página no encontrada
      </h1>
      <p className="text-slate-500 max-w-sm mb-8">
        La página que buscas no existe o ha sido movida. Vuelve al inicio para
        seguir explorando.
      </p>
      <Link href="/" className="btn-primary px-6 py-2.5 rounded-lg text-sm font-medium">
        Volver al inicio
      </Link>
    </div>
  );
}
