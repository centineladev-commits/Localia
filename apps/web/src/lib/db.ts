import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singletons — se crean una sola vez por proceso
let _adminClient: ReturnType<typeof createClient> | null = null;
let _publicClient: ReturnType<typeof createClient> | null = null;

// Cliente admin (server-side) — bypasa RLS, solo en API routes
export function getAdminClient() {
  if (!_adminClient) {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
    }
    _adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });
  }
  return _adminClient;
}

// Cliente público (client-side) — respeta RLS
export function getPublicClient() {
  if (!_publicClient) {
    _publicClient = createClient(SUPABASE_URL, ANON_KEY);
  }
  return _publicClient;
}
