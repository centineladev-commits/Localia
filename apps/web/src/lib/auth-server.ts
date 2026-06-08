/**
 * Server-side authentication helpers for Next.js Route Handlers.
 * Uses the Supabase anon key + user's JWT to validate identity.
 */
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

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
 * Returns true if the request carries a valid admin JWT
 * (user.app_metadata.is_admin === true).
 */
export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  const user = await getRequestUser(req);
  return user?.app_metadata?.is_admin === true;
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
