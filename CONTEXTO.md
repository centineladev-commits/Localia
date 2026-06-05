# ZOCO — Contexto del Proyecto

## Qué es
Marketplace web local inspirado en Wallapop. Los usuarios descubren y compran productos nuevos de comercios físicos registrados cerca de ellos.

**3 reglas de negocio inamovibles:**
1. Solo productos **nuevos** (nada de segunda mano)
2. Solo **comercios registrados** (no particulares)
3. Geolocalización libre — el usuario elige cualquier ciudad, barrio o calle

---

## Stack
| Capa | Tech |
|------|------|
| Framework | Next.js 14 (App Router) |
| Estilos | Tailwind CSS |
| Estado | Zustand |
| BD | PostgreSQL + PostGIS (Supabase) |
| Auth | Supabase Auth |
| Mapas | Mapbox GL JS |
| Geocoding | Nominatim (OpenStreetMap, gratis) |
| Pagos | Stripe Connect (pendiente) |
| Hosting | Vercel + Supabase |

---

## Cómo arrancar

```bash
cd C:\Users\Óscar\Desktop\LocalMarket\apps\web
npm run dev
# → http://localhost:3000
```

---

## Estructura de carpetas clave

```
apps/web/src/
├── app/
│   ├── page.tsx               ← Portada: catálogo de productos
│   ├── mapa/page.tsx          ← Vista mapa
│   ├── tienda/[slug]/         ← Escaparate del comercio
│   ├── producto/[id]/         ← Detalle de producto
│   ├── checkout/              ← Proceso de compra
│   ├── perfil/                ← Perfil del usuario
│   ├── chat/                  ← Bandeja de mensajes
│   ├── dashboard/comercio/    ← Panel del comerciante
│   └── api/
│       ├── catalog/           ← GET productos con filtros
│       ├── shops/             ← GET comercios (mapa)
│       ├── cities/            ← GET ciudades
│       └── profile/           ← GET/PUT perfil
├── components/
│   ├── catalog/               ← ProductCard, CatalogPage, SearchFilters
│   ├── map/                   ← MapView, MapInitializer, ShopPopup
│   ├── auth/                  ← AuthModal, AuthProvider
│   ├── chat/                  ← ChatButton, ChatDrawer
│   ├── location/              ← LocationModal (geocoding libre)
│   ├── cart/                  ← CartButton, CartDrawer
│   ├── checkout/              ← CheckoutForm
│   ├── shop/                  ← ShopHeader, ProductGrid
│   └── layout/                ← Header
├── store/
│   ├── auth.store.ts          ← Usuario autenticado
│   ├── location.store.ts      ← Ubicación seleccionada + geocoding
│   ├── map.store.ts           ← Pines del mapa
│   └── cart.store.ts          ← Carrito de compra
└── lib/
    ├── types.ts               ← Shop, Product, ShopMapPin...
    ├── demo-data.ts           ← Datos de ejemplo (fallback)
    ├── constants.ts           ← Colores por categoría, radios...
    └── db.ts                  ← Clientes Supabase (admin + público)

packages/db/migrations/
├── 0001_initial.sql           ← Schema completo (tablas, índices PostGIS)
├── 0002_seed.sql              ← Seed original (incompleto)
├── 0003_seed_shops.sql        ← ⚠️ PENDIENTE ejecutar en Supabase
└── 0004_chat_profile.sql      ← ⚠️ PENDIENTE ejecutar en Supabase
```

---

## Supabase
- **Proyecto:** `yoitmdehvtleqrajbfny.supabase.co`
- **Dashboard:** https://supabase.com/dashboard/project/yoitmdehvtleqrajbfny
- **SQL Editor:** https://supabase.com/dashboard/project/yoitmdehvtleqrajbfny/sql/new

### Estado actual de la BD
| Tabla | Estado |
|-------|--------|
| cities | ✅ 7 ciudades insertadas |
| shop_categories | ✅ 7 categorías insertadas |
| users | ✅ Usuario demo insertado |
| shops | ⚠️ Vacía — ejecutar 0003_seed_shops.sql |
| products | ⚠️ Vacía — ejecutar 0003_seed_shops.sql |
| conversations | ⚠️ No existe — ejecutar 0004_chat_profile.sql |
| messages | ⚠️ No existe — ejecutar 0004_chat_profile.sql |

---

## ⚠️ Acciones pendientes en Supabase SQL Editor

### Paso 1 — Comercios y productos reales
Pegar el contenido de `packages/db/migrations/0003_seed_shops.sql`

### Paso 2 — Chat y perfiles extendidos
Pegar el contenido de `packages/db/migrations/0004_chat_profile.sql`

---

## Rutas de la app

| URL | Qué es |
|-----|--------|
| `/` | Catálogo principal (portada) |
| `/mapa` | Mapa interactivo con pines |
| `/tienda/[slug]` | Escaparate de un comercio |
| `/producto/[id]` | Detalle de producto + chat |
| `/checkout` | Proceso de pago |
| `/perfil` | Perfil del usuario (editable) |
| `/chat` | Bandeja de mensajes |
| `/dashboard/comercio` | Panel del comerciante |
| `/dashboard/comercio/productos` | Lista de productos |
| `/dashboard/comercio/productos/nuevo` | Añadir producto |
| `/dashboard/comercio/productos/[id]` | Editar producto |
| `/dashboard/comercio/pedidos` | Gestión de pedidos |

---

## Lo que funciona ahora

- [x] Catálogo de productos con búsqueda y filtros (categoría, precio, orden)
- [x] Localización libre (cualquier ciudad/barrio/calle de España)
- [x] Mapa interactivo con pines por categoría
- [x] Escaparate de comercio con productos reales de Supabase
- [x] Carrito de compra persistente
- [x] Checkout con validación de login y tipo de entrega
- [x] Login / Registro con Supabase Auth
- [x] Header con menú de usuario
- [x] Chat comprador ↔ comercio en producto
- [x] Perfil de usuario editable (foto, bio, tipo comercial)
- [x] Panel del comercio (resumen, productos, pedidos)
- [x] Añadir y editar productos desde el dashboard
- [x] Datos demo como fallback si la BD está vacía

---

## Lo que falta

### 🔴 Stripe Connect (siguiente sprint)
- Onboarding del comercio → cuenta Stripe Express
- Formulario de tarjeta en checkout
- Webhook `payment_intent.succeeded` → actualizar estado pedido
- Comisión automática 8% a la plataforma
- Variables de entorno: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

### 🟡 Mejoras futuras
- Subida de fotos a Supabase Storage (ahora solo URL)
- Notificaciones push (pedido confirmado, mensaje nuevo)
- Sistema de reseñas con estrellas
- Panel de admin (verificar comercios, métricas GMV)
- App móvil con Expo React Native

---

## Variables de entorno (.env.local)

```env
NEXT_PUBLIC_MAPBOX_TOKEN=...       # Token de Mapbox (demo funcional)
NEXT_PUBLIC_SUPABASE_URL=...       # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=...  # Clave pública
SUPABASE_SERVICE_ROLE_KEY=...      # Clave de admin (solo servidor)
DATABASE_URL=...                   # Conexión directa PostgreSQL

# Pendiente de añadir:
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Modelo de negocio
- **Comisión:** 8% por transacción completada
- **Gratis** para compradores
- **Gratis** para comercios (solo pagan la comisión al vender)
- **Futuro:** plan premium para comercios (posición destacada en mapa, estadísticas)
