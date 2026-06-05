# Localia — Fixes & Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir el bug crítico del filtro de ciudad, arreglar las acciones rotas en perfil/chat/paneles, pulir la UI y añadir optimizaciones de rendimiento.

**Architecture:** 11 tareas secuenciales, cada una toca un fichero diferente. Se empieza por el bug más crítico (filtro ciudad en demo fallback), luego acciones rotas (foto, chat, admin, vendedor), pulido de UI y por último optimizaciones. Todos los cambios son aislados.

**Tech Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Supabase (PostgreSQL + Auth + Storage) · Zustand · lucide-react

---

### Task 1: Fix city filter — demo fallback con UUID

**Files:**
- Modify: `apps/web/src/app/api/catalog/route.ts`

**El bug:** Cuando Supabase está vacío y activa el demo fallback, `cityParam` en el catch block es un UUID (el store envía `activeCity.id`). `DEMO_CITY_NAMES` está indexado por slug (`"madrid"`, `"barcelona"`), así que `DEMO_CITY_NAMES[uuid]` es `undefined` → los productos demo muestran el UUID como nombre de ciudad.

- [ ] **Step 1: Corregir la función demoFallback para detectar UUIDs**

En `apps/web/src/app/api/catalog/route.ts`, en la función `demoFallback`, reemplaza las líneas 39-42 (la lógica de `cityName` / `cityId`). **No añadas nada fuera de la función** — `UUID_RE` y `DEMO_CITY_NAMES` ya existen en el fichero (líneas 29 y 75).

```typescript
function demoFallback(params: {
  q?: string; category?: string; priceMin?: number; priceMax?: number; sort?: string;
  page: number; limit: number; cityId?: string; national?: boolean;
}): { products: CatalogProduct[]; total: number } {
  // Resolve display name: slugs → nombre; UUIDs → "Tu ciudad"
  const resolvedCityName = params.cityId
    ? UUID_RE.test(params.cityId)
      ? "Tu ciudad"                                        // UUID sin nombre local
      : (DEMO_CITY_NAMES[params.cityId] ?? params.cityId)  // slug conocido, DEMO_CITY_NAMES ya existe
    : "Madrid";

  const cityName = params.national ? "Otras ciudades" : resolvedCityName;
  const cityId   = params.national ? "" : (params.cityId ?? "");
```

- [ ] **Step 2: Corregir el call-site en el catch block**

Busca en el `catch` block (alrededor de línea 162) esta línea:

```typescript
cityId: cityParam || undefined, national,
```

Reemplázala por:

```typescript
cityId: cityId || cityParam || undefined, national,
```

Esto asegura que si `resolveCityId` resolvió el UUID correctamente, se pasa ese UUID; si no, se pasa el `cityParam` original (que puede ser un slug).

- [ ] **Step 3: Verificar que el archivo compila**

```bash
cd C:\Users\Óscar\Desktop\LocalMarket\apps\web && npx tsc --noEmit 2>&1 | head -20
```

Expected: sin errores (o solo errores preexistentes no relacionados).

- [ ] **Step 4: Commit**

```bash
cd C:\Users\Óscar\Desktop\LocalMarket
git add apps/web/src/app/api/catalog/route.ts
git commit -m "fix: catalog demo fallback handles UUID city_id without crashing city name lookup"
```

---

### Task 2: Fix avatar upload — validación de tamaño y errores específicos

**Files:**
- Modify: `apps/web/src/app/perfil/page.tsx`

**El bug:** `handleAvatarFile` no valida el tamaño del fichero (dice "máx. 5 MB" pero no lo comprueba). Si el upload falla, el catch muestra un `alert()` genérico sin el error real de Supabase.

- [ ] **Step 1: Añadir estado uploadError**

En `apps/web/src/app/perfil/page.tsx`, después de la línea:

```typescript
const [dragOver, setDragOver] = useState(false);
```

Añade:

```typescript
const [uploadError, setUploadError] = useState<string | null>(null);
```

- [ ] **Step 2: Reemplazar handleAvatarFile con versión validada**

Reemplaza la función completa `handleAvatarFile` (líneas 121-141):

```typescript
async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file || !user) return;

  // Validar tamaño (5 MB máx)
  if (file.size > 5 * 1024 * 1024) {
    setUploadError("La foto es demasiado grande. El tamaño máximo es 5 MB.");
    return;
  }
  // Validar tipo
  if (!file.type.startsWith("image/")) {
    setUploadError("El archivo debe ser una imagen (JPG, PNG o WEBP).");
    return;
  }

  setUploadError(null);
  setUploadingAvatar(true);
  try {
    const supabase = getPublicClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `avatars/${user.id}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("public-images")
      .upload(path, file, { upsert: true });
    if (uploadErr) throw uploadErr;
    const { data: urlData } = supabase.storage.from("public-images").getPublicUrl(path);
    const newUrl = urlData.publicUrl;
    setProfile((p) => ({ ...p, avatar_url: newUrl }));
    await supabase.from("users").upsert({
      id: user.id,
      email: user.email!,
      avatar_url: newUrl,
      updated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    setUploadError(
      err?.message?.includes("Bucket not found")
        ? "El bucket 'public-images' no existe en Supabase Storage. Créalo primero."
        : err?.message ?? "Error al subir la foto. Inténtalo de nuevo."
    );
  } finally {
    setUploadingAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
}
```

- [ ] **Step 3: Mostrar uploadError en el JSX**

Busca en el JSX el cierre de la drop-zone (`</div>` después del bloque `uploadingAvatar ? ... : ...`). Justo después añade:

```tsx
{uploadError && (
  <p className="text-xs text-red-500 mt-2 font-medium">{uploadError}</p>
)}
```

Está en la sección `{/* Foto de perfil — drop zone */}`, después del `</div>` que cierra la drop zone y antes del `<div>` del input de URL.

- [ ] **Step 4: Commit**

```bash
cd C:\Users\Óscar\Desktop\LocalMarket
git add apps/web/src/app/perfil/page.tsx
git commit -m "fix: avatar upload validates file size/type and shows specific Supabase error"
```

---

### Task 3: Fix chat — recuperar mensaje en fallo de envío

**Files:**
- Modify: `apps/web/src/app/chat/page.tsx`

**El bug:** En `sendMessage`, `setBody("")` se ejecuta antes del insert. Si el insert falla (error RLS, red caída), el texto del usuario desaparece silenciosamente sin ningún aviso.

- [ ] **Step 1: Añadir estado sendError**

En `apps/web/src/app/chat/page.tsx`, después de la línea:

```typescript
const [sending, setSending] = useState(false);
```

Añade:

```typescript
const [sendError, setSendError] = useState<string | null>(null);
```

- [ ] **Step 2: Reemplazar sendMessage con versión que recupera el texto en fallo**

Reemplaza la función completa `sendMessage` (líneas 443-480):

```typescript
const sendMessage = async () => {
  if (!body.trim() || !activeConv || !user || sending) return;
  const text = body.trim();
  setSendError(null);
  setBody("");
  setSending(true);

  const supabase = getPublicClient();

  const { data: inserted, error: insertError } = await supabase
    .from("messages")
    .insert({
      conversation_id: activeConv.id,
      sender_id: user.id,
      sender_type: "user",
      body: text,
    })
    .select()
    .single();

  if (insertError || !inserted) {
    // Restaurar el texto para que el usuario no lo pierda
    setBody(text);
    setSendError("No se pudo enviar el mensaje. Inténtalo de nuevo.");
    setSending(false);
    return;
  }

  // Actualización optimista — Realtime también disparará pero deduplicamos por id
  setMessages((prev) => {
    if (prev.find((m) => m.id === (inserted as Message).id)) return prev;
    return [...prev, inserted as Message];
  });

  // Actualizar preview de la conversación (no-blocking)
  supabase
    .from("conversations")
    .update({
      last_message: text,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", activeConv.id)
    .then(() => {});

  setSending(false);
  textareaRef.current?.focus();
};
```

- [ ] **Step 3: Mostrar sendError bajo la barra de input**

Busca en el JSX la línea:

```tsx
<p className="text-[10px] text-gray-400 mt-1.5 text-center select-none">
  Shift + Enter para nueva linea
</p>
```

Justo después añade:

```tsx
{sendError && (
  <p className="text-[11px] text-red-500 text-center mt-1 font-medium">{sendError}</p>
)}
```

- [ ] **Step 4: Commit**

```bash
cd C:\Users\Óscar\Desktop\LocalMarket
git add apps/web/src/app/chat/page.tsx
git commit -m "fix: chat restores message body and shows error if Supabase insert fails"
```

---

### Task 4: Fix admin panel — fallback de rol a tabla users

**Files:**
- Modify: `apps/web/src/app/dashboard/admin/page.tsx`

**El bug:** `isAdmin` solo mira `app_metadata.is_admin` que requiere configuración manual en Supabase Auth. Si no está seteado, el panel de admin es inaccesible. Añadimos fallback a la columna `role` de la tabla `users`.

- [ ] **Step 1: Reemplazar el estado isAdmin fijo por verificación dual**

Busca en `AdminPage` las líneas:

```typescript
const { user, loading } = useAuthStore();
const [tab, setTab]     = useState<"shops" | "exemptions">("shops");
const [token, setToken] = useState<string | null>(null);

const isAdmin = user?.app_metadata?.is_admin === true;

useEffect(() => {
  if (user) {
    getPublicClient().auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }
}, [user]);
```

Reemplázalas por:

```typescript
const { user, loading } = useAuthStore();
const [tab, setTab]       = useState<"shops" | "exemptions">("shops");
const [token, setToken]   = useState<string | null>(null);
const [isAdmin, setIsAdmin]       = useState(false);
const [adminChecked, setAdminChecked] = useState(false);

useEffect(() => {
  if (!user) { setAdminChecked(true); return; }

  // Check 1: app_metadata.is_admin (configurado en Supabase Auth)
  if (user?.app_metadata?.is_admin === true) {
    setIsAdmin(true);
    setAdminChecked(true);
  } else {
    // Check 2: columna role en tabla users (fallback)
    getPublicClient()
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.role === "admin");
        setAdminChecked(true);
      });
  }

  getPublicClient().auth.getSession().then(({ data }) => {
    setToken(data.session?.access_token ?? null);
  });
}, [user]);
```

- [ ] **Step 2: Actualizar el guard de loading**

Busca:

```typescript
if (loading) return (
```

Reemplaza por:

```typescript
if (loading || !adminChecked) return (
```

- [ ] **Step 3: Commit**

```bash
cd C:\Users\Óscar\Desktop\LocalMarket
git add apps/web/src/app/dashboard/admin/page.tsx
git commit -m "fix: admin panel checks users.role as fallback when app_metadata.is_admin is not set"
```

---

### Task 5: Fix panel vendedor — guard de city_id nulo

**Files:**
- Modify: `apps/web/src/app/dashboard/comercio/productos/nuevo/page.tsx`

**El bug:** Si `shop.city_id` es null (shop registrado sin ciudad asignada), el producto se inserta con `city_id: null` y nunca aparece en el catálogo de ninguna ciudad.

- [ ] **Step 1: Añadir validación de city_id antes del insert**

En `handleSubmit`, después de las líneas (aproximadamente línea 53-57):

```typescript
const shop = shops?.[0];
if (!shop) {
  setError("No tienes ningún comercio registrado. Contacta con el equipo para darlo de alta.");
  setLoading(false);
  return;
}
```

Añade inmediatamente después:

```typescript
if (!shop.city_id) {
  setError("Tu comercio no tiene ciudad asignada. Contacta con el equipo de Localia para configurarla antes de publicar productos.");
  setLoading(false);
  return;
}
```

- [ ] **Step 2: Commit**

```bash
cd C:\Users\Óscar\Desktop\LocalMarket
git add apps/web/src/app/dashboard/comercio/productos/nuevo/page.tsx
git commit -m "fix: vendor product form blocks publish if shop.city_id is null"
```

---

### Task 6: UI polish — ProductCard con badge ciudad y precio con locale

**Files:**
- Modify: `apps/web/src/components/catalog/ProductCard.tsx`

**Cambios:** Precio con `toLocaleString("es-ES")` para separador de miles correcto. Badge de ciudad visible sobre la imagen (actualmente está abajo en el texto, poco visible).

- [ ] **Step 1: Reemplazar el contenido completo de ProductCard.tsx**

```typescript
"use client";

import Link from "next/link";
import type { CatalogProduct } from "@/app/api/catalog/route";

function formatPrice(price: number): string {
  return price.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ProductCard({ product }: { product: CatalogProduct }) {
  const cityShort = product.cityName.split(",")[0];

  return (
    <Link href={`/producto/${product.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">

        {/* Imagen cuadrada */}
        <div className="aspect-square overflow-hidden bg-slate-100 relative">
          {product.images[0] ? (
            <>
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-out"
              />
              {/* Overlay gradiente en hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50">
              <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
          )}

          {/* Badge ciudad — bottom-left sobre la imagen */}
          {cityShort && product.stock > 0 && (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold rounded-full">
              <svg className="w-2.5 h-2.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {cityShort}
            </span>
          )}

          {/* Badge Últimas unidades */}
          {product.stock <= 3 && product.stock > 0 && (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-white text-[10px] font-black rounded-full shadow-md tracking-wide uppercase">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Últimas {product.stock}
            </span>
          )}

          {/* Overlay Agotado */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
              <span className="px-4 py-1.5 bg-slate-900/85 text-white text-xs font-black rounded-full tracking-widest uppercase shadow-lg">
                Agotado
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug mb-2">
            {product.name}
          </p>

          {/* Precio con formato español */}
          <p className="text-xl font-black text-slate-900 leading-none mb-2.5 tracking-tight">
            {formatPrice(product.price)}
            <span className="text-sm font-bold text-slate-500 ml-0.5"> €</span>
          </p>

          {/* Tienda */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <svg className="w-3 h-3 shrink-0 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="truncate font-medium text-slate-500">{product.shopName}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd C:\Users\Óscar\Desktop\LocalMarket
git add apps/web/src/components/catalog/ProductCard.tsx
git commit -m "feat: ProductCard shows city badge on image and formats price with es-ES locale"
```

---

### Task 7: UI polish — ProductDetail con botón Volver funcional

**Files:**
- Modify: `apps/web/src/components/product/ProductDetail.tsx`

**Cambio:** Añadir botón "← Volver" con `router.back()` al lado del breadcrumb existente.

- [ ] **Step 1: Añadir import de useRouter**

En `apps/web/src/components/product/ProductDetail.tsx`, después de la línea:

```typescript
import Link from "next/link";
```

Añade:

```typescript
import { useRouter } from "next/navigation";
```

- [ ] **Step 2: Inicializar router en el componente**

Dentro de `ProductDetail`, después de las líneas de estado existentes (cerca de línea 27-40), añade:

```typescript
const router = useRouter();
```

- [ ] **Step 3: Reemplazar el breadcrumb nav por versión con Volver**

Busca:

```tsx
{/* Breadcrumb */}
<nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-8">
  <Link href="/" className="hover:text-gray-600 transition-colors">Catálogo</Link>
  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
  <Link
    href={`/tienda/${shop.slug}`}
    className="hover:text-gray-600 transition-colors truncate max-w-[160px]"
  >
    {shop.name}
  </Link>
  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
  <span className="text-gray-700 font-medium truncate max-w-[200px]">{product.name}</span>
</nav>
```

Reemplaza por:

```tsx
{/* Volver + Breadcrumb */}
<div className="flex items-center gap-3 mb-8">
  <button
    onClick={() => router.back()}
    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors group shrink-0"
  >
    <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
    Volver
  </button>
  <span className="text-gray-200 hidden sm:block">·</span>
  <nav className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400 min-w-0">
    <Link href="/" className="hover:text-gray-600 transition-colors shrink-0">Catálogo</Link>
    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
    <Link
      href={`/tienda/${shop.slug}`}
      className="hover:text-gray-600 transition-colors truncate max-w-[160px]"
    >
      {shop.name}
    </Link>
    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
    <span className="text-gray-700 font-medium truncate max-w-[200px]">{product.name}</span>
  </nav>
</div>
```

- [ ] **Step 4: Commit**

```bash
cd C:\Users\Óscar\Desktop\LocalMarket
git add apps/web/src/components/product/ProductDetail.tsx
git commit -m "feat: ProductDetail adds functional back button with router.back()"
```

---

### Task 8: Añadir loading.tsx para rutas de dashboard

**Files:**
- Create: `apps/web/src/app/dashboard/comercio/loading.tsx`
- Create: `apps/web/src/app/dashboard/admin/loading.tsx`

- [ ] **Step 1: Crear loading para panel comercio**

Crea `apps/web/src/app/dashboard/comercio/loading.tsx`:

```typescript
export default function Loading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 bg-slate-100 rounded-xl w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-slate-100 rounded-2xl" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear loading para panel admin**

Crea `apps/web/src/app/dashboard/admin/loading.tsx`:

```typescript
export default function Loading() {
  return (
    <div className="p-6 space-y-4 animate-pulse max-w-5xl">
      <div className="h-9 bg-slate-100 rounded-xl w-64" />
      <div className="h-4 bg-slate-100 rounded-full w-96" />
      <div className="flex gap-2 pt-2">
        <div className="h-10 bg-slate-100 rounded-xl w-52" />
        <div className="h-10 bg-slate-100 rounded-xl w-44" />
      </div>
      <div className="flex gap-3 pt-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded-xl w-32" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd C:\Users\Óscar\Desktop\LocalMarket
git add apps/web/src/app/dashboard/comercio/loading.tsx apps/web/src/app/dashboard/admin/loading.tsx
git commit -m "feat: add animated skeleton loading screens for dashboard routes"
```

---

### Task 9: Crear helper requireAuth centralizado

**Files:**
- Create: `apps/web/src/lib/auth.ts`

**Nota:** Este helper es para server components que necesiten proteger rutas sin repetir el mismo código.

- [ ] **Step 1: Verificar que lib/db.ts exporta getAdminClient**

```bash
grep -n "export" C:\Users\Óscar\Desktop\LocalMarket\apps\web\src\lib\db.ts | head -10
```

Expected: línea con `export function getAdminClient` o similar.

- [ ] **Step 2: Crear el helper**

Crea `apps/web/src/lib/auth.ts`:

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
cd C:\Users\Óscar\Desktop\LocalMarket
git add apps/web/src/lib/auth.ts
git commit -m "refactor: add requireAuth server helper to centralize dashboard auth checks"
```

---

### Task 10: Cache headers para /api/cities

**Files:**
- Modify: `apps/web/src/app/api/cities/route.ts`

**Cambio:** Las ciudades rara vez cambian. Añadir `Cache-Control` para que Vercel las cachée 5 minutos.

- [ ] **Step 1: Leer el fichero actual**

Lee `apps/web/src/app/api/cities/route.ts` para identificar el `NextResponse.json(...)` de éxito.

- [ ] **Step 2: Añadir headers de caché al return exitoso**

Busca la línea con `return NextResponse.json({ cities` (o similar) y reemplaza por:

```typescript
return NextResponse.json(
  { cities },
  {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  }
);
```

Si el route tiene múltiples returns (error paths), solo modifica el return del path exitoso.

- [ ] **Step 3: Commit**

```bash
cd C:\Users\Óscar\Desktop\LocalMarket
git add apps/web/src/app/api/cities/route.ts
git commit -m "perf: cache /api/cities for 5 min (stale-while-revalidate 1h)"
```

---

### Task 11: Migración SQL — índices de rendimiento

**Files:**
- Create: `packages/db/migrations/0008_indexes.sql`

**Nota:** Esta migración debe ejecutarse manualmente en Supabase Dashboard → SQL Editor. Es idempotente (segura de ejecutar varias veces).

- [ ] **Step 1: Crear el fichero de migración**

Crea `packages/db/migrations/0008_indexes.sql`:

```sql
-- Migration 0008: Performance indexes
-- Run in Supabase Dashboard > SQL Editor
-- Idempotent: uses IF NOT EXISTS

-- Products: filtro por ciudad (query más frecuente)
CREATE INDEX IF NOT EXISTS idx_products_city_id
  ON products(city_id);

-- Products: solo activos con stock (partial index, más pequeño)
CREATE INDEX IF NOT EXISTS idx_products_active_stock
  ON products(active, stock)
  WHERE active = true AND stock > 0;

-- Products: por comercio (dashboard vendedor)
CREATE INDEX IF NOT EXISTS idx_products_shop_id
  ON products(shop_id);

-- Conversations: por usuario (página de chat)
CREATE INDEX IF NOT EXISTS idx_conversations_user_id
  ON conversations(user_id);

-- Messages: por conversación (cargar historial)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
  ON messages(conversation_id, created_at ASC);
```

- [ ] **Step 2: Commit**

```bash
cd C:\Users\Óscar\Desktop\LocalMarket
git add packages/db/migrations/0008_indexes.sql
git commit -m "perf: add DB performance indexes for products.city_id, conversations, and messages"
```

---

## Resumen de archivos modificados

| Task | Archivo | Tipo |
|------|---------|------|
| 1 | `apps/web/src/app/api/catalog/route.ts` | Fix bug |
| 2 | `apps/web/src/app/perfil/page.tsx` | Fix + UX |
| 3 | `apps/web/src/app/chat/page.tsx` | Fix bug |
| 4 | `apps/web/src/app/dashboard/admin/page.tsx` | Fix acceso |
| 5 | `apps/web/src/app/dashboard/comercio/productos/nuevo/page.tsx` | Fix validación |
| 6 | `apps/web/src/components/catalog/ProductCard.tsx` | UI polish |
| 7 | `apps/web/src/components/product/ProductDetail.tsx` | UI polish |
| 8 | `apps/web/src/app/dashboard/comercio/loading.tsx` (nuevo) | Performance |
| 8 | `apps/web/src/app/dashboard/admin/loading.tsx` (nuevo) | Performance |
| 9 | `apps/web/src/lib/auth.ts` (nuevo) | Refactor |
| 10 | `apps/web/src/app/api/cities/route.ts` | Performance |
| 11 | `packages/db/migrations/0008_indexes.sql` (nuevo) | Performance |
