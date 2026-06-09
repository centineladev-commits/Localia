/**
 * Server-side authentication helpers for Next.js Route Handlers.
 * Uses the Supabase anon key + user's JWT to validate identity.
 */
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { getAdminClient } from "./db";

/**
 * Extracts the Bearer token from the Authorization header and verifies it
 * against Supabase auth. Returns the authenticated User or null.
 */
export async function getRequestUser(req: NextRequest): Promise<User | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return null;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Returns true if the request is from an admin. Acepta DOS fuentes (unificadas):
 *  - JWT app_metadata.is_admin === true, o
 *  - la columna users.role === 'admin' (más fácil de marcar vía SQL).
 */
export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  const user = await getRequestUser(req);
  return isAdminUser(user);
}

export async function isAdminUser(user: User | null): Promise<boolean> {
  if (!user) return false;
  if (user.app_metadata?.is_admin === true) return true;
  try {
    const { data } = await getAdminClient()
      .from("users").select("role").eq("id", user.id).single();
    return (data as { role?: string } | null)?.role === "admin";
  } catch {
    return false;
  }
}

/**
 * Simple in-process rate limiter (best-effort on serverless — resets on cold starts).
 * Allows `max` requests per `windowMs` per identifier (usually IP).
 */
const _rateBuckets = new Map<string, number[]>();

export function isRateLimited(
  identifier: string,
  max = 5,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const hits = (_rateBuckets.get(identifier) ?? []).filter(
    (t) => now - t < windowMs
  );
  hits.push(now);
  _rateBuckets.set(identifier, hits);
  // Clean old entries periodically to avoid memory leak
  if (_rateBuckets.size > 10_000) {
    for (const [k, v] of _rateBuckets) {
      if (v.every((t) => now - t >= windowMs)) _rateBuckets.delete(k);
    }
  }
  return hits.length > max;
}

/** Escape user-supplied HTML special chars before embedding in email templates. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
