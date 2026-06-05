import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

// Leer DATABASE_URL del .env.local (intenta primero URL directa, luego pooler)
const env = readFileSync(join(__dir, '.env.local'), 'utf-8');
const directMatch = env.match(/^#\s*DATABASE_URL_DIRECT=(.+)$/m);
const poolerMatch = env.match(/^DATABASE_URL=(.+)$/m);
const match = directMatch ?? poolerMatch;
if (!match) { console.error('No DATABASE_URL en .env.local'); process.exit(1); }

const { Client } = pg;
const client = new Client({
  connectionString: match[1].trim(),
  ssl: { rejectUnauthorized: false },
});

const seed = `
INSERT INTO shop_categories (id, name, slug, icon, color) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Alimentación', 'alimentacion', 'utensils',   '#22c55e'),
  ('22222222-0000-0000-0000-000000000002', 'Moda',         'moda',         'shirt',      '#ec4899'),
  ('22222222-0000-0000-0000-000000000003', 'Electrónica',  'electronica',  'smartphone', '#3b82f6'),
  ('22222222-0000-0000-0000-000000000004', 'Hogar',        'hogar',        'home',       '#f97316'),
  ('22222222-0000-0000-0000-000000000005', 'Artesanía',    'artesania',    'palette',    '#a855f7'),
  ('22222222-0000-0000-0000-000000000006', 'Deportes',     'deportes',     'trophy',     '#eab308'),
  ('22222222-0000-0000-0000-000000000007', 'Belleza',      'belleza',      'sparkles',   '#f43f5e')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shops (id, owner_user_id, name, slug, description, category_id, city_id, address, location_point, phone, opening_hours, status, active) VALUES
('44444444-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001',
 'Panadería García','panaderia-garcia','Panadería artesana de tercera generación.',
 '22222222-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001',
 'Calle Mayor, 12, Madrid', ST_MakePoint(-3.7038, 40.4168)::geography,
 '+34 91 123 45 67','{"mon":"07:30-14:00","sat":"07:30-14:00","sun":"08:00-14:00"}','verified',true),
('44444444-0000-0000-0000-000000000002','33333333-0000-0000-0000-000000000001',
 'Moda Lucía','moda-lucia','Moda sostenible de diseño local.',
 '22222222-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001',
 'Calle Fuencarral, 58, Madrid', ST_MakePoint(-3.7010, 40.4195)::geography,
 '+34 91 234 56 78','{"mon":"10:00-20:30","sat":"10:00-21:00"}','verified',true),
('44444444-0000-0000-0000-000000000003','33333333-0000-0000-0000-000000000001',
 'TechZone Madrid','techzone-madrid','Accesorios y periféricos de calidad.',
 '22222222-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000001',
 'Gran Vía, 34, Madrid', ST_MakePoint(-3.7080, 40.4140)::geography,
 '+34 91 345 67 89','{"mon":"10:00-21:00","sun":"11:00-20:00"}','verified',true),
('44444444-0000-0000-0000-000000000004','33333333-0000-0000-0000-000000000001',
 'Cerámica Artesana','ceramica-artesana','Taller y tienda de cerámica hecha a mano.',
 '22222222-0000-0000-0000-000000000005','11111111-0000-0000-0000-000000000001',
 'Calle Arganzuela, 8, Madrid', ST_MakePoint(-3.6990, 40.4210)::geography,
 '+34 91 456 78 90','{"tue":"11:00-20:00","sat":"11:00-20:00"}','verified',true),
('44444444-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000001',
 'Frutería El Huerto','fruteria-el-huerto','Fruta y verdura km0 de productores locales.',
 '22222222-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001',
 'Mercado de Maravillas, puesto 14, Madrid', ST_MakePoint(-3.7060, 40.4155)::geography,
 '+34 91 567 89 01','{"mon":"08:00-15:00","sat":"08:00-15:00"}','verified',true),
('44444444-0000-0000-0000-000000000006','33333333-0000-0000-0000-000000000001',
 'Deportes Cumbre','deportes-cumbre','Todo para el deporte en la naturaleza.',
 '22222222-0000-0000-0000-000000000006','11111111-0000-0000-0000-000000000001',
 'Calle Alberto Aguilera, 23, Madrid', ST_MakePoint(-3.7100, 40.4180)::geography,
 '+34 91 678 90 12','{"mon":"10:00-20:00","sat":"10:00-14:00"}','verified',true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (shop_id, city_id, category_id, name, description, price, stock, images, tags) VALUES
('44444444-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001',
 'Pan de masa madre','Fermentación lenta de 24h. Sin aditivos.',4.50,20,
 ARRAY['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600'],ARRAY['pan','masa madre']),
('44444444-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001',
 'Croissant de mantequilla','Mantequilla francesa AOP. Horneado cada mañana.',2.20,15,
 ARRAY['https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600'],ARRAY['croissant','desayuno']),
('44444444-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000002',
 'Blusa de lino natural','100% lino OEKO-TEX. Confección local.',49.00,8,
 ARRAY['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600'],ARRAY['blusa','lino']),
('44444444-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000002',
 'Pantalón chino slim','Algodón orgánico. 4 colores.',65.00,12,
 ARRAY['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600'],ARRAY['pantalon','algodón']),
('44444444-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000003',
 'Auriculares inalámbricos','Cancelación de ruido. 30h batería.',89.00,5,
 ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],ARRAY['auriculares','ANC']),
('44444444-0000-0000-0000-000000000004','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000005',
 'Tazón artesanal','Hecho a mano. Esmaltado sin plomo.',28.00,7,
 ARRAY['https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600'],ARRAY['ceramica','tazón']),
('44444444-0000-0000-0000-000000000005','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001',
 'Cesta de temporada 4kg','Frutas y verduras km0.',18.00,15,
 ARRAY['https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600'],ARRAY['fruta','km0']),
('44444444-0000-0000-0000-000000000006','11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000006',
 'Zapatillas trail','Suela Vibram. Talla 38-47.',119.00,10,
 ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],ARRAY['zapatillas','trail'])
ON CONFLICT DO NOTHING;
`;

try {
  await client.connect();
  console.log('Conectado a Supabase');
  await client.query(seed);
  console.log('✅ Seed ejecutado — comercios y productos insertados');
} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  await client.end();
}
