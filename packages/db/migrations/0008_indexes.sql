-- Migration 0008: Performance indexes
-- Run in Supabase Dashboard > SQL Editor
-- Idempotent: uses IF NOT EXISTS

-- Products: filtro por ciudad (query más frecuente)
CREATE INDEX IF NOT EXISTS idx_products_city_id
  ON products(city_id);

-- Products: solo activos con stock (partial index)
CREATE INDEX IF NOT EXISTS idx_products_active_stock
  ON products(active, stock)
  WHERE active = true AND stock > 0;

-- Products: por comercio (dashboard vendedor)
CREATE INDEX IF NOT EXISTS idx_products_shop_id
  ON products(shop_id);

-- Conversations: por usuario (página de chat)
CREATE INDEX IF NOT EXISTS idx_conversations_user_id
  ON conversations(user_id);

-- Messages: por conversación (cargar historial)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
  ON messages(conversation_id, created_at ASC);
