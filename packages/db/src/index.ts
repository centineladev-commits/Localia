import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Singleton de conexión — reutiliza el pool en entornos serverless
const client = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
});

export const db = drizzle(client, { schema });

export * from "./schema";
export type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
