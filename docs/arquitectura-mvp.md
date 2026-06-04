# LocalMarket — Arquitectura MVP
**Plataforma de compraventa local B2C · Solo productos nuevos · Comercios locales · Mapa interactivo**
Fecha: 2026-06-04

---

## REGLAS DE NEGOCIO FUNDAMENTALES (No negociables)
1. **Sesgo geográfico estricto** — El usuario solo ve comercios y productos de su ciudad activa.
2. **Solo productos nuevos** — Prohibida la segunda mano. Validación en upload y moderación.
3. **B2C Multitienda** — Los vendedores son comercios registrados (tiendas, artesanos, productores). No particulares.

---

## 1. ARQUITECTURA DE DATOS

### 1.1 Entidades principales

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Usuario   │──────▶│   Pedido     │──────▶│  Comercio   │
│  (Comprador)│       │   (Order)    │       │ (Vendedor)  │
└─────────────┘       └──────────────┘       └─────────────┘
                             │                      │
                             │                      ▼
                             │               ┌─────────────┐
                             └──────────────▶│  Producto   │
                                             └─────────────┘
                                                    │
                                                    ▼
                                             ┌─────────────┐
                                             │  Ubicación  │
                                             │ (Geofencing)│
                                             └─────────────┘
```

### 1.2 Esquema de Base de Datos (PostgreSQL + PostGIS)

#### Tabla: `users` (Compradores)
```sql
users {
  id              UUID PRIMARY KEY
  email           TEXT UNIQUE NOT NULL
  phone           TEXT
  display_name    TEXT
  avatar_url      TEXT
  active_city_id  UUID REFERENCES cities(id)    -- ciudad activa del usuario
  location_point  GEOGRAPHY(POINT, 4326)        -- última posición GPS
  created_at      TIMESTAMPTZ DEFAULT now()
}
```

#### Tabla: `cities` (Catálogo de ciudades soportadas)
```sql
cities {
  id          UUID PRIMARY KEY
  name        TEXT NOT NULL                      -- "Madrid", "Barcelona"
  slug        TEXT UNIQUE NOT NULL               -- "madrid", "barcelona"
  boundary    GEOGRAPHY(POLYGON, 4326)           -- polígono del límite municipal
  center      GEOGRAPHY(POINT, 4326)             -- centro de la ciudad
  zoom_level  INT DEFAULT 13                     -- zoom inicial del mapa
  country     TEXT DEFAULT 'ES'
  active      BOOLEAN DEFAULT true
}
```

#### Tabla: `shops` (Comercios / Vendedores)
```sql
shops {
  id              UUID PRIMARY KEY
  owner_user_id   UUID REFERENCES users(id)
  name            TEXT NOT NULL
  slug            TEXT UNIQUE NOT NULL           -- para URL: /tienda/panaderia-garcia
  description     TEXT
  category_id     UUID REFERENCES shop_categories(id)
  logo_url        TEXT
  cover_url       TEXT
  city_id         UUID REFERENCES cities(id)    -- ciudad del comercio (OBLIGATORIO)
  address         TEXT
  location_point  GEOGRAPHY(POINT, 4326) NOT NULL  -- coordenadas exactas (pin en mapa)
  phone           TEXT
  website         TEXT
  opening_hours   JSONB                          -- { "mon": "09:00-20:00", ... }
  stripe_account_id TEXT                         -- Stripe Connect account ID
  verified        BOOLEAN DEFAULT false          -- verificación de negocio real
  active          BOOLEAN DEFAULT true
  created_at      TIMESTAMPTZ DEFAULT now()
}

-- Índice geoespacial CRÍTICO para consultas por radio/ciudad
CREATE INDEX idx_shops_location ON shops USING GIST(location_point);
CREATE INDEX idx_shops_city ON shops(city_id);
```

#### Tabla: `products` (Catálogo de productos)
```sql
products {
  id              UUID PRIMARY KEY
  shop_id         UUID REFERENCES shops(id) ON DELETE CASCADE
  city_id         UUID REFERENCES cities(id)    -- desnormalizado para filtros rápidos
  name            TEXT NOT NULL
  description     TEXT
  price           NUMERIC(10,2) NOT NULL
  currency        TEXT DEFAULT 'EUR'
  stock           INT DEFAULT 0
  sku             TEXT
  condition       TEXT DEFAULT 'new' CHECK (condition = 'new')  -- SOLO NUEVO. Constraint en BD.
  category_id     UUID REFERENCES product_categories(id)
  images          TEXT[]                         -- array de URLs
  tags            TEXT[]
  weight_grams    INT
  active          BOOLEAN DEFAULT true
  created_at      TIMESTAMPTZ DEFAULT now()
}

CREATE INDEX idx_products_shop ON products(shop_id);
CREATE INDEX idx_products_city ON products(city_id);
CREATE INDEX idx_products_category ON products(category_id);
```

#### Tabla: `orders` (Pedidos)
```sql
orders {
  id                UUID PRIMARY KEY
  buyer_user_id     UUID REFERENCES users(id)
  shop_id           UUID REFERENCES shops(id)
  status            TEXT CHECK (status IN ('pending','paid','processing','ready','delivered','cancelled'))
  subtotal          NUMERIC(10,2)
  platform_fee      NUMERIC(10,2)               -- comisión de la plataforma (ej. 8%)
  total             NUMERIC(10,2)
  delivery_type     TEXT CHECK (delivery_type IN ('pickup','local_delivery'))
  delivery_address  JSONB                        -- solo para local_delivery
  stripe_payment_id TEXT
  notes             TEXT
  created_at        TIMESTAMPTZ DEFAULT now()
}
```

#### Tabla: `order_items`
```sql
order_items {
  id          UUID PRIMARY KEY
  order_id    UUID REFERENCES orders(id)
  product_id  UUID REFERENCES products(id)
  quantity    INT NOT NULL
  unit_price  NUMERIC(10,2) NOT NULL            -- precio en el momento de compra
  subtotal    NUMERIC(10,2) NOT NULL
}
```

#### Tablas auxiliares
```sql
shop_categories { id, name, slug, icon, color }     -- Alimentación, Moda, Electrónica...
product_categories { id, name, slug, shop_category_id }
reviews { id, order_id, buyer_id, shop_id, rating INT(1-5), comment, created_at }
```

---

## 2. INTEGRACIÓN DEL MAPA INTERACTIVO

### 2.1 Herramienta recomendada: **Mapbox GL JS**

| Criterio         | Mapbox GL JS     | Google Maps      | OpenStreetMap (Leaflet) |
|-----------------|-----------------|-----------------|------------------------|
| Personalización  | ✅ Total          | Limitada         | ✅ Total                 |
| Coste MVP        | ✅ 50k tiles/mes gratis | ❌ Caro rápido | ✅ Gratis                |
| Rendimiento      | ✅ WebGL nativo   | Bueno            | Medio                  |
| Mobile SDK       | ✅ iOS + Android  | ✅               | Parcial                 |
| **Veredicto**    | **ELEGIR ESTE**  | Evitar en MVP    | Alternativa si 0 coste  |

**Razón de elección Mapbox**: control total del estilo visual (pines de colores por categoría, popups personalizados), SDK nativo para React Native, y plan gratuito suficiente para MVP.

### 2.2 Lógica del mapa — Flujo de datos

```
Usuario abre app
      │
      ▼
¿Tiene ciudad activa?
  No → Modal "Selecciona tu ciudad" (lista desplegable de ciudades soportadas)
  Sí → Continuar
      │
      ▼
Carga mapa centrado en city.center con city.zoom_level
      │
      ▼
Query geoespacial al backend:
  GET /api/shops?city_id=<id>&lat=<lat>&lng=<lng>&radius=<km>&category=<id>
      │
      ▼
Backend: SELECT * FROM shops
  WHERE city_id = $1
  AND ST_DWithin(location_point, ST_MakePoint($lng,$lat)::geography, $radius_meters)
  ORDER BY ST_Distance(location_point, ST_MakePoint($lng,$lat)::geography)
      │
      ▼
Renderizar pines en el mapa (agrupados con clustering si >50 pines)
```

### 2.3 Especificación de pines y UI del mapa

```
PIN DE COMERCIO:
  - Forma: círculo con icono de categoría
  - Color: por categoría (Alimentación=verde, Moda=rosa, Electrónica=azul...)
  - Estado: normal / destacado (al hacer tap) / visitado
  - Clustering: activar cuando zoom < 12 (grupos numéricos)

POPUP al tocar un pin:
  ┌─────────────────────────┐
  │ [Logo] Nombre Comercio  │
  │ ⭐ 4.8 · 120m de ti    │
  │ Abierto hasta las 20:00 │
  │ [Ver escaparate →]      │
  └─────────────────────────┘

FILTROS FLOTANTES (barra superior del mapa):
  [📍 Mi ciudad ▼] [Categoría ▼] [Abierto ahora] [Radio: 1km ←→ 5km]
```

### 2.4 Transición Mapa ↔ Lista

```
Botón toggle en la parte inferior:
  [🗺️ Mapa]  [☰ Lista]

Vista Lista: cards scrollables con foto, nombre, categorías, distancia, rating.
  Comparten el mismo estado de filtros que el mapa.
  Al hacer scroll, el mapa mini (miniaturas) puede sincronizarse (patrón Airbnb).
```

---

## 3. FLUJO DE NAVEGACIÓN PRINCIPAL (Comprador)

```
PASO 1 — ENTRADA
  App abre → Splash screen 1.5s
  ↓
  ¿Usuario autenticado?
    No → Onboarding rápido (3 pantallas: propuesta de valor) → Registro/Login
    Sí → Continuar

PASO 2 — DETECCIÓN DE CIUDAD
  ¿Tiene ciudad guardada?
    No → Modal: "¿En qué ciudad estás?"
         Opción A: "Usar mi ubicación" (GPS) → geocoding reverso → sugerir ciudad
         Opción B: Buscar ciudad manualmente (barra de búsqueda)
    Sí → Cargar directamente

PASO 3 — PANTALLA PRINCIPAL (Mapa)
  Mapa de la ciudad con todos los pines activos
  Barra de búsqueda superior: "¿Qué estás buscando?"
  Filtros por categoría (iconos horizontales: Todos / Alimentación / Moda / ...)
  
PASO 4 — BÚSQUEDA Y FILTRADO
  El usuario escribe "zapatillas" → 
  → Busca en products.name y products.tags WHERE city_id = activa
  → Muestra pines de las tiendas que tienen ese producto
  → Highlight de los pines coincidentes

PASO 5 — EXPLORACIÓN DE COMERCIO
  Tap en pin → Popup resumen
  Tap en "Ver escaparate" → Navega a /tienda/:slug
  
  Escaparate del Comercio:
  ┌─────────────────────────────┐
  │ [Cover foto]                │
  │ [Logo] Nombre · Categoría   │
  │ ⭐ Rating · Horario · Tlf   │
  │ [Cómo llegar] [WhatsApp]    │
  ├─────────────────────────────┤
  │ CATÁLOGO (grid 2 columnas)  │
  │ [Producto] [Producto]        │
  │ [Producto] [Producto]        │
  └─────────────────────────────┘

PASO 6 — DETALLE DE PRODUCTO
  Fotos (carrusel) → Nombre → Precio → Descripción → Stock
  [Añadir al carrito]
  NOTA: El carrito es por comercio (no se mezclan productos de distintas tiendas en un solo pedido)

PASO 7 — CARRITO Y CHECKOUT
  Resumen de productos
  Selector de entrega:
    🏪 "Recoger en tienda" (siempre disponible, gratis)
    🛵 "Entrega local" (si el comercio lo ofrece, con cargo)
  Método de pago: Tarjeta (Stripe)
  [Confirmar pedido]

PASO 8 — POST-COMPRA
  Confirmación con número de pedido
  Notificación push al comercio
  Tracking de estado: Pendiente → En preparación → Listo para recoger / En camino
  Opción de valorar el comercio tras recibir el pedido
```

---

## 4. STACK TECNOLÓGICO RECOMENDADO (MVP)

### 4.1 Frontend Web + Mobile

| Capa          | Tecnología         | Razón                                                        |
|--------------|-------------------|-------------------------------------------------------------|
| Framework     | **Next.js 15**     | SSR para SEO de escaparates, App Router, RSC                |
| Mobile        | **React Native (Expo)** | Código compartido con web, Mapbox SDK nativo          |
| UI Components | **shadcn/ui + Tailwind CSS** | Rápido de customizar para MVP                  |
| Mapas         | **Mapbox GL JS / react-map-gl** | Ver sección 2                                |
| Estado global | **Zustand**        | Ligero, sin boilerplate (filtros del mapa, carrito)         |
| Forms         | **React Hook Form + Zod** | Validación tipada                                    |
| Auth UI       | **Clerk** o **Supabase Auth** | Gestión de sesión lista en horas               |

### 4.2 Backend

| Capa          | Tecnología         | Razón                                                        |
|--------------|-------------------|-------------------------------------------------------------|
| Runtime       | **Node.js + Fastify** | Alto rendimiento en APIs REST                           |
| ORM           | **Drizzle ORM**    | Tipado total, soporte PostgreSQL/PostGIS nativo             |
| Alternativa   | **Supabase** (BaaS) | Si se quiere acelerar MVP: auth + BD + Storage + Realtime  |
| Geoespacial   | **PostGIS**        | Extensión PostgreSQL para ST_DWithin, ST_Distance          |
| Storage       | **Cloudflare R2** o **Supabase Storage** | Imágenes de productos y logos        |
| Cache         | **Redis (Upstash)** | Cache de consultas geoespaciales frecuentes               |
| Queue         | **BullMQ**         | Notificaciones, emails, moderación de productos            |

### 4.3 Base de Datos

```
PostgreSQL 16 + PostGIS 3.x
  ↓
Hosted en: Supabase (gratis hasta 500MB) o Neon.tech (serverless PostgreSQL)

Índices críticos para rendimiento:
  - GIST index en shops.location_point
  - GIST index en cities.boundary
  - B-tree en products.city_id, products.category_id
  - Full-text search: tsvector en products.name + products.description
```

### 4.4 Pasarela de Pago — Stripe Connect

```
MODELO DE PAGO (Marketplace):

Comprador paga 100€
     │
     ▼
Stripe retiene y distribuye:
  → 92€ al Stripe Connect Account del Comercio (transferencia automática)
  → 8€ a la cuenta de la Plataforma (comisión)
     │
     ▼
Stripe Connect tipo: "Express" (onboarding rápido para comercios)

FLUJO DE INTEGRACIÓN:
  1. Comercio hace onboarding → crea stripe_account_id
  2. Al checkout: crear PaymentIntent con application_fee_amount = 8%
  3. Stripe gestiona el payout al comercio automáticamente
  4. Webhooks: payment_succeeded → actualizar order.status = 'paid'
```

### 4.5 Infraestructura MVP

```
Hosting:     Vercel (Next.js) + Railway (API Fastify)
BD:          Supabase (PostgreSQL + PostGIS + Auth + Storage)
CDN:         Cloudflare
Push:        Firebase Cloud Messaging (notificaciones móvil)
Email:       Resend
Monitoreo:   Sentry (errores) + Posthog (analítica)
CI/CD:       GitHub Actions

Coste estimado MVP (tráfico bajo, <1000 usuarios):
  Vercel Free + Railway $5/mes + Supabase Free = ~$5-10/mes
```

---

## 5. ESTRUCTURA DE CARPETAS DEL PROYECTO

```
localmarket/
├── apps/
│   ├── web/                 # Next.js 15
│   │   ├── app/
│   │   │   ├── (public)/
│   │   │   │   ├── page.tsx           # Landing / Mapa principal
│   │   │   │   ├── tienda/[slug]/     # Escaparate del comercio
│   │   │   │   └── producto/[id]/     # Detalle de producto
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── registro/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── mi-cuenta/
│   │   │   │   ├── pedidos/
│   │   │   │   └── comercio/          # Panel del vendedor
│   │   │   └── api/                   # API Routes (Next.js)
│   │   └── components/
│   │       ├── map/                   # MapView, ShopPin, MapFilters
│   │       ├── shop/                  # ShopCard, ShopProfile
│   │       ├── product/               # ProductCard, ProductDetail
│   │       └── checkout/              # Cart, CheckoutForm
│   └── mobile/              # Expo React Native
│       └── ...              # Estructura similar
├── packages/
│   ├── db/                  # Drizzle schema + migrations
│   │   ├── schema/
│   │   │   ├── users.ts
│   │   │   ├── shops.ts
│   │   │   ├── products.ts
│   │   │   └── orders.ts
│   │   └── migrations/
│   ├── api/                 # Fastify API (o compartido con Next.js)
│   │   ├── routes/
│   │   │   ├── shops.ts     # GET /shops?city_id&lat&lng&radius
│   │   │   ├── products.ts
│   │   │   └── orders.ts
│   │   └── services/
│   │       ├── geo.service.ts
│   │       └── stripe.service.ts
│   └── shared/              # Types, utils, constants compartidos
└── docs/
    └── arquitectura-mvp.md  # Este documento
```

---

## 6. HOJA DE RUTA MVP (8 semanas)

```
Semana 1-2: BASE
  ✅ Setup monorepo (Turborepo)
  ✅ BD PostgreSQL + PostGIS + schema inicial
  ✅ Auth (Supabase Auth o Clerk)
  ✅ API base: CRUD de ciudades, comercios, productos

Semana 3-4: MAPA
  ✅ Integración Mapbox en Next.js
  ✅ Query geoespacial por ciudad/radio
  ✅ Pines, clustering, popup básico
  ✅ Filtros por categoría

Semana 5-6: ESCAPARATE Y CATÁLOGO
  ✅ Página de comercio (/tienda/:slug)
  ✅ Grid de productos
  ✅ Detalle de producto
  ✅ Carrito (por comercio)

Semana 7: PAGOS
  ✅ Stripe Connect onboarding para comercios
  ✅ Checkout con Stripe
  ✅ Webhooks y actualización de estado de pedido

Semana 8: POLISH Y LANZAMIENTO
  ✅ Notificaciones push
  ✅ Panel básico del vendedor
  ✅ Testing E2E crítico
  ✅ Deploy producción
```

---

## 7. CONSIDERACIONES CRÍTICAS DE SEGURIDAD Y NEGOCIO

```
MODERACIÓN DE PRODUCTOS:
  - Campo condition = 'new' forzado en BD (CHECK constraint)
  - Revisión manual de primeros 10 productos por comercio nuevo
  - Flag de "reportar producto de segunda mano" para usuarios

VERIFICACIÓN DE COMERCIOS:
  - El comercio sube: CIF/NIF, foto del local, extracto bancario
  - Estado: pending → verified (manual por admin) → active
  - Solo comercios verified pueden publicar productos

GEOFENCING:
  - El city_id se asigna al registrar el comercio y NO puede cambiarse sin validación de admin
  - Validar en backend que location_point del comercio esté DENTRO de cities.boundary
  - Usuarios no pueden ver comercios de otras ciudades (filtro server-side, no solo client-side)

FRAUDE EN PAGOS:
  - Stripe Connect maneja disputas y chargebacks
  - Retener pagos 2 días antes de liberar al comercio (configurar en Stripe)
```
