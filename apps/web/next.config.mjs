/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@localmarket/db", "@localmarket/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },
};

export default nextConfig;
