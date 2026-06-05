-- ─────────────────────────────────────────────────────────────
-- Zoco — Chat + extensiones de perfil
-- Ejecutar en Supabase SQL Editor después de 0003_seed_shops.sql
-- ─────────────────────────────────────────────────────────────

-- Extensión de perfiles
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio             TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS commercial_type TEXT DEFAULT 'buyer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS website         TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram       TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_seller BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT now();

-- Sistema de mensajería
CREATE TABLE IF NOT EXISTS conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id          UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id       UUID REFERENCES products(id) ON DELETE SET NULL,
  last_message     TEXT,
  last_message_at  TIMESTAMPTZ DEFAULT now(),
  unread_user      INT DEFAULT 0,
  unread_shop      INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id         UUID NOT NULL,
  sender_type       TEXT NOT NULL CHECK (sender_type IN ('user', 'shop')),
  body              TEXT NOT NULL,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user   ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_shop   ON conversations(shop_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv        ON messages(conversation_id, created_at);

-- RLS básico (habilitar en Supabase Dashboard → Authentication → Policies)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;

-- Los usuarios ven sus propias conversaciones
CREATE POLICY "user_own_conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

-- Los mensajes de conversaciones propias
CREATE POLICY "user_own_messages" ON messages
  FOR ALL USING (
    conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
  );
