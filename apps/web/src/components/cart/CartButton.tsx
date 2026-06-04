"use client";

import { useCartStore } from "@/store/cart.store";

export function CartButton() {
  const { openCart, itemCount } = useCartStore();
  const count = itemCount();

  return (
    <button
      onClick={openCart}
      className="relative flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
    >
      <span className="text-lg">🛒</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
