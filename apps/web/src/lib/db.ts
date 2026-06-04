import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";

// Singleton para evitar múltiples pools en hot-reload de Next.js
let _db: PostgresJsDatabase | null = null;

export function getDb(): PostgresJsDatabase {
  if (_db) return _db;

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL no está definido. Añádelo en apps/web/.env.local"
    );
  }

  const client = postgres(process.env.DATABASE_URL, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  _db = drizzle(client);
  return _db;
}
