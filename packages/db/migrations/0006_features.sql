-- ═══════════════════════════════════════════════════════════════
-- LOCALIA — Nuevas features: wishlist, reservas, stock, helpers
-- Ejecutar en Supabase SQL Editor (idempotente)
-- ═══════════════════════════════════════════════════════════════

-- ── PAID_AT en orders (si aún no existe) ─────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- ── WISHLIST ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlists(user_id);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "wishlist_own" ON wishlists FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── RESERVAS ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM ('pending','confirmed','rejected','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  shop_id         UUID NOT NULL REFERENCES shops(id)    ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity        INT NOT NULL DEFAULT 1,
  unit_price      NUMERIC(10,2) NOT NULL,
  total_amount    NUMERIC(10,2) NOT NULL,
  amount_paid     NUMERIC(10,2) NOT NULL DEFAULT 0,
  status          reservation_status DEFAULT 'pending',
  notes           TEXT,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_user    ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_shop    ON reservations(shop_id);
CREATE INDEX IF NOT EXISTS idx_reservations_product ON reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status  ON reservations(status);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "reservation_buyer" ON reservations FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── PAGOS DE RESERVA ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservation_payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  amount         NUMERIC(10,2) NOT NULL,
  stripe_pi_id   TEXT,
  paid_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_res_payments_res ON reservation_payments(reservation_id);

-- ── FUNCIÓN: decrementar stock ────────────────────────────────────
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_qty INT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE products
     SET stock  = GREATEST(0, stock - p_qty),
         active = CASE WHEN stock - p_qty <= 0 THEN false ELSE active END,
         updated_at = now()
   WHERE id = p_product_id;
END;
$$;

-- ── FUNCIÓN: shops cerca de punto (helper para mapa) ─────────────
CREATE OR REPLACE FUNCTION get_shops_near(
  p_lat      FLOAT,
  p_lng      FLOAT,
  p_city_id  UUID,
  p_radius_m INT DEFAULT 3000
) RETURNS TABLE(
  id UUID, name TEXT, slug TEXT, logo_url TEXT, cover_url TEXT,
  category_id UUID, lat FLOAT, lng FLOAT, distance_m FLOAT,
  rating FLOAT, status TEXT
) LANGUAGE sql STABLE AS $$
  SELECT
    s.id, s.name, s.slug, s.logo_url, s.cover_url,
    s.category_id,
    ST_Y(s.location_point::geometry)::FLOAT,
    ST_X(s.location_point::geometry)::FLOAT,
    ST_Distance(s.location_point, ST_MakePoint(p_lng, p_lat)::geography)::FLOAT,
    NULL::FLOAT,
    s.status::TEXT
  FROM shops s
  WHERE s.city_id = p_city_id
    AND s.active = true
    AND s.status = 'verified'
    AND ST_DWithin(
      s.location_point,
      ST_MakePoint(p_lng, p_lat)::geography,
      p_radius_m
    )
  ORDER BY ST_Distance(s.location_point, ST_MakePoint(p_lng, p_lat)::geography);
$$;
