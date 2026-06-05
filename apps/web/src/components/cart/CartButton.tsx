"use client";

import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart.store";

export function CartButton() {
  const { openCart, itemCount } = useCartStore();
  const count = itemCount();

  return (
    <button
      onClick={openCart}
      aria-label="Abrir carrito"
      className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 transition-colors"
    >
      <ShoppingCart className="w-5 h-5 text-slate-600" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] min-h-[18px] bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
