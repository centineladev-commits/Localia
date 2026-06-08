// maplibre-gl CSS is imported HERE so it only loads on the /mapa page,
// not on every page of the app (it's ~900 rules + SVG data-URIs).
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
