-- ============================================================
-- 0007_fee_exemptions.sql
-- Exenciones de comisión para comercios — concedidas por admin
-- ============================================================

-- Tabla de exenciones
CREATE TABLE IF NOT EXISTS fee_exemptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id      UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  granted_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  starts_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at      TIMESTAMPTZ NOT NULL,
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_fee_exemptions_shop    ON fee_exemptions(shop_id);
CREATE INDEX IF NOT EXISTS idx_fee_exemptions_ends_at ON fee_exemptions(ends_at);

-- Vista de exenciones activas (simplifica las consultas en la aplicación)
CREATE OR REPLACE VIEW active_fee_exemptions AS
  SELECT *
  FROM fee_exemptions
  WHERE NOW() BETWEEN starts_at AND ends_at;

-- RLS: solo el service-role puede leer/escribir (la app usa getAdminClient())
ALTER TABLE fee_exemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON fee_exemptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
