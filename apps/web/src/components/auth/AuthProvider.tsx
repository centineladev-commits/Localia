"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPublicClient } from "@/lib/db";
import { useAuthStore } from "@/store/auth.store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, clearPendingRedirect, pendingRedirect } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const supabase = getPublicClient();

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user && pendingRedirect) {
        router.push(pendingRedirect);
        clearPendingRedirect();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
