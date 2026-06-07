import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/db";

/**
 * Server-side auth check para Server Components y Route Handlers.
 * Retorna el usuario autenticado o redirige a "/".
 *
 * Usage:
 *   const user = await requireAuth();
 */
export async function requireAuth() {
  const supabase = getAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return user;
}
