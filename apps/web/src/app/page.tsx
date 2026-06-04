import { MapView } from "@/components/map/MapView";
import { MapInitializer } from "@/components/map/MapInitializer";

export default function HomePage() {
  return (
    <div className="w-full h-full relative">
      <MapInitializer />
      <MapView />
    </div>
  );
}
