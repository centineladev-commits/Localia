import { createRequire } from "module";
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@localmarket/db", "@localmarket/shared"],
  webpack: (config) => {
    // Force UMD bundle for maplibre-gl (pure ESM package causes chunk issues in Next.js)
    // Use $ for exact match only — does NOT affect 'maplibre-gl/dist/maplibre-gl.css'
    config.resolve.alias = {
      ...config.resolve.alias,
      "maplibre-gl$": require.resolve("maplibre-gl/dist/maplibre-gl.js"),
    };
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },
};

export default nextConfig;
