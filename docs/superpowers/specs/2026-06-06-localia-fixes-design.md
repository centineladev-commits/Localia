# Localia — Fixes & Polish Design Spec
**Date:** 2026-06-06  
**Project:** LocalMarket / Localia (Next.js 14 + Supabase)  
**Approach:** Secuencial por prioridad (A → B → C → D)

---

## Contexto

La app Localia está desplegada en Vercel. Los principales problemas son:
1. Bug crítico: el filtro de ciudad no filtra productos correctamente
2. Acciones rotas en UI: perfil, chat, paneles vendedor y admin cargan pero no funcionan
3. UI inconsistente en catálogo y producto
4. Optimizaciones de performance y código

---

## Tarea 1 — Bug crítico: filtro de ciudad

### Problema
`/api/catalog/route.ts` recibe `city_id` como slug (`"madrid"`) pero lo pasa directamente a queries SQL que esperan un UUID. La función `resolveCityId()` lo convierte correctamente, pero:
- El fallback demo usa `cityParam` (slug original) en vez de `cityId` (UUID resuelto)
- Si `cityParam` existe pero `cityId` es null, no hay warning ni guard

### Fix
1. Reemplazar `cityParam` por `cityId` en el objeto que se pasa al `demoFallback()`
2. Añadir guard: si `cityParam` existe pero `cityId` es null → `console.warn` y continuar sin filtro
3. Verificar que `CatalogPage.tsx` pasa el `city_id` correcto desde `useCityStore` al fetch de `/api/catalog`

### Resultado esperado
Al seleccionar "Valencia" en el selector, solo aparecen productos cuyo `city_id` corresponde a Valencia en Supabase.

---

## Tarea 2 — Acciones rotas

### 2a. Perfil — subida de foto
- Añadir validación de tamaño antes del upload: `file.size > 5 * 1024 * 1024` → error inline
- Verificar que el bucket `public-images` existe en Supabase Storage con política de lectura pública
- Mejorar mensaje de error: mostrar el error específico de Supabase en lugar de texto genérico
- Añadir estado `uploading` visual en el botón/zona de drop

### 2b. Chat
- Fix cleanup de subscriber Realtime: asegurar que `channel.unsubscribe()` se llama en el return del `useEffect`
- Deduplicación de mensajes: usar `Set<string>` de IDs en lugar de comparación por posición
- Añadir estado `sending: boolean` que deshabilita el input y botón mientras se envía un mensaje

### 2c. Panel vendedor
- Verificar headers de auth en fetch a `/api/my-exemption` y `/api/catalog`
- Validar que `shop.city_id` no sea null antes de insertar producto nuevo; mostrar error claro si falta
- Asegurar que los estados de pedido (Nuevo → Preparando → Listo → Entregado) se actualizan en BD

### 2d. Panel admin
- Mejorar verificación de rol: mantener `app_metadata.is_admin` como fuente principal; si no está presente, comprobar también la columna `role` en la tabla `users` de Supabase (sin crear tablas nuevas)
- Fix en botones Aprobar/Rechazar: ejecutar `router.refresh()` tras la acción para reflejar el cambio
- Asegurar que la creación de exenciones re-fetch la lista tras éxito

---

## Tarea 3 — Pulido de UI

### Catálogo / ProductCard
- Grid uniforme: altura consistente de tarjetas con `aspect-ratio` o altura fija de imagen
- Precio en formato español: `€` al final, separador de miles (ej: `12.500 €`)
- Badge visible con nombre de ciudad en cada tarjeta
- Skeleton loaders (`animate-pulse`) mientras carga el catálogo

### ProductDetail
- Breadcrumb: `Inicio › Categoría › Nombre del producto`
- Botón "← Volver" funcional con `router.back()`
- Precio más prominente (tamaño mayor, color de acento)
- Sección "Más de esta tienda" al final (últimos 4 productos del mismo shop)

### Formularios de producto
- Feedback visual en upload de imágenes: barra de progreso o spinner por imagen
- Errores inline por campo (no `alert()`)
- Botón guardar con estado `loading` y texto "Guardando..."

### General
- Espaciado y tipografía consistentes en todos los dashboards (usar mismas clases Tailwind)
- Estados vacíos con mensaje útil y CTA (ej: "Aún no tienes productos — [Crear el primero]")

---

## Tarea 4 — Optimización

### Performance
- Añadir `loading.tsx` en `/dashboard/comercio` y `/dashboard/admin`
- `React.memo` en `ProductCard` y `ShopHeader` (se renderizan muchas veces)
- Lazy load del componente de mapa: `dynamic(() => import('.../MapView'), { ssr: false })` solo en `/mapa`

### API / Base de datos
- Índice en `products.city_id`: `CREATE INDEX IF NOT EXISTS idx_products_city ON products(city_id)`
- Reemplazar `select('*')` por selects con campos específicos en las queries más usadas
- Cache en `/api/cities`: `Cache-Control: public, max-age=300, stale-while-revalidate=3600`

### Código
- Extraer lógica de auth check repetida en dashboards a un helper `requireAuth()` en `lib/auth.ts`
- Eliminar `console.log` de producción (mantener `console.warn/error`)
- Tipar `any` restantes con tipos correctos en TypeScript

### Vercel
- Verificar variables de entorno en Vercel Dashboard: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN`
- Añadir `images.remotePatterns` en `next.config.js` para el dominio de Supabase Storage

---

## Archivos afectados

| Archivo | Tarea |
|---------|-------|
| `apps/web/src/app/api/catalog/route.ts` | 1 |
| `apps/web/src/components/catalog/CatalogPage.tsx` | 1 |
| `apps/web/src/app/perfil/page.tsx` | 2a |
| `apps/web/src/app/chat/page.tsx` | 2b |
| `apps/web/src/app/dashboard/comercio/productos/nuevo/page.tsx` | 2c |
| `apps/web/src/app/dashboard/admin/page.tsx` | 2d |
| `apps/web/src/components/catalog/ProductCard.tsx` | 3 |
| `apps/web/src/app/producto/[id]/page.tsx` | 3 |
| `apps/web/src/components/product/ProductDetail.tsx` | 3 |
| `apps/web/src/app/dashboard/comercio/loading.tsx` | 4 |
| `apps/web/src/app/dashboard/admin/loading.tsx` | 4 |
| `apps/web/src/lib/auth.ts` (nuevo) | 4 |
| `apps/web/next.config.js` | 4 |
| `packages/db/migrations/0008_indexes.sql` (nuevo) | 4 |

---

## Orden de implementación

1. Bug ciudad (`/api/catalog`) → verificar en local
2. Acciones rotas (perfil → chat → vendedor → admin)
3. Pulido de UI (ProductCard → ProductDetail → formularios → estados vacíos)
4. Optimización (loading.tsx → lazy map → helper auth → next.config → índice BD)
