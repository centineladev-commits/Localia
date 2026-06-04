-- ─────────────────────────────────────────────────────────────────────────────
-- LocalMarket — Seed de datos iniciales
-- Ejecutar DESPUÉS de 0001_initial.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── CIUDADES ─────────────────────────────────────────────────────────────────

INSERT INTO cities (id, name, slug, center, zoom_level) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Madrid',    'madrid',    ST_MakePoint(-3.7038,  40.4168)::geography, 13),
  ('11111111-0000-0000-0000-000000000002', 'Barcelona', 'barcelona', ST_MakePoint( 2.1734,  41.3851)::geography, 13),
  ('11111111-0000-0000-0000-000000000003', 'Valencia',  'valencia',  ST_MakePoint(-0.3763,  39.4699)::geography, 13),
  ('11111111-0000-0000-0000-000000000004', 'Sevilla',   'sevilla',   ST_MakePoint(-5.9845,  37.3891)::geography, 13),
  ('11111111-0000-0000-0000-000000000005', 'Bilbao',    'bilbao',    ST_MakePoint(-2.9350,  43.2630)::geography, 13),
  ('11111111-0000-0000-0000-000000000006', 'Málaga',    'malaga',    ST_MakePoint(-4.4214,  36.7213)::geography, 13),
  ('11111111-0000-0000-0000-000000000007', 'Zaragoza',  'zaragoza',  ST_MakePoint(-0.8891,  41.6488)::geography, 13);

-- ── CATEGORÍAS DE COMERCIO ───────────────────────────────────────────────────

INSERT INTO shop_categories (id, name, slug, icon, color) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Alimentación', 'alimentacion', 'utensils',    '#22c55e'),
  ('22222222-0000-0000-0000-000000000002', 'Moda',         'moda',         'shirt',       '#ec4899'),
  ('22222222-0000-0000-0000-000000000003', 'Electrónica',  'electronica',  'smartphone',  '#3b82f6'),
  ('22222222-0000-0000-0000-000000000004', 'Hogar',        'hogar',        'home',        '#f97316'),
  ('22222222-0000-0000-0000-000000000005', 'Artesanía',    'artesania',    'palette',     '#a855f7'),
  ('22222222-0000-0000-0000-000000000006', 'Deportes',     'deportes',     'trophy',      '#eab308'),
  ('22222222-0000-0000-0000-000000000007', 'Belleza',      'belleza',      'sparkles',    '#f43f5e');

-- ── USUARIO DEMO (propietario de las tiendas de prueba) ───────────────────────

INSERT INTO users (id, email, display_name) VALUES
  ('33333333-0000-0000-0000-000000000001', 'demo@localmarket.es', 'Usuario Demo');

-- ── COMERCIOS DEMO EN MADRID ──────────────────────────────────────────────────

INSERT INTO shops (id, owner_user_id, name, slug, description, category_id, city_id, address, location_point, phone, opening_hours, status, active) VALUES
(
  '44444444-0000-0000-0000-000000000001',
  '33333333-0000-0000-0000-000000000001',
  'Panadería García',
  'panaderia-garcia',
  'Panadería artesana de tercera generación. Elaboramos nuestros panes con masa madre de 24 horas y harinas ecológicas de molino tradicional.',
  '22222222-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000001',
  'Calle Mayor, 12, Madrid',
  ST_MakePoint(-3.7038, 40.4168)::geography,
  '+34 91 123 45 67',
  '{"mon":"07:30-14:00,17:00-20:30","tue":"07:30-14:00,17:00-20:30","wed":"07:30-14:00,17:00-20:30","thu":"07:30-14:00,17:00-20:30","fri":"07:30-14:00,17:00-20:30","sat":"07:30-14:00,17:00-20:30","sun":"08:00-14:00"}',
  'verified', true
),
(
  '44444444-0000-0000-0000-000000000002',
  '33333333-0000-0000-0000-000000000001',
  'Moda Lucía',
  'moda-lucia',
  'Moda sostenible de diseño local. Prendas confeccionadas en talleres madrileños con tejidos naturales certificados.',
  '22222222-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000001',
  'Calle Fuencarral, 58, Madrid',
  ST_MakePoint(-3.7010, 40.4195)::geography,
  '+34 91 234 56 78',
  '{"mon":"10:00-20:30","tue":"10:00-20:30","wed":"10:00-20:30","thu":"10:00-20:30","fri":"10:00-20:30","sat":"10:00-21:00","sun":null}',
  'verified', true
),
(
  '44444444-0000-0000-0000-000000000003',
  '33333333-0000-0000-0000-000000000001',
  'TechZone Madrid',
  'techzone-madrid',
  'Accesorios y periféricos de calidad. Especialistas en audio, cables y gadgets. Servicio técnico propio.',
  '22222222-0000-0000-0000-000000000003',
  '11111111-0000-0000-0000-000000000001',
  'Gran Vía, 34, Madrid',
  ST_MakePoint(-3.7080, 40.4140)::geography,
  '+34 91 345 67 89',
  '{"mon":"10:00-21:00","tue":"10:00-21:00","wed":"10:00-21:00","thu":"10:00-21:00","fri":"10:00-21:00","sat":"10:00-21:00","sun":"11:00-20:00"}',
  'verified', true
),
(
  '44444444-0000-0000-0000-000000000004',
  '33333333-0000-0000-0000-000000000001',
  'Cerámica Artesana',
  'ceramica-artesana',
  'Taller y tienda de cerámica hecha a mano. Cada pieza es única, elaborada en torno alfarero por artesanas madrileñas.',
  '22222222-0000-0000-0000-000000000005',
  '11111111-0000-0000-0000-000000000001',
  'Calle Arganzuela, 8, Madrid',
  ST_MakePoint(-3.6990, 40.4210)::geography,
  '+34 91 456 78 90',
  '{"mon":null,"tue":"11:00-20:00","wed":"11:00-20:00","thu":"11:00-20:00","fri":"11:00-20:00","sat":"11:00-20:00","sun":null}',
  'verified', true
),
(
  '44444444-0000-0000-0000-000000000005',
  '33333333-0000-0000-0000-000000000001',
  'Frutería El Huerto',
  'fruteria-el-huerto',
  'Fruta y verdura km0 directamente de productores de la Comunidad de Madrid. Sin intermediarios.',
  '22222222-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000001',
  'Mercado de Maravillas, puesto 14, Madrid',
  ST_MakePoint(-3.7060, 40.4155)::geography,
  '+34 91 567 89 01',
  '{"mon":"08:00-15:00","tue":"08:00-15:00","wed":"08:00-15:00","thu":"08:00-15:00","fri":"08:00-15:00","sat":"08:00-15:00","sun":null}',
  'verified', true
),
(
  '44444444-0000-0000-0000-000000000006',
  '33333333-0000-0000-0000-000000000001',
  'Deportes Cumbre',
  'deportes-cumbre',
  'Todo para el deporte en la naturaleza. Trail running, senderismo, escalada. Asesoramiento personalizado.',
  '22222222-0000-0000-0000-000000000006',
  '11111111-0000-0000-0000-000000000001',
  'Calle Alberto Aguilera, 23, Madrid',
  ST_MakePoint(-3.7100, 40.4180)::geography,
  '+34 91 678 90 12',
  '{"mon":"10:00-20:00","tue":"10:00-20:00","wed":"10:00-20:00","thu":"10:00-20:00","fri":"10:00-20:00","sat":"10:00-14:00","sun":null}',
  'verified', true
);

-- ── PRODUCTOS DEMO ───────────────────────────────────────────────────────────

INSERT INTO products (shop_id, city_id, category_id, name, description, price, stock, images, tags) VALUES
-- Panadería García
('44444444-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001',
 'Pan de masa madre','Fermentación lenta de 24h. Sin aditivos ni conservantes.',4.50,20,
 ARRAY['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600'],ARRAY['pan','artesano','masa madre']),

('44444444-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001',
 'Croissant de mantequilla','Hojaldrado con mantequilla francesa AOP. Horneado cada mañana.',2.20,15,
 ARRAY['https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600'],ARRAY['croissant','desayuno']),

('44444444-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001',
 'Torta de aceite','Receta tradicional sevillana con AOVE.',3.80,10,
 ARRAY['https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600'],ARRAY['torta','aceite','tradicional']),

-- Moda Lucía
('44444444-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000002',
 'Blusa de lino natural','100% lino certificado OEKO-TEX. Confección local en Madrid.',49.00,8,
 ARRAY['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600'],ARRAY['blusa','lino','verano']),

('44444444-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000002',
 'Pantalón chino slim','Algodón orgánico. Corte slim. 4 colores.',65.00,12,
 ARRAY['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600'],ARRAY['pantalon','algodón']),

-- TechZone
('44444444-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000003',
 'Auriculares inalámbricos','Cancelación ruido activa. 30h batería.',89.00,5,
 ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],ARRAY['auriculares','bluetooth','ANC']),

('44444444-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000003',
 'Cable USB-C 2m trenzado','Nylon trenzado. Carga rápida 100W.',12.50,50,
 ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'],ARRAY['cable','USB-C']),

-- Cerámica
('44444444-0000-0000-0000-000000000004','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000005',
 'Tazón artesanal','Hecho a mano en torno. Esmaltado sin plomo.',28.00,7,
 ARRAY['https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600'],ARRAY['ceramica','tazón']),

('44444444-0000-0000-0000-000000000004','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000005',
 'Jarrón decorativo','Pieza única. Arcilla gresificada. 25cm.',55.00,3,
 ARRAY['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600'],ARRAY['jarron','decoracion']),

-- Frutería
('44444444-0000-0000-0000-000000000005','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001',
 'Cesta de temporada 4kg','Frutas y verduras km0 de la sierra.',18.00,15,
 ARRAY['https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600'],ARRAY['fruta','km0','temporada']),

('44444444-0000-0000-0000-000000000005','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001',
 'Tomates rama 1kg','De la huerta de Aranjuez.',3.20,30,
 ARRAY['https://images.unsplash.com/photo-1546094096-0df4bcaad337?w=600'],ARRAY['tomate','fresco']),

-- Deportes
('44444444-0000-0000-0000-000000000006','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000006',
 'Zapatillas trail','Suela Vibram. Talla 38-47.',119.00,10,
 ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],ARRAY['zapatillas','trail']),

('44444444-0000-0000-0000-000000000006','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000006',
 'Mochila trail 20L','Hidratación compatible. 650g.',79.00,6,
 ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'],ARRAY['mochila','trail']);
