-- ─────────────────────────────────────────────────────────────
-- Migration 0011 — Marketplace: onboarding vendedor, envíos, Connect, auditoría
-- Ejecutar en Supabase SQL Editor DESPUÉS de 0010.
-- Idempotente: IF NOT EXISTS, DO $$ para tipos/enums, DROP POLICY IF EXISTS.
-- ─────────────────────────────────────────────────────────────

-- ── 1. Solicitudes de cuenta de vendedor (onboarding) ───────────────────────
DO $$ BEGIN
  CREATE TYPE seller_application_status AS ENUM ('pending', 'approved', 'rejected', 'needs_more_docs');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS seller_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name   TEXT NOT NULL,
  nif             TEXT NOT NULL,
  fiscal_address  TEXT NOT NULL,
  contact_name    TEXT NOT NULL,
  phone           TEXT NOT NULL,
  business_email  TEXT NOT NULL,
  category        TEXT,
  website         TEXT,
  social          TEXT,
  description     TEXT,
  -- [{ type: 'cif'|'dni'|'licencia', url, name }] — apuntan al bucket PRIVADO seller-docs
  documents       JSONB DEFAULT '[]'::jsonb,
  status          seller_application_status NOT NULL DEFAULT 'pending',
  review_note     TEXT,
  reviewed_by     UUID REFERENCES users(id),
  reviewed_at     TIMESTAMPTZ,
  shop_id         UUID REFERENCES shops(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_seller_apps_status ON seller_applications(status);
CREATE INDEX IF NOT EXISTS idx_seller_apps_user   ON seller_applications(user_id);

ALTER TABLE seller_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS seller_apps_select ON seller_applications;
CREATE POLICY seller_apps_select ON seller_applications FOR SELECT USING (
  user_id = auth.uid() OR public.is_admin()
);
DROP POLICY IF EXISTS seller_apps_insert ON seller_applications;
CREATE POLICY seller_apps_insert ON seller_applications FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS seller_apps_update_admin ON seller_applications;
CREATE POLICY seller_apps_update_admin ON seller_applications FOR UPDATE USING (public.is_admin());

-- ── 2. Log de auditoría de acciones sensibles ───────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users(id),
  action      TEXT NOT NULL,            -- 'seller.approve', 'role.change', 'product.delete', 'refund.process'...
  target_type TEXT,                     -- 'seller_application', 'user', 'product', 'return'...
  target_id   TEXT,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor   ON audit_logs(actor_id);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_select_admin ON audit_logs;
CREATE POLICY audit_select_admin ON audit_logs FOR SELECT USING (public.is_admin());
-- Las escrituras van con service-role (bypassa RLS); no se permite insert desde cliente.

-- ── 3. Ajustes de plataforma (comisión configurable, etc.) ──────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO platform_settings (key, value) VALUES
  ('commission_percent', '8'::jsonb),
  ('commission_by_category', '{}'::jsonb),
  ('product_moderation', 'false'::jsonb)   -- false = publicación directa; true = revisión admin
ON CONFLICT (key) DO NOTHING;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS platform_settings_read ON platform_settings;
CREATE POLICY platform_settings_read ON platform_settings FOR SELECT USING (true); -- lectura pública (comisión)
DROP POLICY IF EXISTS platform_settings_write_admin ON platform_settings;
CREATE POLICY platform_settings_write_admin ON platform_settings FOR ALL USING (public.is_admin());

-- ── 4. Campos de envío en productos ─────────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS ships          BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_free   BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_price  NUMERIC(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS length_cm       INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS width_cm        INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS height_cm       INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_days   INTEGER DEFAULT 3;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status          TEXT DEFAULT 'active'; -- active | paused | pending_review

-- ── 5. Tracking de envío + estados ampliados en pedidos ─────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier         TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at      TIMESTAMPTZ;
-- Ampliar el ciclo de estados (idempotente). order_status ya tiene
-- pending/paid/processing/ready/delivered/cancelled.
DO $$ BEGIN ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'shipped'; EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'completed'; EXCEPTION WHEN others THEN null; END $$;
DO $$ BEGIN ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded'; EXCEPTION WHEN others THEN null; END $$;

-- ── 6. Stripe Connect en shops ──────────────────────────────────────────────
-- shops.stripe_account_id ya existe (0001). Añadimos flags de estado.
ALTER TABLE shops ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false;

-- ── 7. Bucket PRIVADO para documentos de verificación (KYC) ─────────────────
-- NO público: solo admin (service-role) puede leer; el dueño puede subir los suyos.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('seller-docs', 'seller-docs', false, 10485760,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','application/pdf'];

-- El usuario autenticado puede subir documentos a su propia carpeta seller-docs/<uid>/...
DROP POLICY IF EXISTS seller_docs_insert ON storage.objects;
CREATE POLICY seller_docs_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'seller-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
-- Lectura: solo el propio usuario o admin (las descargas reales van por endpoint admin con service-role)
DROP POLICY IF EXISTS seller_docs_select ON storage.objects;
CREATE POLICY seller_docs_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'seller-docs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));
