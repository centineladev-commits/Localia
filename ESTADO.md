# LocalMarket — Estado del Proyecto
**Última actualización:** 2026-06-04

---

## ¿Qué es esto?
Plataforma web de compraventa local con mapa interactivo. Tres reglas inamovibles:
1. Solo ves comercios de **tu ciudad** (sesgo geográfico)
2. Solo productos **nuevos** (prohibida la segunda mano)
3. Solo **comercios registrados** como vendedores (no particulares)

---

## ✅ HECHO

### Infraestructura base
- Monorepo con Turborepo (`apps/web`, `packages/db`, `packages/shared`)
- Next.js 14 + React 18 + Tailwind CSS + TypeScript

### Base de datos (Supabase `yoitmdehvtleqrajbfny`)
- Tablas creadas: `cities`, `users`, `shop_categories`, `shops`, `products`, `orders`, `order_items`, `reviews`
- 7 ciudades insertadas · 7 categorías insertadas · Usuario demo insertado
- **PENDIENTE:** ejecutar `0003_seed_shops.sql` en Supabase SQL Editor para insertar comercios y productos

### App web — Mapa
- Mapa Mapbox GL con pines por categoría y colores
- Filtros flotantes de ciudad y categoría
- Popup mejorado al tocar un pin (rating, estado, botón escaparate)
- Spinner de carga · Centrado automático al cambiar de ciudad

### App web — Flujo de compra
- **Modal de ciudad** con carga real desde `/api/cities`
- **Escaparate** `/tienda/[slug]` con datos reales de Supabase (fallback a demo)
- **Detalle de producto** `/producto/[id]` con UUID y demo
- **Carrito lateral** mejorado con animaciones
- **Checkout** con validación de auth, dirección de entrega, placeholder Stripe

### Autenticación (Supabase Auth)
- Registro y login con email/password
- Header con menú de usuario (avatar, nombre, dropdown)
- Checkout bloqueado hasta login
- AuthProvider inicializa sesión al cargar

### Panel del comercio (`/dashboard/comercio`)
- Sidebar con navegación
- **Resumen:** stats (pedidos, ingresos, productos, rating), pedidos recientes, acciones rápidas
- **Productos:** lista con toggle activo/inactivo, buscador
- **Nuevo producto:** formulario completo (nombre, precio, stock, categoría, imagen, tags) → guarda en Supabase
- **Pedidos:** lista con filtros y avance de estado (Nuevo → Preparando → Listo → Entregado)

### Estética mejorada
- Nuevo logotipo en header · Menú de usuario con dropdown
- Animaciones: slide-in carrito, fade-in páginas, scale-in confirmación
- Fichas de producto con badge "últimas unidades"
- ShopHeader con portada gradiente y badge de categoría
- Popup del mapa con franja de color por categoría

---

## 🔧 PENDIENTE TU ACCIÓN

Ejecutar en [Supabase SQL Editor](https://supabase.com/dashboard/project/yoitmdehvtleqrajbfny/sql/new):

```
Contenido de packages/db/migrations/0003_seed_shops.sql
```

(6 comercios + 8 productos con coordenadas PostGIS)

---

## 📋 PRÓXIMOS PASOS

### 1. ✅ Conectar mapa con BD real — HECHO
### 2. ✅ Auth compradores — HECHO
### 3. ✅ Panel del comercio — HECHO (base funcional)

### 4. Pagos con Stripe Connect ← SIGUIENTE
- Onboarding del comercio (crea cuenta Stripe Express)
- Checkout real con tarjeta
- Webhook `payment_succeeded` → actualizar estado del pedido
- Comisión automática del 8%

### 5. App móvil (Expo React Native)
### 6. Admin panel

---

## Stack
| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Mapas | Mapbox GL JS |
| Estado | Zustand |
| Auth | Supabase Auth ✅ |
| BD | PostgreSQL + PostGIS (Supabase) |
| Storage | Supabase Storage (pendiente) |
| Pagos | Stripe Connect (pendiente) |
| Hosting | Vercel + Supabase |

## Arrancar servidor
```bash
cd C:\Users\Óscar\Desktop\LocalMarket\apps\web
npm run dev   # → http://localhost:3000
```
