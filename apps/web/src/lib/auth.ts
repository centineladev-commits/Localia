import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-side auth check para Server Components y Route Handlers.
 * Usa las cookies de sesión de Supabase para verificar la autenticación.
 * Retorna el usuario autenticado o redirige a "/".
 *
 * Usage:
 *   const user = await requireAuth();
 */
export async function requireAuth() {
  const cookieStore = cookies();

  // Extraer el token JWT de la cookie de sesión de Supabase
  // Supabase guarda la sesión como JSON en la cookie sb-<ref>-auth-token
  let accessToken: string | undefined;
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")) {
      try {
        const session = JSON.parse(cookie.value);
        accessToken = session?.access_token ?? session?.[0]?.access_token;
      } catch {
        // cookie value might be URL-encoded or split; try raw as token
        accessToken = cookie.value;
      }
      break;
    }
  }

  if (!accessToken) redirect("/");

  // Verificar el token con el cliente anon (no service-role)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) redirect("/");
  return user;
}
