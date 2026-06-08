-- ═══════════════════════════════════════════════════════════════════════════
-- LocalMarket — 0009_rls.sql
-- Row Level Security completo para todas las tablas
-- Idempotente: usa DO $$ IF NOT EXISTS (pg_policies) THEN ... END $$;
-- ═══════════════════════════════════════════════════════════════════════════

-- ── COLUMNA role EN users (si aún no existe) ─────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';


-- ── HELPER: is_admin() ───────────────────────────────────────────────────
-- Comprueba JWT app_metadata O columna role en users.
-- SECURITY DEFINER para poder leer users sin restricción de RLS.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- 1. CITIES  — lectura pública
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cities' AND policyname = 'cities_public_read'
  ) THEN
    CREATE POLICY "cities_public_read" ON public.cities
      FOR SELECT USING (true);
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 2. SHOP_CATEGORIES  — lectura pública
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN ALTER TABLE public.shop_categories ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'shop_categories' AND policyname = 'shop_categories_public_read'
  ) THEN
    CREATE POLICY "shop_categories_public_read" ON public.shop_categories
      FOR SELECT USING (true);
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 3. USERS  — propio perfil; admins ven todos
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- SELECT: propio perfil
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_select_own'
  ) THEN
    CREATE POLICY "users_select_own" ON public.users
      FOR SELECT USING (id = auth.uid() OR public.is_admin());
  END IF;
END $$;

-- UPDATE: solo el propio usuario puede actualizar su perfil
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_update_own'
  ) THEN
    CREATE POLICY "users_update_own" ON public.users
      FOR UPDATE
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- INSERT: Supabase crea el registro vía trigger; service_role lo inserta
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_insert_own'
  ) THEN
    CREATE POLICY "users_insert_own" ON public.users
      FOR INSERT WITH CHECK (id = auth.uid() OR public.is_admin());
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 4. SHOPS  — SELECT público (verified+active); owner edita su tienda; admins todo
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- SELECT: tiendas públicas activas y verificadas, o el propio owner, o admin
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'shops' AND policyname = 'shops_select_public'
  ) THEN
    CREATE POLICY "shops_select_public" ON public.shops
      FOR SELECT USING (
        (status = 'verified' AND active = true)
        OR owner_user_id = auth.uid()
        OR public.is_admin()
      );
  END IF;
END $$;

-- INSERT: solo usuarios autenticados crean su propia tienda
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'shops' AND policyname = 'shops_insert_owner'
  ) THEN
    CREATE POLICY "shops_insert_owner" ON public.shops
      FOR INSERT WITH CHECK (
        owner_user_id = auth.uid() OR public.is_admin()
      );
  END IF;
END $$;

-- UPDATE: solo el owner o un admin
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'shops' AND policyname = 'shops_update_owner'
  ) THEN
    CREATE POLICY "shops_update_owner" ON public.shops
      FOR UPDATE
      USING (owner_user_id = auth.uid() OR public.is_admin())
      WITH CHECK (owner_user_id = auth.uid() OR public.is_admin());
  END IF;
END $$;

-- DELETE: solo admins pueden eliminar tiendas
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'shops' AND policyname = 'shops_delete_admin'
  ) THEN
    CREATE POLICY "shops_delete_admin" ON public.shops
      FOR DELETE USING (public.is_admin());
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 5. PRODUCT_CATEGORIES  — lectura pública
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'product_categories' AND policyname = 'product_categories_public_read'
  ) THEN
    CREATE POLICY "product_categories_public_read" ON public.product_categories
      FOR SELECT USING (true);
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 6. PRODUCTS  — SELECT público si active; owner vía shop edita; admins todo
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- SELECT: productos activos son públicos; el owner ve los suyos aunque inactivos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'products_select_public'
  ) THEN
    CREATE POLICY "products_select_public" ON public.products
      FOR SELECT USING (
        active = true
        OR EXISTS (
          SELECT 1 FROM public.shops s
          WHERE s.id = products.shop_id AND s.owner_user_id = auth.uid()
        )
        OR public.is_admin()
      );
  END IF;
END $$;

-- INSERT: solo el owner de la tienda
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'products_insert_owner'
  ) THEN
    CREATE POLICY "products_insert_owner" ON public.products
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.shops s
          WHERE s.id = products.shop_id AND s.owner_user_id = auth.uid()
        )
        OR public.is_admin()
      );
  END IF;
END $$;

-- UPDATE: solo el owner de la tienda
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'products_update_owner'
  ) THEN
    CREATE POLICY "products_update_owner" ON public.products
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.shops s
          WHERE s.id = products.shop_id AND s.owner_user_id = auth.uid()
        )
        OR public.is_admin()
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.shops s
          WHERE s.id = products.shop_id AND s.owner_user_id = auth.uid()
        )
        OR public.is_admin()
      );
  END IF;
END $$;

-- DELETE: solo el owner de la tienda o admin
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'products_delete_owner'
  ) THEN
    CREATE POLICY "products_delete_owner" ON public.products
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.shops s
          WHERE s.id = products.shop_id AND s.owner_user_id = auth.uid()
        )
        OR public.is_admin()
      );
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 7. ORDERS  — comprador y shop owner; admins todo
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- SELECT: el comprador ve sus pedidos; el shop owner ve los pedidos de su tienda
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'orders_select_buyer_or_shop'
  ) THEN
    CREATE POLICY "orders_select_buyer_or_shop" ON public.orders
      FOR SELECT USING (
        buyer_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.shops s
          WHERE s.id = orders.shop_id AND s.owner_user_id = auth.uid()
        )
        OR public.is_admin()
      );
  END IF;
END $$;

-- INSERT: solo el comprador crea su pedido
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'orders_insert_buyer'
  ) THEN
    CREATE POLICY "orders_insert_buyer" ON public.orders
      FOR INSERT WITH CHECK (
        buyer_user_id = auth.uid() OR public.is_admin()
      );
  END IF;
END $$;

-- UPDATE: el comprador y el shop owner pueden actualizar (ej. estado del pedido)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'orders_update_buyer_or_shop'
  ) THEN
    CREATE POLICY "orders_update_buyer_or_shop" ON public.orders
      FOR UPDATE
      USING (
        buyer_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.shops s
          WHERE s.id = orders.shop_id AND s.owner_user_id = auth.uid()
        )
        OR public.is_admin()
      )
      WITH CHECK (
        buyer_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.shops s
          WHERE s.id = orders.shop_id AND s.owner_user_id = auth.uid()
        )
        OR public.is_admin()
      );
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 8. ORDER_ITEMS  — acceso vía order (comprador o shop owner)
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- SELECT: si el usuario puede ver el pedido, puede ver sus líneas
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'order_items' AND policyname = 'order_items_select_via_order'
  ) THEN
    CREATE POLICY "order_items_select_via_order" ON public.order_items
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = order_items.order_id
            AND (
              o.buyer_user_id = auth.uid()
              OR EXISTS (
                SELECT 1 FROM public.shops s
                WHERE s.id = o.shop_id AND s.owner_user_id = auth.uid()
              )
              OR public.is_admin()
            )
        )
      );
  END IF;
END $$;

-- INSERT: el comprador inserta líneas al crear el pedido
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'order_items' AND policyname = 'order_items_insert_buyer'
  ) THEN
    CREATE POLICY "order_items_insert_buyer" ON public.order_items
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = order_items.order_id
            AND (o.buyer_user_id = auth.uid() OR public.is_admin())
        )
      );
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 9. CONVERSATIONS  — el user y el shop owner; admins todo
--    NOTA: 0004_chat_profile.sql ya creó políticas básicas.
--    Aquí añadimos la política del shop owner (idempotente).
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- SELECT: el user ve sus conversaciones (cubre la política existente "user_own_conversations")
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'conversations_select_participant'
  ) THEN
    CREATE POLICY "conversations_select_participant" ON public.conversations
      FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.shops s
          WHERE s.id = conversations.shop_id AND s.owner_user_id = auth.uid()
        )
        OR public.is_admin()
      );
  END IF;
END $$;

-- INSERT: solo el user inicia conversaciones
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'conversations_insert_user'
  ) THEN
    CREATE POLICY "conversations_insert_user" ON public.conversations
      FOR INSERT WITH CHECK (
        user_id = auth.uid() OR public.is_admin()
      );
  END IF;
END $$;

-- UPDATE: ambos participantes pueden actualizar (ej. marcar como leído)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'conversations_update_participant'
  ) THEN
    CREATE POLICY "conversations_update_participant" ON public.conversations
      FOR UPDATE
      USING (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.shops s
          WHERE s.id = conversations.shop_id AND s.owner_user_id = auth.uid()
        )
        OR public.is_admin()
      )
      WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.shops s
          WHERE s.id = conversations.shop_id AND s.owner_user_id = auth.uid()
        )
        OR public.is_admin()
      );
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 10. MESSAGES  — acceso vía conversation; admins todo
--     NOTA: 0004_chat_profile.sql ya creó "user_own_messages".
--     Aquí añadimos la política del shop owner (idempotente).
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- SELECT: los participantes de la conversación ven los mensajes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'messages_select_participant'
  ) THEN
    CREATE POLICY "messages_select_participant" ON public.messages
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id = messages.conversation_id
            AND (
              c.user_id = auth.uid()
              OR EXISTS (
                SELECT 1 FROM public.shops s
                WHERE s.id = c.shop_id AND s.owner_user_id = auth.uid()
              )
              OR public.is_admin()
            )
        )
      );
  END IF;
END $$;

-- INSERT: cualquier participante de la conversación puede enviar mensajes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'messages_insert_participant'
  ) THEN
    CREATE POLICY "messages_insert_participant" ON public.messages
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id = messages.conversation_id
            AND (
              c.user_id = auth.uid()
              OR EXISTS (
                SELECT 1 FROM public.shops s
                WHERE s.id = c.shop_id AND s.owner_user_id = auth.uid()
              )
              OR public.is_admin()
            )
        )
      );
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 11. WISHLISTS  — CRUD solo el owner
--     NOTA: 0006_features.sql ya creó "wishlist_own".
--     Aquí garantizamos que RLS esté activo (idempotente).
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- SELECT
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wishlists' AND policyname = 'wishlists_select_own'
  ) THEN
    CREATE POLICY "wishlists_select_own" ON public.wishlists
      FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
  END IF;
END $$;

-- INSERT
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wishlists' AND policyname = 'wishlists_insert_own'
  ) THEN
    CREATE POLICY "wishlists_insert_own" ON public.wishlists
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- DELETE
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wishlists' AND policyname = 'wishlists_delete_own'
  ) THEN
    CREATE POLICY "wishlists_delete_own" ON public.wishlists
      FOR DELETE USING (user_id = auth.uid() OR public.is_admin());
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 12. RESERVATIONS  — el user y el shop owner; admins todo
--     NOTA: 0006_features.sql ya creó "reservation_buyer".
--     Aquí añadimos la política del shop owner (idempotente).
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- SELECT: el user ve sus reservas; el shop owner ve las de su tienda
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reservations' AND policyname = 'reservations_select_participant'
  ) THEN
    CREATE POLICY "reservations_select_participant" ON public.reservations
      FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.shops s
          WHERE s.id = reservations.shop_id AND s.owner_user_id = auth.uid()
        )
        OR public.is_admin()
      );
  END IF;
END $$;

-- INSERT: solo el user crea reservas
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reservations' AND policyname = 'reservations_insert_user'
  ) THEN
    CREATE POLICY "reservations_insert_user" ON public.reservations
      FOR INSERT WITH CHECK (
        user_id = auth.uid() OR public.is_admin()
      );
  END IF;
END $$;

-- UPDATE: el user puede cancelar; el shop owner puede confirmar/rechazar/completar
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reservations' AND policyname = 'reservations_update_participant'
  ) THEN
    CREATE POLICY "reservations_update_participant" ON public.reservations
      FOR UPDATE
      USING (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.shops s
          WHERE s.id = reservations.shop_id AND s.owner_user_id = auth.uid()
        )
        OR public.is_admin()
      )
      WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.shops s
          WHERE s.id = reservations.shop_id AND s.owner_user_id = auth.uid()
        )
        OR public.is_admin()
      );
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 13. RESERVATION_PAYMENTS  — acceso vía reservation
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN ALTER TABLE public.reservation_payments ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- SELECT: si el usuario puede ver la reserva, puede ver sus pagos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reservation_payments' AND policyname = 'res_payments_select_via_reservation'
  ) THEN
    CREATE POLICY "res_payments_select_via_reservation" ON public.reservation_payments
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.reservations r
          WHERE r.id = reservation_payments.reservation_id
            AND (
              r.user_id = auth.uid()
              OR EXISTS (
                SELECT 1 FROM public.shops s
                WHERE s.id = r.shop_id AND s.owner_user_id = auth.uid()
              )
              OR public.is_admin()
            )
        )
      );
  END IF;
END $$;

-- INSERT: el user o service_role inserta pagos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reservation_payments' AND policyname = 'res_payments_insert_user'
  ) THEN
    CREATE POLICY "res_payments_insert_user" ON public.reservation_payments
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.reservations r
          WHERE r.id = reservation_payments.reservation_id
            AND (r.user_id = auth.uid() OR public.is_admin())
        )
      );
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 14. FEE_EXEMPTIONS  — solo admins (y service_role vía política existente)
--     NOTA: 0007_fee_exemptions.sql ya habilitó RLS y creó "service_role_all".
--     Aquí añadimos la política para admins autenticados (idempotente).
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN ALTER TABLE public.fee_exemptions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- SELECT: solo admins
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'fee_exemptions' AND policyname = 'fee_exemptions_admin_select'
  ) THEN
    CREATE POLICY "fee_exemptions_admin_select" ON public.fee_exemptions
      FOR SELECT USING (public.is_admin());
  END IF;
END $$;

-- INSERT: solo admins
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'fee_exemptions' AND policyname = 'fee_exemptions_admin_insert'
  ) THEN
    CREATE POLICY "fee_exemptions_admin_insert" ON public.fee_exemptions
      FOR INSERT WITH CHECK (public.is_admin());
  END IF;
END $$;

-- UPDATE: solo admins
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'fee_exemptions' AND policyname = 'fee_exemptions_admin_update'
  ) THEN
    CREATE POLICY "fee_exemptions_admin_update" ON public.fee_exemptions
      FOR UPDATE
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- DELETE: solo admins
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'fee_exemptions' AND policyname = 'fee_exemptions_admin_delete'
  ) THEN
    CREATE POLICY "fee_exemptions_admin_delete" ON public.fee_exemptions
      FOR DELETE USING (public.is_admin());
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 15. REVIEWS  — lectura pública; solo el comprador crea su propia valoración
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- SELECT: público
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'reviews_public_read'
  ) THEN
    CREATE POLICY "reviews_public_read" ON public.reviews
      FOR SELECT USING (true);
  END IF;
END $$;

-- INSERT: solo el comprador del pedido puede valorar
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'reviews_insert_buyer'
  ) THEN
    CREATE POLICY "reviews_insert_buyer" ON public.reviews
      FOR INSERT WITH CHECK (
        buyer_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = reviews.order_id AND o.buyer_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- DELETE: solo admins pueden eliminar valoraciones
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'reviews_delete_admin'
  ) THEN
    CREATE POLICY "reviews_delete_admin" ON public.reviews
      FOR DELETE USING (public.is_admin());
  END IF;
END $$;
