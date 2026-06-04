# LocalMarket — Estado del Proyecto
**Última actualización:** 2026-06-04

---

## ¿Qué es esto?
Plataforma web de compraventa local con mapa interactivo. Tres reglas inamovibles:
1. Solo ves comercios de **tu ciudad** (sesgo geográfico)
2. Solo productos **nuevos** (prohibida la segunda mano)
3. Solo **comercios registrados** como vendedores (no particulares)

---

## ✅ HECHO

### Infraestructura base
- Monorepo con Turborepo (`apps/web`, `packages/db`, `packages/shared`)
- Next.js 14 + React 18 + Tailwind CSS
- TypeScript en todo el proyecto
- Git inicializado y aislado del proyecto Centinela

### Base de datos
- Schema completo diseñado: `cities`, `users`, `shop_categories`, `shops`, `product_categories`, `products`, `orders`, `order_items`, `reviews`
- Índices geoespaciales PostGIS (`GIST` sobre `location_point`)
- Full-text search en español (`tsvector` sobre nombre y descripción)
- Función SQL `get_shops_near(lat, lng, city_id, radius_m)` para búsqueda por radio
- Enums de negocio: `product_condition` solo permite `'new'` (constraint en BD)
- Archivos SQL listos: `0001_initial.sql` y `0002_seed.sql`

### App web — Mapa
- Mapa Mapbox GL interactivo centrado en la ciudad activa
- Pines de comercios con color por categoría
- Filtros flotantes: ciudad y categoría
- Popup al tocar un pin: nombre, distancia, rating, horario, botón escaparate

### App web — Flujo de compra completo
- **Modal de ciudad** (regla #1 visible): selección al entrar, persistida en localStorage
- **Escaparate** `/tienda/[slug]`: portada, info, catálogo en grid
- **Detalle de producto** `/producto/[id]`: fotos, precio, stock, selector de cantidad
- **Carrito lateral** (drawer): por comercio, persistido en localStorage
- **Checkout** `/checkout`: resumen, tipo de entrega (recogida/local), placeholder Stripe

### API Routes (Next.js)
- `GET /api/cities` — ciudades activas
- `GET /api/shops?city_id&lat&lng&radius_km&category_id` — comercios con geolocalización
- `GET /api/shops/[slug]` — comercio + productos

### Supabase
- Proyecto "Localia" creado (`yoitmdehvtleqrajbfny.supabase.co`)
- Data API activada
- Claves JWT configuradas en `.env.local`
- App conectada via `@supabase/supabase-js`

---

## 🔧 EN PROCESO

### Migración de BD — **PENDIENTE TU ACCIÓN**
Ejecutar en el SQL Editor de Supabase ([enlace directo](https://supabase.com/dashboard/project/yoitmdehvtleqrajbfny/sql/new)):

```
1. CREATE EXTENSION IF NOT EXISTS postgis;
2. Contenido de packages/db/migrations/0001_initial.sql
3. Contenido de packages/db/migrations/0002_seed.sql
```

Una vez hecho, el mapa mostrará datos reales en vez de los demo.

---

## 📋 PRÓXIMOS PASOS (en orden de prioridad)

### 1. Conectar mapa con BD real
- Reemplazar `demo-data.ts` por fetch a `/api/shops?city_id=...`
- El modal de ciudad llama a `/api/cities` para cargar la lista real
- Sincronizar el mapa con la ciudad activa

### 2. Autenticación de usuarios
- Registro/login de compradores con Supabase Auth
- Registro de comercios (con verificación manual por admin)
- Proteger rutas: checkout requiere login

### 3. Panel del comercio
- `/dashboard/comercio` — gestión de productos
- Subir fotos a Supabase Storage
- Publicar/despublicar productos
- Ver pedidos recibidos y cambiar su estado

### 4. Pagos con Stripe Connect
- Onboarding del comercio (crea cuenta Stripe Express)
- Checkout real con tarjeta
- Webhook `payment_succeeded` → actualizar estado del pedido
- Comisión automática del 8% a la plataforma

### 5. App móvil (Expo React Native)
- Reutilizar lógica y tipos del monorepo
- SDK de Mapbox para móvil
- Notificaciones push (Firebase Cloud Messaging)

### 6. Admin panel
- Verificar/suspender comercios
- Ver métricas: GMV, pedidos, ciudades activas
- Moderar productos reportados como segunda mano

---

## Stack tecnológico
| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Mapas | Mapbox GL JS |
| Estado | Zustand (mapa + carrito + ciudad) |
| Backend | Next.js API Routes |
| Base de datos | PostgreSQL 16 + PostGIS (Supabase) |
| Auth | Supabase Auth (pendiente) |
| Storage | Supabase Storage (pendiente) |
| Pagos | Stripe Connect (pendiente) |
| Hosting | Vercel (web) + Supabase (BD) |
| Mobile | Expo React Native (pendiente) |

---

## Servidor de desarrollo
```bash
cd C:\Users\Óscar\Desktop\LocalMarket\apps\web
npm run dev
# → http://localhost:3000
```
