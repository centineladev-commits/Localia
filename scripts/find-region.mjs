/**
 * Detecta la región de Supabase probando todos los poolers conocidos.
 * Lee credenciales de apps/web/.env.local — no hardcodea nada.
 */
import postgres from "postgres";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../apps/web/.env.local");
const envContent = readFileSync(envPath, "utf8");
const env = Object.fromEntries(
  envContent.split("\n")
    .filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);

const baseUrl  = new URL(env.DATABASE_URL);
const user     = baseUrl.username;
const pass     = baseUrl.password;

// Todos los poolers de Supabase conocidos
const ALL_REGIONS = [
  "aws-0-eu-west-1",
  "aws-0-eu-west-2",
  "aws-0-eu-west-3",
  "aws-0-eu-central-1",
  "aws-0-eu-north-1",
  "aws-0-eu-south-1",
  "aws-0-us-east-1",
  "aws-0-us-east-2",
  "aws-0-us-west-1",
  "aws-0-us-west-2",
  "aws-0-ap-southeast-1",
  "aws-0-ap-southeast-2",
  "aws-0-ap-northeast-1",
  "aws-0-ap-northeast-2",
  "aws-0-ap-south-1",
  "aws-0-sa-east-1",
  "aws-0-ca-central-1",
];

console.log(`Buscando región para ${user}...\n`);

for (const region of ALL_REGIONS) {
  const host = `${region}.pooler.supabase.com`;
  const url  = `postgresql://${user}:${pass}@${host}:5432/postgres`;
  try {
    const sql = postgres(url, { ssl: "require", max: 1, connect_timeout: 8, idle_timeout: 3 });
    const [r]  = await sql`SELECT 1 AS v`;
    await sql.end();
    console.log(`\n✅ REGIÓN ENCONTRADA: ${region}`);
    const newUrl = url;
    const updatedEnv = envContent.replace(/^DATABASE_URL=.+$/m, `DATABASE_URL=${newUrl}`);
    writeFileSync(envPath, updatedEnv);
    console.log("   .env.local actualizado");
    console.log(`   DATABASE_URL apunta a: ${host}`);
    process.exit(0);
  } catch (e) {
    const reason = e.message.includes("not found") ? "wrong region" :
                   e.message.includes("password") ? "wrong password" :
                   e.message.includes("timeout")  ? "timeout" : e.message.slice(0, 50);
    console.log(`  ${region.padEnd(28)} ${reason}`);
  }
}

console.log("\n❌ No se encontró la región. Posibles causas:");
console.log("   - Contraseña incorrecta");
console.log("   - El proyecto está pausado en Supabase");
