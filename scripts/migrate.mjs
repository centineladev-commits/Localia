/**
 * Migración via Supabase REST API (SQL execution endpoint)
 * Lee todas las credenciales de apps/web/.env.local
 */
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

const SUPABASE_URL  = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY   = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Faltan variables en .env.local");
  process.exit(1);
}

const headers = {
  "apikey": SERVICE_KEY,
  "Authorization": `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

// Ejecutar SQL via endpoint interno de Supabase
async function execSQL(sql, label) {
  // Supabase expone /pg/query en algunos proyectos
  // y /rest/v1/rpc/ para funciones personalizadas
  // Primero creamos la función helper si no existe
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_migration`, {
    method: "POST",
    headers,
    body: JSON.stringify({ sql_text: sql }),
  });
  if (res.ok) {
    console.log(`✅ ${label}`);
    return true;
  }
  return false;
}

// Dividir SQL en statements individuales y ejecutarlos via INSERT de tabla helper
async function runViaInsert(sqlContent, label) {
  // Filtrar comentarios y dividir por punto y coma
  const statements = sqlContent
    .split(";\n")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  console.log(`\n📦 ${label} — ${statements.length} statements`);

  let ok = 0, fail = 0;
  for (const stmt of statements) {
    if (!stmt || stmt.replace(/--.*$/gm, "").trim() === "") continue;
    const res = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ query: stmt + ";" }),
    });
    if (res.ok) {
      ok++;
    } else {
      const body = await res.text();
      // Ignorar errores "ya existe" (idempotente)
      if (body.includes("already exists") || body.includes("duplicate")) {
        ok++;
      } else {
        console.log(`  ⚠️  ${stmt.slice(0, 80).replace(/\n/g," ")}...`);
        console.log(`     Error: ${body.slice(0, 120)}`);
        fail++;
      }
    }
  }
  console.log(`  ✅ ${ok} OK  ❌ ${fail} errores`);
  return fail === 0;
}

console.log(`🔗 Supabase: ${SUPABASE_URL}`);
console.log("📡 Verificando conexión...\n");

// Test de conexión
const testRes = await fetch(`${SUPABASE_URL}/rest/v1/`, { headers });
console.log(`REST API: ${testRes.status} ${testRes.ok ? "✅" : "❌"}`);
if (!testRes.ok) { console.error("❌ No se puede conectar"); process.exit(1); }

// Leer migraciones
const sql0001 = readFileSync(resolve(__dir, "../packages/db/migrations/0001_initial.sql"), "utf8");
const sql0002 = readFileSync(resolve(__dir, "../packages/db/migrations/0002_seed.sql"), "utf8");

// Intentar /pg/query (disponible en algunos proyectos)
const pgTest = await fetch(`${SUPABASE_URL}/pg/query`, {
  method: "POST",
  headers,
  body: JSON.stringify({ query: "SELECT 1" }),
});

if (pgTest.ok) {
  console.log("✅ Endpoint /pg/query disponible\n");
  await runViaInsert(sql0001, "0001_initial.sql");
  await runViaInsert(sql0002, "0002_seed.sql");
} else {
  // Fallback: crear función SQL helper via REST y ejecutar
  console.log(`⚠️  /pg/query no disponible (${pgTest.status})`);
  console.log("\n📋 Ejecutando via supabase-js con service role...\n");

  // Instalar @supabase/supabase-js si hace falta
  const { createClient } = await import("@supabase/supabase-js").catch(() => null) ?? {};
  if (!createClient) {
    console.log("Instalando @supabase/supabase-js...");
    const { execSync } = await import("child_process");
    execSync("npm install @supabase/supabase-js --prefix " + resolve(__dir, ".."), { stdio: "inherit" });
  }

  const { createClient: cc } = await import("@supabase/supabase-js");
  const supabase = cc(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Usar supabase.rpc para ejecutar SQL (si hay función disponible)
  const { data, error } = await supabase.rpc("version");
  if (!error) {
    console.log("✅ RPC disponible:", data);
  } else {
    console.log(`\n❌ No hay forma de ejecutar DDL sin acceso directo a PostgreSQL.`);
    console.log("\n🔧 SOLUCIÓN MANUAL (2 minutos):");
    console.log("   1. Ve a: https://supabase.com/dashboard/project/yoitmdehvtleqrajbfny/sql/new");
    console.log("   2. Pega y ejecuta el contenido de: packages/db/migrations/0001_initial.sql");
    console.log("   3. Pega y ejecuta el contenido de: packages/db/migrations/0002_seed.sql");
    process.exit(1);
  }
}
