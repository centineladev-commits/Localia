import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DemoProduct, DemoShop } from "@/lib/demo-data";

export interface CartItem {
  product: DemoProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  shop: DemoShop | null;       // El carrito es por comercio (una tienda a la vez)
  isOpen: boolean;

  addItem: (product: DemoProduct, shop: DemoShop) => "ok" | "different_shop";
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      shop: null,
      isOpen: false,

      addItem: (product, shop) => {
        const state = get();
        // Si hay productos de otra tienda, bloquear
        if (state.shop && state.shop.id !== shop.id) {
          return "different_shop";
        }

        const existing = state.items.find((i) => i.product.id === product.id);
        if (existing) {
          set({
            items: state.items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({ items: [...state.items, { product, quantity: 1 }], shop });
        }
        return "ok";
      },

      removeItem: (productId) =>
        set((state) => {
          const items = state.items.filter((i) => i.product.id !== productId);
          return { items, shop: items.length === 0 ? null : state.shop };
        }),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.product.id !== productId)
              : state.items.map((i) =>
                  i.product.id === productId ? { ...i, quantity } : i
                ),
        })),

      clearCart: () => set({ items: [], shop: null }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "localmarket-cart" }
  )
);
