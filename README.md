# LocalMarket

Plataforma de compraventa local · Solo productos nuevos · Comercios locales · Mapa interactivo

## Reglas de negocio
1. Sesgo geográfico estricto — solo comercios de la ciudad activa
2. Solo productos nuevos — prohibida la segunda mano
3. B2C Multitienda — vendedores son comercios registrados, no particulares

## Documentación
- [Arquitectura MVP](docs/arquitectura-mvp.md) — Stack, BD, mapa, flujos, hoja de ruta

## Stack
- Frontend: Next.js 15 + React Native (Expo)
- Mapas: Mapbox GL JS
- Backend: Fastify + Drizzle ORM
- BD: PostgreSQL 16 + PostGIS
- Pagos: Stripe Connect
- Hosting: Vercel + Railway + Supabase
