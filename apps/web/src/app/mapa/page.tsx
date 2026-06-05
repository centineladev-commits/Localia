import dynamic from "next/dynamic";
import { MapInitializer } from "@/components/map/MapInitializer";

const DynamicMapView = dynamic(
  () => import("@/components/map/MapView").then((mod) => ({ default: mod.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Cargando mapa...</p>
        </div>
      </div>
    ),
  }
);

export default function MapPage() {
  return (
    <div className="flex-1 relative overflow-hidden">
      <MapInitializer />
      <DynamicMapView />
    </div>
  );
}
