import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CityModal } from "@/components/city/CityModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LocalMarket — Compra local, apoya tu ciudad",
  description: "Descubre comercios y productos nuevos de tu ciudad en el mapa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} flex flex-col h-screen overflow-hidden`}>
        <Header />
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
        <CartDrawer />
        <CityModal />
      </body>
    </html>
  );
}
