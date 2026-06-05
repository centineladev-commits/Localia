-- ═══════════════════════════════════════════════════════════════
-- LOCALIA — Migración unificada e idempotente
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── TIPOS ENUM ───────────────────────────────────────────────────
DO $$ BEGIN CREATE TYPE shop_status      AS ENUM ('pending','verified','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE order_status     AS ENUM ('pending','paid','processing','ready','delivered','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE delivery_type    AS ENUM ('pickup','local_delivery');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE product_condition AS ENUM ('new');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── CITIES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  boundary    GEOGRAPHY(Polygon, 4326),
  center      GEOGRAPHY(Point,   4326),
  zoom_level  INT DEFAULT 13,
  country     TEXT DEFAULT 'ES',
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── USERS (tabla pública, espejo de auth.users) ──────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  display_name    TEXT,
  avatar_url      TEXT,
  cover_url       TEXT,
  bio             TEXT,
  commercial_type TEXT DEFAULT 'buyer',
  business_name   TEXT,
  address         TEXT,
  nif             TEXT,
  website         TEXT,
  instagram       TEXT,
  verified        BOOLEAN,
  active_city_id  UUID REFERENCES cities(id),
  location_point  GEOGRAPHY(Point, 4326),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── SHOP CATEGORIES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL,
  slug  TEXT UNIQUE NOT NULL,
  icon  TEXT,
  color TEXT
);

-- ── SHOPS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shops (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id    UUID NOT NULL REFERENCES users(id),
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  description      TEXT,
  category_id      UUID REFERENCES shop_categories(id),
  logo_url         TEXT,
  cover_url        TEXT,
  city_id          UUID NOT NULL REFERENCES cities(id),
  address          TEXT,
  location_point   GEOGRAPHY(Point, 4326) NOT NULL,
  phone            TEXT,
  website          TEXT,
  opening_hours    JSONB,
  stripe_account_id TEXT,
  status           shop_status DEFAULT 'pending',
  active           BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shops_location ON shops USING GIST(location_point);
CREATE INDEX IF NOT EXISTS idx_shops_city     ON shops(city_id);
CREATE INDEX IF NOT EXISTS idx_shops_status   ON shops(status, active);

-- ── PRODUCT CATEGORIES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_categories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  shop_category_id UUID REFERENCES shop_categories(id)
);

-- ── PRODUCTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id      UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  city_id      UUID NOT NULL REFERENCES cities(id),
  category_id  UUID REFERENCES shop_categories(id),
  name         TEXT NOT NULL,
  description  TEXT,
  price        NUMERIC(10,2) NOT NULL,
  currency     TEXT DEFAULT 'EUR',
  stock        INT DEFAULT 0,
  sku          TEXT,
  condition    product_condition NOT NULL DEFAULT 'new',
  images       TEXT[],
  tags         TEXT[],
  weight_grams INT,
  active       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_shop   ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_city   ON products(city_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active, city_id);

ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('spanish', coalesce(name,'') || ' ' || coalesce(description,''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_fts ON products USING GIN(search_vector);

-- ── ORDERS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  shop_id               UUID REFERENCES shops(id),
  status                order_status DEFAULT 'pending',
  items                 JSONB DEFAULT '[]',
  subtotal              NUMERIC(10,2),
  platform_fee          NUMERIC(10,2) DEFAULT 0,
  total                 NUMERIC(10,2),
  delivery_type         delivery_type DEFAULT 'pickup',
  delivery_address      TEXT,
  stripe_payment_id     TEXT UNIQUE,
  paid_at               TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer  ON orders(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop   ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe ON orders(stripe_payment_id);

-- ── ORDER ITEMS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity   INT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  subtotal   NUMERIC(10,2) NOT NULL
);

-- ── REVIEWS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES orders(id),
  buyer_id   UUID NOT NULL REFERENCES users(id),
  shop_id    UUID NOT NULL REFERENCES shops(id),
  rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── RLS EN ORDERS ────────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "orders_select_own" ON orders FOR SELECT
    USING (auth.uid() = buyer_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "orders_insert_own" ON orders FOR INSERT
    WITH CHECK (auth.uid() = buyer_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── FIN ──────────────────────────────────────────────────────────
