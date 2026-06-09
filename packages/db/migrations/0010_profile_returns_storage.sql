-- ─────────────────────────────────────────────────────────────
-- Migration 0010 — Perfil + Devoluciones + Storage + Índices
-- Ejecutar en Supabase SQL Editor DESPUÉS de 0009_rls.sql
-- Idempotente: IF NOT EXISTS en columnas/tablas/índices, DO $$ para tipos,
-- DROP POLICY IF EXISTS antes de CREATE POLICY.
-- ─────────────────────────────────────────────────────────────

-- ── 1. Columnas de perfil que el formulario /perfil ya usa pero no existían ──
-- (el upsert de perfil fallaba entero porque estas columnas no existen)
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_url     TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address       TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nif           TEXT;

-- ── 2. Devoluciones (returns) ───────────────────────────────────────────────
-- Enum de estado de la devolución (idempotente)
DO $$ BEGIN
  CREATE TYPE return_status AS ENUM ('pending', 'accepted', 'rejected', 'completed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS returns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  -- order_item_id NULL = devolución del pedido completo; con valor = línea concreta
  order_item_id   UUID REFERENCES order_items(id) ON DELETE SET NULL,
  buyer_user_id   UUID NOT NULL REFERENCES users(id),
  shop_id         UUID NOT NULL REFERENCES shops(id),
  status          return_status NOT NULL DEFAULT 'pending',
  reason          TEXT NOT NULL,
  -- nota del vendedor/admin al aceptar/rechazar/resolver
  resolution_note TEXT,
  quantity        INTEGER,
  -- importe a reembolsar, SIEMPRE calculado en servidor
  refund_amount   NUMERIC(10,2),
  stripe_refund_id TEXT,
  resolved_by     UUID REFERENCES users(id),
  requested_at    TIMESTAMPTZ DEFAULT now(),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_returns_order   ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_shop    ON returns(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_returns_buyer   ON returns(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_returns_status  ON returns(status);

-- RLS de returns (las mutaciones reales van por API con service-role; esto es
-- defensa en profundidad). is_admin() se crea en 0009_rls.sql.
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS returns_select ON returns;
CREATE POLICY returns_select ON returns FOR SELECT USING (
  buyer_user_id = auth.uid()
  OR shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
  OR public.is_admin()
);

DROP POLICY IF EXISTS returns_insert_buyer ON returns;
CREATE POLICY returns_insert_buyer ON returns FOR INSERT WITH CHECK (
  buyer_user_id = auth.uid()
);

DROP POLICY IF EXISTS returns_update_shop_admin ON returns;
CREATE POLICY returns_update_shop_admin ON returns FOR UPDATE USING (
  shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid())
  OR public.is_admin()
);

-- ── 3. Supabase Storage — bucket público de imágenes ────────────────────────
-- El avatar y la galería de productos suben a este bucket; no existía.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-images', 'public-images', true, 5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif'];

-- Políticas de storage.objects para 'public-images':
-- lectura pública + escritura para usuarios autenticados.
DROP POLICY IF EXISTS public_images_read ON storage.objects;
CREATE POLICY public_images_read ON storage.objects
  FOR SELECT USING (bucket_id = 'public-images');

DROP POLICY IF EXISTS public_images_insert ON storage.objects;
CREATE POLICY public_images_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'public-images');

DROP POLICY IF EXISTS public_images_update ON storage.objects;
CREATE POLICY public_images_update ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'public-images');

DROP POLICY IF EXISTS public_images_delete ON storage.objects;
CREATE POLICY public_images_delete ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'public-images');

-- ── 4. Índices de rendimiento que faltaban (catálogo / búsqueda / mapa) ──────
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created    ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shops_city_status   ON shops(city_id, status, active);
