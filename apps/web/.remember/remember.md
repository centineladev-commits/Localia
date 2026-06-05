# Handoff

## State
Proyecto: **Localia** — marketplace local en `C:\Users\Óscar\Desktop\LocalMarket\apps\web`.
Stripe 100% integrado: claves TEST configuradas en `.env.local`, CLI instalado y autenticado (cuenta acct_1TeFrT4FHaDFWS5l), webhook secret guardado. Flujo completo: create-intent → Stripe Elements → webhook → orders en Supabase.
UI rediseñada por 5 agentes: catálogo, perfil, admin, chat, dashboard. Nav completo (Nosotros/Contacto), sin emojis, productos cuadrados, footer en home, portada de tienda en mapa.
Migración `supabase/migrations/0005_orders.sql` lista y corregida (schema unificado, idempotente) — **pendiente ejecutar en Supabase**.

## Next
1. **Ejecutar migración** `0005_orders.sql` en https://supabase.com/dashboard/project/yoitmdehvtleqrajbfny/sql/new (abrir con Bloc de notas, copiar todo, pegar y ejecutar).
2. **Probar pago end-to-end**: arrancar `stripe listen --forward-to http://localhost:3000/api/payments/webhook` en terminal separada, añadir producto al carrito, pagar con tarjeta test `4242 4242 4242 4242`.
3. **Stripe Connect** (siguiente fase): onboarding vendedor para que reciban pagos directamente con comisión 8% automática vía `transfer_data`.

## Context
- Servidor: `cd C:\Users\Óscar\Desktop\LocalMarket\apps\web && npm run dev`
- Claves Stripe TEST ya en `.env.local` (sk_test / pk_test / whsec). No tocar.
- Webhook CLI: cada sesión de desarrollo hay que relanzar `stripe listen --forward-to http://localhost:3000/api/payments/webhook`.
- Columnas `users.verified`, `users.cover_url`, `shops.cover_url` ya ejecutadas en Supabase.
- Usuario sin experiencia en programación, habla español. Migraciones SQL: siempre idempotentes (IF NOT EXISTS, DO $$ EXCEPTION).
