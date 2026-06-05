"use client";

import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  loading: boolean;
  authModalOpen: boolean;
  authTab: "login" | "register";
  pendingRedirect: string | null;

  setUser: (user: User | null) => void;
  setLoading: (v: boolean) => void;
  openAuthModal: (tab?: "login" | "register", redirect?: string) => void;
  closeAuthModal: () => void;
  clearPendingRedirect: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  authModalOpen: false,
  authTab: "login",
  pendingRedirect: null,

  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  openAuthModal: (tab = "login", redirect) =>
    set({ authModalOpen: true, authTab: tab, pendingRedirect: redirect ?? null }),
  closeAuthModal: () => set({ authModalOpen: false }),
  clearPendingRedirect: () => set({ pendingRedirect: null }),
}));
