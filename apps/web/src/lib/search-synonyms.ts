/**
 * Mapa de expansion semantica: termino de busqueda → categorias relacionadas.
 * Permite que buscar "flores" muestre comercios de la categoria "artesania" o "hogar",
 * y que buscar "floristeria" devuelva directamente la categoria correspondiente.
 */
export const CATEGORY_SYNONYMS: Record<string, string[]> = {
  alimentacion: [
    "comida", "alimentos", "comestibles", "panaderia", "pasteleria",
    "pescaderia", "carniceria", "fruteria", "supermercado", "ultramarinos",
    "bodega", "delicatessen", "charcuteria", "quesos", "vino", "cerveza",
  ],
  moda: [
    "ropa", "zapatos", "calzado", "vestimenta", "boutique", "telas",
    "textil", "complementos", "bolsos", "accesorios", "joyeria fina",
    "bisuteria", "sombrereria", "corseteria", "lenceria",
  ],
  electronica: [
    "tecnologia", "informatica", "moviles", "ordenadores", "tablets",
    "videojuegos", "consolas", "camaras", "audio", "hifi", "robots",
    "drones", "gadgets", "componentes",
  ],
  hogar: [
    "muebles", "decoracion", "jardin", "herramientas", "bricolaje",
    "plantas", "flores", "floristeria", "ferreteria", "cocina", "menaje",
    "textil hogar", "alfombras", "lamparas", "iluminacion", "marcos",
  ],
  artesania: [
    "artesanal", "manualidades", "handmade", "ceramica", "alfareria",
    "vidrio", "madera", "cuero", "cuadros", "pintura", "escultura",
    "joyas artesanas", "bijouterie", "personalizados", "regalos",
  ],
  deportes: [
    "deporte", "fitness", "gimnasio", "running", "ciclismo", "natacion",
    "montanismo", "escalada", "surf", "padel", "tenis", "futbol",
    "nutricion deportiva", "suplementos",
  ],
  belleza: [
    "cosmeticos", "peluqueria", "estetica", "maquillaje", "spa",
    "bienestar", "perfumeria", "cuidado personal", "masajes",
    "unas", "barber", "barberia", "cabello", "piel", "dermocosmetica",
  ],
};

/** Normaliza un string: minusculas, sin tildes, sin caracteres especiales */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

/**
 * Dado un termino de busqueda, devuelve los slugs de categorias relacionadas.
 * Ej: "flores" → ["hogar"] porque "flores" esta en la lista de sinonimos de "hogar"
 */
export function expandToCategories(query: string): string[] {
  const q = normalize(query);
  const matched: string[] = [];

  for (const [categorySlug, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    // Coincidencia directa con el nombre de la categoria
    if (normalize(categorySlug).includes(q) || q.includes(normalize(categorySlug))) {
      matched.push(categorySlug);
      continue;
    }
    // Coincidencia con algun sinonimo
    if (synonyms.some((s) => normalize(s).includes(q) || q.includes(normalize(s)))) {
      matched.push(categorySlug);
    }
  }

  return matched;
}
