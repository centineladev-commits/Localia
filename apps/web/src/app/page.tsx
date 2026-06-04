import { MapView } from "@/components/map/MapView";

export default function HomePage() {
  return (
    <main className="h-screen w-full flex flex-col">
      {/* Barra superior */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b shadow-sm z-10">
        <span className="text-xl font-bold text-emerald-600">LocalMarket</span>
        <input
          type="search"
          placeholder="¿Qué estás buscando?"
          className="flex-1 px-4 py-2 rounded-full border text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <button className="text-sm font-medium text-gray-600 hover:text-gray-900">
          Iniciar sesión
        </button>
      </header>

      {/* Mapa a pantalla completa */}
      <div className="flex-1 relative">
        <MapView />
      </div>
    </main>
  );
}
