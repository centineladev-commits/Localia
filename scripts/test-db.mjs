import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dir, "../apps/web/.env.local"), "utf8");
const env = Object.fromEntries(
  envContent.split("\n")
    .filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);

const url = env.DATABASE_URL;
const safeUrl = url.replace(/:([^@]+)@/, ":***@");
console.log("URL:", safeUrl);

// Parsear username/password de la URL
const parsed = new URL(url);
console.log("Host:", parsed.hostname, "Port:", parsed.port);
console.log("User:", parsed.username);

// Prueba 1: con ssl require
for (const sslMode of ["require", "prefer", false]) {
  try {
    const sql = postgres(url, { ssl: sslMode, max: 1, connect_timeout: 10, idle_timeout: 5 });
    const [r] = await sql`SELECT version()`;
    console.log(`✅ ssl=${sslMode}: ${r.version.split(" ").slice(0,2).join(" ")}`);
    await sql.end();
    break;
  } catch (e) {
    console.log(`❌ ssl=${sslMode}: [${e.code}] ${e.message}`);
  }
}
