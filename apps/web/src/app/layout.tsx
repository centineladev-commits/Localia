import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { LocationModal } from "@/components/location/LocationModal";
import { CityModal } from "@/components/city/CityModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { AuthProvider } from "@/components/auth/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Localia — El mercado de tu barrio",
  description: "Descubre y compra productos nuevos de comercios locales cerca de ti.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} flex flex-col h-screen bg-white`}>
        <AuthProvider>
          <Header />
          <main className="flex-1 min-h-0 flex flex-col">
            {children}
          </main>
          <CartDrawer />
          <LocationModal />
          <CityModal />
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
