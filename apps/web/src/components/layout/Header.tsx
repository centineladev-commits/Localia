"use client";

import Link from "next/link";
import { useCityStore } from "@/store/city.store";
import { CartButton } from "@/components/cart/CartButton";

export function Header() {
  const { activeCity, openModal } = useCityStore();

  return (
    <header className="flex items-center gap-3 px-4 py-3 bg-white border-b shadow-sm z-20 shrink-0">
      <Link href="/" className="text-xl font-bold text-emerald-600 shrink-0">
        LocalMarket
      </Link>

      <input
        type="search"
        placeholder="¿Qué estás buscando?"
        className="flex-1 px-4 py-2 rounded-full border text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-0"
      />

      <button
        onClick={openModal}
        className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium hover:bg-gray-50 transition-colors shrink-0"
      >
        <span>📍</span>
        <span>{activeCity ? activeCity.name : "Elige ciudad"}</span>
      </button>

      <CartButton />

      <button className="text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap shrink-0">
        Entrar
      </button>
    </header>
  );
}
