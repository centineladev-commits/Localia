-- ─────────────────────────────────────────────────────────────────────────────
-- LocalMarket — Migración inicial
-- Ejecutar en Supabase SQL Editor (o psql con DATABASE_URL)
-- ─────────────────────────────────────────────────────────────────────────────

-- PostGIS ya está activado en Supabase por defecto
-- Si usas otro host: CREATE EXTENSION IF NOT EXISTS postgis;

-- ── ENUMS ────────────────────────────────────────────────────────────────────

CREATE TYPE shop_status       AS ENUM ('pending', 'verified', 'suspended');
CREATE TYPE order_status      AS ENUM ('pending', 'paid', 'processing', 'ready', 'delivered', 'cancelled');
CREATE TYPE delivery_type     AS ENUM ('pickup', 'local_delivery');
CREATE TYPE product_condition AS ENUM ('new');

-- ── CIUDADES ─────────────────────────────────────────────────────────────────

CREATE TABLE cities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  boundary    GEOGRAPHY(Polygon, 4326),
  center      GEOGRAPHY(Point, 4326),
  zoom_level  INT DEFAULT 13,
  country     TEXT DEFAULT 'ES',
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── USUARIOS ─────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT UNIQUE NOT NULL,
  phone            TEXT,
  display_name     TEXT,
  avatar_url       TEXT,
  active_city_id   UUID REFERENCES cities(id),
  location_point   GEOGRAPHY(Point, 4326),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── CATEGORÍAS DE COMERCIO ───────────────────────────────────────────────────

CREATE TABLE shop_categories (
  id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name   TEXT NOT NULL,
  slug   TEXT UNIQUE NOT NULL,
  icon   TEXT,
  color  TEXT
);

-- ── COMERCIOS ────────────────────────────────────────────────────────────────

CREATE TABLE shops (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id     UUID NOT NULL REFERENCES users(id),
  name              TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  description       TEXT,
  category_id       UUID REFERENCES shop_categories(id),
  logo_url          TEXT,
  cover_url         TEXT,
  city_id           UUID NOT NULL REFERENCES cities(id),
  address           TEXT,
  location_point    GEOGRAPHY(Point, 4326) NOT NULL,
  phone             TEXT,
  website           TEXT,
  opening_hours     JSONB,
  stripe_account_id TEXT,
  status            shop_status DEFAULT 'pending',
  active            BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Índices geoespaciales críticos
CREATE INDEX idx_shops_location ON shops USING GIST(location_point);
CREATE INDEX idx_shops_city     ON shops(city_id);
CREATE INDEX idx_shops_status   ON shops(status, active);

-- ── CATEGORÍAS DE PRODUCTO ───────────────────────────────────────────────────

CREATE TABLE product_categories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  shop_category_id UUID REFERENCES shop_categories(id)
);

-- ── PRODUCTOS ────────────────────────────────────────────────────────────────

CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  city_id       UUID NOT NULL REFERENCES cities(id),
  category_id   UUID REFERENCES product_categories(id),
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL,
  currency      TEXT DEFAULT 'EUR',
  stock         INT DEFAULT 0,
  sku           TEXT,
  condition     product_condition NOT NULL DEFAULT 'new',
  images        TEXT[],
  tags          TEXT[],
  weight_grams  INT,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_shop     ON products(shop_id);
CREATE INDEX idx_products_city     ON products(city_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active   ON products(active, city_id);

-- Full-text search en nombre y descripción
ALTER TABLE products
  ADD COLUMN search_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('spanish', coalesce(name,'') || ' ' || coalesce(description,''))
  ) STORED;

CREATE INDEX idx_products_fts ON products USING GIN(search_vector);

-- ── PEDIDOS ──────────────────────────────────────────────────────────────────

CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id       UUID NOT NULL REFERENCES users(id),
  shop_id             UUID NOT NULL REFERENCES shops(id),
  status              order_status DEFAULT 'pending',
  subtotal            NUMERIC(10,2),
  platform_fee        NUMERIC(10,2),
  total               NUMERIC(10,2),
  delivery_type       delivery_type DEFAULT 'pickup',
  delivery_address    JSONB,
  stripe_payment_id   TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_user_id);
CREATE INDEX idx_orders_shop  ON orders(shop_id);

-- ── LÍNEAS DE PEDIDO ─────────────────────────────────────────────────────────

CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id),
  quantity    INT NOT NULL,
  unit_price  NUMERIC(10,2) NOT NULL,
  subtotal    NUMERIC(10,2) NOT NULL
);

-- ── VALORACIONES ─────────────────────────────────────────────────────────────

CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id),
  buyer_id    UUID NOT NULL REFERENCES users(id),
  shop_id     UUID NOT NULL REFERENCES shops(id),
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── FUNCIÓN HELPER: comercios por ciudad y radio ──────────────────────────────
-- Uso: SELECT * FROM get_shops_near(40.4168, -3.7038, 'madrid-uuid', 3000)

CREATE OR REPLACE FUNCTION get_shops_near(
  p_lat      FLOAT,
  p_lng      FLOAT,
  p_city_id  UUID,
  p_radius_m INT DEFAULT 3000
)
RETURNS TABLE (
  id               UUID,
  name             TEXT,
  slug             TEXT,
  logo_url         TEXT,
  category_id      UUID,
  address          TEXT,
  opening_hours    JSONB,
  status           shop_status,
  active           BOOLEAN,
  distance_meters  FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    s.id, s.name, s.slug, s.logo_url, s.category_id,
    s.address, s.opening_hours, s.status, s.active,
    ST_Distance(s.location_point, ST_MakePoint(p_lng, p_lat)::geography) AS distance_meters
  FROM shops s
  WHERE
    s.city_id = p_city_id
    AND s.active = true
    AND s.status = 'verified'
    AND ST_DWithin(s.location_point, ST_MakePoint(p_lng, p_lat)::geography, p_radius_m)
  ORDER BY distance_meters ASC;
$$;
