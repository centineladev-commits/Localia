import type { ShopMapPin } from "./types";
import { SHOP_CATEGORY_COLORS } from "./constants";

// ─── Tipos extendidos para demo ───────────────────────────────────────────────

export interface DemoProduct {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  categoryId: string;
  stock: number;
  tags: string[];
}

export interface DemoShop extends ShopMapPin {
  address: string;
  phone: string;
  description: string;
  openingHours: string;
  products: DemoProduct[];
}

// ─── Productos por tienda ─────────────────────────────────────────────────────

const PRODUCTS: Record<string, DemoProduct[]> = {
  "1": [
    {
      id: "p1",
      shopId: "1",
      name: "Pan de masa madre",
      description: "Elaborado con fermentación lenta de 24h. Sin aditivos ni conservantes.",
      price: 4.5,
      images: ["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600"],
      categoryId: "alimentacion",
      stock: 20,
      tags: ["pan", "artesano", "masa madre"],
    },
    {
      id: "p2",
      shopId: "1",
      name: "Croissant de mantequilla",
      description: "Hojaldrado con mantequilla francesa AOP. Horneado cada mañana.",
      price: 2.2,
      images: ["https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600"],
      categoryId: "alimentacion",
      stock: 15,
      tags: ["croissant", "hojaldre", "desayuno"],
    },
    {
      id: "p3",
      shopId: "1",
      name: "Torta de aceite",
      description: "Receta tradicional sevillana con aceite de oliva virgen extra.",
      price: 3.8,
      images: ["https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600"],
      categoryId: "alimentacion",
      stock: 10,
      tags: ["torta", "aceite", "tradicional"],
    },
  ],
  "2": [
    {
      id: "p4",
      shopId: "2",
      name: "Blusa de lino natural",
      description: "100% lino certificado OEKO-TEX. Confección local en Madrid.",
      price: 49.0,
      images: ["https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600"],
      categoryId: "moda",
      stock: 8,
      tags: ["blusa", "lino", "verano"],
    },
    {
      id: "p5",
      shopId: "2",
      name: "Pantalón chino slim",
      description: "Algodón orgánico. Corte slim. Disponible en 4 colores.",
      price: 65.0,
      images: ["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600"],
      categoryId: "moda",
      stock: 12,
      tags: ["pantalon", "chino", "algodón"],
    },
  ],
  "3": [
    {
      id: "p6",
      shopId: "3",
      name: "Auriculares inalámbricos",
      description: "Cancelación de ruido activa. 30h de batería. Garantía 2 años.",
      price: 89.0,
      images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"],
      categoryId: "electronica",
      stock: 5,
      tags: ["auriculares", "bluetooth", "ANC"],
    },
    {
      id: "p7",
      shopId: "3",
      name: "Cable USB-C 2m trenzado",
      description: "Nylon trenzado. Carga rápida 100W. Compatible con todos los dispositivos USB-C.",
      price: 12.5,
      images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"],
      categoryId: "electronica",
      stock: 50,
      tags: ["cable", "USB-C", "carga rápida"],
    },
  ],
  "4": [
    {
      id: "p8",
      shopId: "4",
      name: "Tazón de cerámica artesanal",
      description: "Fabricado a mano en torno alfarero. Esmaltado sin plomo. Apto lavavajillas.",
      price: 28.0,
      images: ["https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600"],
      categoryId: "artesania",
      stock: 7,
      tags: ["ceramica", "tazón", "hecho a mano"],
    },
    {
      id: "p9",
      shopId: "4",
      name: "Jarrón decorativo",
      description: "Pieza única. Arcilla gresificada. Acabado mate. Altura 25cm.",
      price: 55.0,
      images: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600"],
      categoryId: "artesania",
      stock: 3,
      tags: ["jarron", "ceramica", "decoracion"],
    },
  ],
  "5": [
    {
      id: "p10",
      shopId: "5",
      name: "Cesta de temporada (4kg)",
      description: "Frutas y verduras de la temporada actual. Productores locales de la sierra.",
      price: 18.0,
      images: ["https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600"],
      categoryId: "alimentacion",
      stock: 15,
      tags: ["fruta", "verdura", "temporada", "km0"],
    },
    {
      id: "p11",
      shopId: "5",
      name: "Tomates rama (1kg)",
      description: "Tomates de rama recién cortados. De la huerta de Aranjuez.",
      price: 3.2,
      images: ["https://images.unsplash.com/photo-1546094096-0df4bcaad337?w=600"],
      categoryId: "alimentacion",
      stock: 30,
      tags: ["tomate", "fresco", "huerta"],
    },
  ],
  "6": [
    {
      id: "p12",
      shopId: "6",
      name: "Zapatillas running trail",
      description: "Suela Vibram. Amortiguación media. Talla 38-47. Ideales para sendero.",
      price: 119.0,
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"],
      categoryId: "deportes",
      stock: 10,
      tags: ["zapatillas", "running", "trail"],
    },
    {
      id: "p13",
      shopId: "6",
      name: "Mochila trail 20L",
      description: "Hidratación compatible. Espalda transpirable. Peso 650g.",
      price: 79.0,
      images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600"],
      categoryId: "deportes",
      stock: 6,
      tags: ["mochila", "trail", "montaña"],
    },
  ],
};

// ─── Comercios completos ──────────────────────────────────────────────────────

export const DEMO_SHOPS: DemoShop[] = [
  {
    id: "1",
    name: "Panadería García",
    slug: "panaderia-garcia",
    logoUrl: null,
    categoryId: "alimentacion",
    categoryColor: SHOP_CATEGORY_COLORS.alimentacion,
    coordinates: { lat: 40.4168, lng: -3.7038 },
    distanceMeters: 120,
    rating: 4.8,
    isOpen: true,
    address: "Calle Mayor, 12, Madrid",
    phone: "+34 91 123 45 67",
    description: "Panadería artesana de tercera generación. Elaboramos nuestros panes con masa madre de 24 horas y harinas ecológicas de molino tradicional.",
    openingHours: "Lun–Sáb 7:30–14:00 y 17:00–20:30 · Dom 8:00–14:00",
    products: PRODUCTS["1"],
  },
  {
    id: "2",
    name: "Moda Lucía",
    slug: "moda-lucia",
    logoUrl: null,
    categoryId: "moda",
    categoryColor: SHOP_CATEGORY_COLORS.moda,
    coordinates: { lat: 40.4195, lng: -3.701 },
    distanceMeters: 380,
    rating: 4.5,
    isOpen: true,
    address: "Calle Fuencarral, 58, Madrid",
    phone: "+34 91 234 56 78",
    description: "Moda sostenible de diseño local. Trabajamos con tejidos naturales y talleres madrileños. Prendas de temporada confeccionadas a 3km de tu casa.",
    openingHours: "Lun–Vie 10:00–20:30 · Sáb 10:00–21:00 · Dom cerrado",
    products: PRODUCTS["2"],
  },
  {
    id: "3",
    name: "TechZone Madrid",
    slug: "techzone-madrid",
    logoUrl: null,
    categoryId: "electronica",
    categoryColor: SHOP_CATEGORY_COLORS.electronica,
    coordinates: { lat: 40.414, lng: -3.708 },
    distanceMeters: 620,
    rating: 4.2,
    isOpen: false,
    address: "Gran Vía, 34, Madrid",
    phone: "+34 91 345 67 89",
    description: "Accesorios y periféricos de calidad. Especialistas en audio, cables y gadgets. Servicio técnico propio con garantía extendida.",
    openingHours: "Lun–Sáb 10:00–21:00 · Dom 11:00–20:00",
    products: PRODUCTS["3"],
  },
  {
    id: "4",
    name: "Cerámica Artesana",
    slug: "ceramica-artesana",
    logoUrl: null,
    categoryId: "artesania",
    categoryColor: SHOP_CATEGORY_COLORS.artesania,
    coordinates: { lat: 40.421, lng: -3.699 },
    distanceMeters: 850,
    rating: 5.0,
    isOpen: true,
    address: "Calle Arganzuela, 8, Madrid",
    phone: "+34 91 456 78 90",
    description: "Taller y tienda de cerámica hecha a mano. Cada pieza es única, elaborada en torno alfarero por artesanas madrileñas con más de 15 años de experiencia.",
    openingHours: "Mar–Sáb 11:00–20:00 · Dom–Lun cerrado",
    products: PRODUCTS["4"],
  },
  {
    id: "5",
    name: "Frutería El Huerto",
    slug: "fruteria-el-huerto",
    logoUrl: null,
    categoryId: "alimentacion",
    categoryColor: SHOP_CATEGORY_COLORS.alimentacion,
    coordinates: { lat: 40.4155, lng: -3.706 },
    distanceMeters: 200,
    rating: 4.7,
    isOpen: true,
    address: "Mercado de Maravillas, puesto 14, Madrid",
    phone: "+34 91 567 89 01",
    description: "Fruta y verdura km0 directamente de productores de la Comunidad de Madrid. Aranjuez, Alcalá, la sierra. Sin intermediarios.",
    openingHours: "Lun–Sáb 8:00–15:00 · Dom cerrado",
    products: PRODUCTS["5"],
  },
  {
    id: "6",
    name: "Deportes Cumbre",
    slug: "deportes-cumbre",
    logoUrl: null,
    categoryId: "deportes",
    categoryColor: SHOP_CATEGORY_COLORS.deportes,
    coordinates: { lat: 40.418, lng: -3.71 },
    distanceMeters: 450,
    rating: 4.3,
    isOpen: true,
    address: "Calle Alberto Aguilera, 23, Madrid",
    phone: "+34 91 678 90 12",
    description: "Todo para el deporte en la naturaleza. Trail running, senderismo, escalada. Asesoramiento personalizado por deportistas.",
    openingHours: "Lun–Vie 10:00–20:00 · Sáb 10:00–14:00 · Dom cerrado",
    products: PRODUCTS["6"],
  },
];

export function getShopBySlug(slug: string): DemoShop | undefined {
  return DEMO_SHOPS.find((s) => s.slug === slug);
}

export function getProductById(id: string): DemoProduct | undefined {
  return DEMO_SHOPS.flatMap((s) => s.products).find((p) => p.id === id);
}

export function getShopByProductId(productId: string): DemoShop | undefined {
  return DEMO_SHOPS.find((s) => s.products.some((p) => p.id === productId));
}
