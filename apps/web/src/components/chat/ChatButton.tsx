"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { ChatDrawer } from "./ChatDrawer";
import type { Shop, Product } from "@/lib/types";

interface Props {
  shop: Shop;
  product?: Product;
}

export function ChatButton({ shop, product }: Props) {
  const { user, openAuthModal } = useAuthStore();
  const [open, setOpen] = useState(false);

  function handleClick() {
    if (!user) { openAuthModal("login"); return; }
    setOpen(true);
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
      >
        <MessageCircle className="w-4 h-4" />
        Preguntar al vendedor
      </button>
      {open && user && (
        <ChatDrawer shop={shop} product={product} onClose={() => setOpen(false)} userId={user.id} />
      )}
    </>
  );
}
