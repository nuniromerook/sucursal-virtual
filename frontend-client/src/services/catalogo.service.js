// src/services/catalogo.service.js
import { API_URL } from "@/config/api";

export const CORTES_MOCK = [
  {
    id: 1,
    nombre: "Vacío Especial de Novillito",
    slug: "vacio-especial-novillito",
    categoria: "vacuno",
    categoria_label: "Carne Vacuna",
    especie: "vacuno",
    precio: 17200,
    precio_anterior: 18500,
    descripcion:
      "Tierno con la grasa de cobertura justa. El corte estrella indiscutido para la parrilla o al horno lento.",
    descripcion_larga:
      "Vacío seleccionado de novillito de primera calidad. Corte de gran terneza y sabor intenso con fina capa de grasa que le aporta jugosidad sin merma excesiva. Ideal para cocción a fuego lento en parrilla o asador.",
    imagen_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800",
    puntos: 25,
    activo: true,
    sin_stock: false,
    badge: "Venta x Pieza Entera",
    es_pieza_entera: true,
    peso_promedio_pieza: 3,
    peso_min_pieza: 2,
    peso_max_pieza: 4,
    metodos_coccion: ["Parrilla", "Horno", "Asador"],
    rinde_personas: "5 a 6 personas",
    opciones_corte: [
      "Trozo Entero",
      "Marcado Parrillero",
      "Bifes Gruesos (2 cm)",
      "Desgrasado especial",
    ],
    promos: [
      {
        id: 11,
        cantidad_kg: 3,
        precio_promocional: 16500,
        activa: true,
      },
    ],
  },
  {
    id: 2,
    nombre: "Asado Criollo de Centro",
    slug: "asado-criollo-centro",
    categoria: "vacuno",
    categoria_label: "Carne Vacuna",
    especie: "vacuno",
    precio: 13900,
    precio_anterior: 14500,
    descripcion:
      "Tiras de costilla con hueso plano y grasa blanca tradicional de frigorífico.",
    descripcion_larga:
      "Costillar central de novillito trozado a cuchillo. Hueso plano bien formado con abundante carne entrevarada. Sabor clásico argentino inconfundible.",
    imagen_url:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800",
    puntos: 20,
    activo: true,
    sin_stock: false,
    badge: "Especial Asado",
    es_pieza_entera: false,
    peso_promedio_pieza: 2,
    peso_min_pieza: 1,
    peso_max_pieza: 5,
    metodos_coccion: ["Parrilla", "Asador"],
    rinde_personas: "2 a 3 personas x kg",
    opciones_corte: [
      "Tiras Tradicionales (4 cm)",
      "Corte Bandera Fino (1.5 cm)",
      "Costillar Entero",
      "Corte Americano",
    ],
    promos: [
      {
        id: 12,
        cantidad_kg: 3,
        precio_promocional: 12900,
        activa: true,
      },
    ],
  },
  {
    id: 6,
    nombre: "Bife Ancho Especial",
    slug: "bife-ancho",
    categoria: "vacuno",
    categoria_label: "Carne Vacuna",
    especie: "vacuno",
    precio: 13700,
    precio_anterior: 15200,
    descripcion:
      "Ojo de bife con su ceja jugosa. Gran terneza y marmoleo perfecto para la plancha o brasas.",
    descripcion_larga:
      "Bife ancho seleccionado con excelente infiltración grasa. Súper tierno y jugoso para sellar a fuego fuerte en hierro o cocinar a la parrilla con sal gruesa.",
    imagen_url:
      "https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=800",
    puntos: 25,
    activo: true,
    sin_stock: false,
    badge: "Corte Gourmet",
    es_pieza_entera: false,
    peso_promedio_pieza: 1,
    metodos_coccion: ["Plancha", "Parrilla", "Disco"],
    rinde_personas: "3 a 4 personas x kg",
    opciones_corte: [
      "Bifes Gruesos (3 cm)",
      "Bifes Medianos (2 cm)",
      "Pieza Entera para Horno",
    ],
    promos: [
      {
        id: 1,
        cantidad_kg: 2,
        precio_promocional: 12800,
        activa: true,
      },
    ],
  },
  {
    id: 7,
    nombre: "Roast Beef Premium",
    slug: "roast-beef",
    categoria: "vacuno",
    categoria_label: "Carne Vacuna",
    especie: "vacuno",
    precio: 14400,
    precio_anterior: 15500,
    descripcion:
      "Corte sabroso con el punto justo de grasa. Ideal para estofados, carne picada especial o mechado al horno.",
    descripcion_larga:
      "Corte delantero de novillito muy versátil y de profundo sabor a carne. Excelente para cocciones lentas donde se desarma con el tenedor o para picar a cuchillo.",
    imagen_url:
      "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=800",
    puntos: 10,
    activo: true,
    sin_stock: false,
    badge: "Ideal Cocción Lenta",
    es_pieza_entera: false,
    peso_promedio_pieza: 1,
    metodos_coccion: ["Cacerola", "Horno", "Guiso"],
    rinde_personas: "4 personas x kg",
    opciones_corte: [
      "Trozado para Guiso",
      "Pieza Entera para Horno",
      "Bifes para Plancha",
    ],
    promos: [
      {
        id: 2,
        cantidad_kg: 2,
        precio_promocional: 13500,
        activa: true,
      },
    ],
  },
  {
    id: 8,
    nombre: "Bondiola de Cerdo Entera",
    slug: "bondiola-cerdo",
    categoria: "cerdo",
    categoria_label: "Cerdo",
    especie: "cerdo",
    precio: 8800,
    precio_anterior: 9800,
    descripcion:
      "Pieza entera seleccionada de 2.5 a 3 kg. Marmoleo jugoso para cocción lenta a la mostaza o a las brasas.",
    descripcion_larga:
      "Bondiola fresca entera de cerdo con veteado perfecto de grasa interna. Ideal para brasear en cerveza negra o mostaza y miel durante horas hasta desmechar.",
    imagen_url:
      "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1788422423/nwcd2bvbh1gcfkbehsv5.webp",
    puntos: 20,
    activo: true,
    sin_stock: false,
    badge: "Venta x Pieza Entera (2.5 a 3 kg)",
    es_pieza_entera: true,
    peso_promedio_pieza: 3,
    peso_min_pieza: 2,
    peso_max_pieza: 4,
    metodos_coccion: ["Horno lento", "Parrilla", "Disco"],
    rinde_personas: "6 a 8 personas",
    opciones_corte: [
      "Pieza Entera",
      "Churrascos Gruesos (2 cm)",
      "Marcada al medio",
    ],
    promos: [
      {
        id: 13,
        cantidad_kg: 3,
        precio_promocional: 8200,
        activa: true,
      },
    ],
  },
  {
    id: 12,
    nombre: "Pechito de Cerdo con Manta",
    slug: "pechito-de-cerdo",
    categoria: "cerdo",
    categoria_label: "Cerdo",
    especie: "cerdo",
    precio: 7900,
    precio_anterior: 8900,
    descripcion:
      "Costillitas de cerdo con manta carnosa. Crujiente por fuera y súper tierno por dentro.",
    descripcion_larga:
      "Costillar de cerdo completo con capa de manta carnosa y cuero fino crocante. El compañero imprescindible de cualquier asado dominical.",
    imagen_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800",
    puntos: 15,
    activo: true,
    sin_stock: false,
    badge: "Venta x Pieza Entera",
    es_pieza_entera: true,
    peso_promedio_pieza: 3,
    peso_min_pieza: 2,
    peso_max_pieza: 4,
    metodos_coccion: ["Parrilla", "Horno con limón"],
    rinde_personas: "4 a 5 personas",
    opciones_corte: [
      "Manta Entera",
      "Trozado al medio",
      "Tiras tipo ribs",
    ],
    promos: [
      {
        id: 14,
        cantidad_kg: 3,
        precio_promocional: 7400,
        activa: true,
      },
    ],
  },
  {
    id: 10,
    nombre: "Paleta de Cerdo Fresca",
    slug: "paleta-de-cerdo",
    categoria: "cerdo",
    categoria_label: "Cerdo",
    especie: "cerdo",
    precio: 4900,
    precio_anterior: 5500,
    descripcion:
      "Carne magra y rendidora de cerdo. Excelente relación precio-calidad para milanesas o al horno.",
    descripcion_larga:
      "Paleta fresca deshuesada o trozada. Ideal para milanesas bien tiernas, churrasquitos rápidos de sartén o estofados rendidores de fin de semana.",
    imagen_url:
      "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?q=80&w=800",
    puntos: 10,
    activo: true,
    sin_stock: false,
    badge: "Súper Económico",
    es_pieza_entera: false,
    peso_promedio_pieza: 1,
    metodos_coccion: ["Horno", "Plancha", "Milanesas"],
    rinde_personas: "4 personas x kg",
    opciones_corte: [
      "Fileteado para Milanesas",
      "Churrasquitos",
      "Trozado para Guiso",
    ],
    promos: [],
  },
  {
    id: 5,
    nombre: "Tocino de Cerdo Seleccionado",
    slug: "tocino",
    categoria: "cerdo",
    categoria_label: "Cerdo",
    especie: "cerdo",
    precio: 1500,
    precio_anterior: 1800,
    descripcion:
      "Grasa blanca firme de cerdo para preparaciones, chicharrones o enriquecer picadas y embutidos.",
    descripcion_larga:
      "Tocino fresco limpio sin impurezas. Ideal para aromatizar guisados, preparar chicharrones crujientes caseros o mezclar en embutidos artesanales.",
    imagen_url:
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=800",
    puntos: 5,
    activo: true,
    sin_stock: false,
    badge: "Charcutería",
    es_pieza_entera: false,
    peso_promedio_pieza: 1,
    metodos_coccion: ["Sartén", "Horno", "Olla"],
    rinde_personas: "Para preparaciones",
    opciones_corte: ["En trozo entero", "En cubos chicos", "Laminado"],
    promos: [],
  },
  {
    id: 3,
    nombre: "Pollo de Campo Entero",
    slug: "pollo-entero",
    categoria: "pollo",
    categoria_label: "Granja & Pollo",
    especie: "pollo",
    precio: 4500,
    precio_anterior: 4900,
    descripcion:
      "Pollo fresco eviscerado de 2 a 2.5 kg. Piel limpia, carne firme y rendimiento óptimo.",
    descripcion_larga:
      "Pollo de granja fresco seleccionado. Criado con alimentación controlada sin hormonas agregadas. Ideal para hacer al spiedo, a la parrilla abierto tipo mariposa o al horno con papas.",
    imagen_url:
      "https://images.unsplash.com/photo-1587593810167-a84920ea0781?q=80&w=800",
    puntos: 10,
    activo: true,
    sin_stock: false,
    badge: "Venta x Unidad Entera",
    es_pieza_entera: true,
    peso_promedio_pieza: 2,
    peso_min_pieza: 2,
    peso_max_pieza: 3,
    metodos_coccion: ["Horno con papas", "Parrilla mariposa", "Spiedo"],
    rinde_personas: "4 a 5 personas",
    opciones_corte: [
      "Entero Eviscerado",
      "Abierto Tipo Mariposa (para parrilla)",
      "Trozado en 8 presas",
      "Supremas y Pata Muslo separadas",
    ],
    promos: [
      {
        id: 15,
        cantidad_kg: 2,
        precio_promocional: 4200,
        activa: true,
      },
    ],
  },
  {
    id: 11,
    nombre: "Supremas de Pollo Fileteadas",
    slug: "supremas-de-pollo",
    categoria: "pollo",
    categoria_label: "Granja & Pollo",
    especie: "pollo",
    precio: 8900,
    precio_anterior: 9600,
    descripcion:
      "Pechugas deshuesadas limpias sin piel ni grasa. 100% magras para milanesas o plancha.",
    descripcion_larga:
      "Pechugas enteras de pollo seleccionadas y desgrasadas a cuchillo. La mejor opción saludable y rendidora para tus comidas de la semana.",
    imagen_url:
      "https://images.unsplash.com/photo-1604503468506-a8da13d82791?q=80&w=800",
    puntos: 15,
    activo: true,
    sin_stock: false,
    badge: "100% Magro",
    es_pieza_entera: false,
    peso_promedio_pieza: 1,
    metodos_coccion: ["Plancha", "Horno", "Milanesas"],
    rinde_personas: "4 personas x kg",
    opciones_corte: [
      "Fileteadas para Milanesas",
      "Pechugas Enteras",
      "Cortadas en cubos (wok / brochette)",
    ],
    promos: [
      {
        id: 16,
        cantidad_kg: 2,
        precio_promocional: 8400,
        activa: true,
      },
    ],
  },
  {
    id: 9,
    nombre: "Chorizo Artesanal Puro Cerdo",
    slug: "chorizo-artesanal",
    categoria: "embutidos",
    categoria_label: "Embutidos Artesanales",
    especie: "cerdo",
    precio: 1700,
    precio_anterior: 2100,
    descripcion:
      "Elaboración diaria con tripa natural y carne 100% cerdo. Sin exceso de grasa ni conservantes.",
    descripcion_larga:
      "Chorizo parrillero tradicional bombón preparado a diario en la carnicería. Mezcla balanceada con especias tradicionales para un sabor auténtico parrillero.",
    imagen_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800",
    puntos: 10,
    activo: true,
    sin_stock: false,
    badge: "100% Cerdo Artesanal",
    es_pieza_entera: false,
    peso_promedio_pieza: 1,
    metodos_coccion: ["Parrilla", "Horno", "Pomorola"],
    rinde_personas: "6 unidades x kg",
    opciones_corte: [
      "En ristra tradicional",
      "Separados individuales",
      "Tipo Bombón pequeño",
    ],
    promos: [
      {
        id: 3,
        cantidad_kg: 5,
        precio_promocional: 1600,
        activa: true,
      },
    ],
  },
  {
    id: 4,
    nombre: "Hamburguesas Caseras de Pollo",
    slug: "hamburguesas-de-pollo",
    categoria: "preparados",
    categoria_label: "Preparados Caseros",
    especie: "pollo",
    precio: 6500,
    precio_anterior: 7200,
    descripcion:
      "Medallones de pura suprema de pollo con finas hierbas. Sanas, tiernas y listas para cocinar.",
    descripcion_larga:
      "Hamburguesas artesanales moldeadas con carne magra de pechuga fresca y condimentos suaves. Rápida cocción a la plancha sin necesidad de agregar aceite.",
    imagen_url:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800",
    puntos: 10,
    activo: true,
    sin_stock: false,
    badge: "Elaboración Diaria",
    es_pieza_entera: false,
    peso_promedio_pieza: 1,
    metodos_coccion: ["Plancha", "Horno", "Sartén"],
    rinde_personas: "8 unidades x kg aprox.",
    opciones_corte: ["En bandeja con separadores", "Congeladas IQF"],
    promos: [],
  },
];

export const DEFAULT_BANNERS = [
  {
    id: 1,
    titulo: "¡Promo Asado Fin de Semana!",
    subtitulo: "Llevando 3 kg o más congelás precio promocional exclusivo.",
    imagen_desktop_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=3480&auto=format&fit=crop",
    imagen_mobile_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1280&auto=format&fit=crop",
    enlace_url: "/productos?q=asado",
    badge_texto: "🔥 OFERTA EXCLUSIVA WEB",
    badge_color: "rojo",
    boton_texto: "Ver promo",
    categoria: "asado",
    bgClass: "from-[#002244] via-[#003366] to-slate-900",
    btnClass: "bg-white text-[#003366] hover:bg-slate-100",
  },
  {
    id: 2,
    titulo: "Cortes Seleccionados - 100% Calidad Premium",
    subtitulo: "Carne vacuna de pastura seleccionada con trazabilidad garantizada.",
    imagen_desktop_url:
      "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=3480&auto=format&fit=crop",
    imagen_mobile_url:
      "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=1280&auto=format&fit=crop",
    enlace_url: "/vacuno",
    badge_texto: "🥩 CORTES BOVINOS",
    badge_color: "azul",
    boton_texto: "Explorar Cortes",
    categoria: "vacuno",
    bgClass: "from-slate-950 via-slate-900 to-[#002244]",
    btnClass: "bg-amber-400 text-slate-950 hover:bg-amber-300",
  },
  {
    id: 3,
    titulo: "Club Valette: Acumulá puntos y canjeá descuentos",
    subtitulo: "Sumá puntos con cada pedido y ganá cortes gratis y bonificaciones.",
    imagen_desktop_url:
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=3480&auto=format&fit=crop",
    imagen_mobile_url:
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=1280&auto=format&fit=crop",
    enlace_url: "/productos",
    badge_texto: "✨ CLUB VALETTE",
    badge_color: "negro",
    boton_texto: "Sumarme ahora",
    categoria: "puntos",
    bgClass: "from-amber-950 via-amber-900 to-slate-950",
    btnClass: "bg-white text-amber-950 hover:bg-slate-100",
  },
];

const CACHE_KEY_CATALOGO = "valette_catalogo_cache";

/**
 * Enriquece un producto proveniente de PostgreSQL con atributos de carnicería premium de 1.0.
 */
export const enrichProduct = (dbProduct, mockReferenceList = CORTES_MOCK) => {
  if (!dbProduct) return null;

  const slug = dbProduct.slug || "";
  const id = Number(dbProduct.id);

  // Buscar coincidencia en referencia por slug, ID o coincidencia de nombre
  const mockMatch = mockReferenceList.find(
    (m) =>
      m.slug === slug ||
      m.id === id ||
      (m.nombre &&
        dbProduct.nombre_producto &&
        m.nombre.toLowerCase().includes(dbProduct.nombre_producto.toLowerCase()))
  );

  const nombre = dbProduct.nombre_producto || dbProduct.nombre || "Corte Valette";
  const categoria = (dbProduct.categoria || dbProduct.especie || "vacuno").toLowerCase();
  const especie = (dbProduct.especie || dbProduct.categoria || "vacuno").toLowerCase();
  const precio = Number(dbProduct.precio) || 0;
  const precioAnterior = Number(dbProduct.precio_anterior || 0);

  // Normalizar promociones escalonadas por volumen
  const promos = Array.isArray(dbProduct.promos)
    ? dbProduct.promos
        .map((p) => ({
          id: p.id,
          cantidad_kg: Number(p.cantidad_kg) || 2,
          precio_promocional: Number(p.precio_promocional) || precio,
          activa: p.activa !== false,
        }))
        .filter((p) => p.activa)
    : mockMatch?.promos || [];

  // Mapear etiquetas de categoría amigables
  const categoriaLabel =
    categoria === "vacuno"
      ? "Carne Vacuna"
      : categoria === "cerdo"
      ? "Cerdo"
      : categoria === "pollo"
      ? "Granja & Pollo"
      : categoria === "embutidos"
      ? "Embutidos Artesanales"
      : categoria === "preparados"
      ? "Preparados Caseros"
      : "Cortes Seleccionados";

  // Determinar si es pieza entera (Bondiola, Pollo Entero, Vacío, Pechito de Cerdo)
  const isPiezaEntera =
    mockMatch?.es_pieza_entera ??
    (slug.includes("bondiola") ||
      slug.includes("pollo-entero") ||
      slug.includes("pechito") ||
      slug.includes("vacio") ||
      nombre.toLowerCase().includes("pieza entera"));

  const pesoPromedioPieza =
    mockMatch?.peso_promedio_pieza ??
    (slug.includes("bondiola")
      ? 3
      : slug.includes("pollo-entero")
      ? 2
      : slug.includes("pechito")
      ? 3
      : 1);

  // Opciones de corte personalizadas para el carnicero
  const opcionesCorte =
    mockMatch?.opciones_corte ||
    (isPiezaEntera
      ? ["Pieza Entera", "Marcada al medio", "Desgrasado especial"]
      : especie === "pollo"
      ? ["Fileteado para Milanesas", "Piezas Enteras", "Trozado para Guiso"]
      : especie === "cerdo"
      ? ["Corte Tradicional", "Churrascos Gruesos", "Trozado para Horno"]
      : [
          "Corte Tradicional",
          "Bifes Gruesos (2 cm)",
          "Bifes Medianos (1.5 cm)",
          "Trozado para Horno / Guiso",
        ]);

  const metodosCoccion =
    mockMatch?.metodos_coccion ||
    (especie === "pollo"
      ? ["Horno", "Plancha", "Milanesas"]
      : isPiezaEntera
      ? ["Parrilla", "Horno lento", "Asador"]
      : ["Parrilla", "Plancha", "Horno"]);

  const rindePersonas =
    mockMatch?.rinde_personas ||
    (isPiezaEntera ? "5 a 6 personas" : "3 a 4 personas x kg");

  const badge =
    mockMatch?.badge ||
    (isPiezaEntera
      ? "Venta x Pieza Entera"
      : promos.length > 0
      ? `Ahorro x ${promos[0].cantidad_kg} kg`
      : null);

  return {
    id,
    nombre,
    nombre_producto: nombre,
    slug: slug || `corte-${id}`,
    categoria,
    categoria_label: categoriaLabel,
    especie,
    precio,
    precio_anterior: precioAnterior,
    descripcion: dbProduct.descripcion || mockMatch?.descripcion || "",
    descripcion_larga:
      mockMatch?.descripcion_larga || dbProduct.descripcion || "",
    imagen_url:
      dbProduct.imagen_url ||
      mockMatch?.imagen_url ||
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800",
    puntos: Number(dbProduct.puntos) || (dbProduct.gana_puntos ? 15 : 10),
    activo: dbProduct.activo !== false,
    sin_stock: Boolean(dbProduct.sin_stock || dbProduct.en_stock === false),
    badge,
    es_pieza_entera: isPiezaEntera,
    peso_promedio_pieza: pesoPromedioPieza,
    peso_min_pieza: mockMatch?.peso_min_pieza || (isPiezaEntera ? 2 : 1),
    peso_max_pieza: mockMatch?.peso_max_pieza || (isPiezaEntera ? 4 : 5),
    metodos_coccion: metodosCoccion,
    rinde_personas: rindePersonas,
    opciones_corte: opcionesCorte,
    promos,
  };
};

/**
 * Obtiene el catálogo oficial de la API de producción en PostgreSQL.
 * Cuenta con resiliencia total: si el servidor falla o no hay conexión, usa caché local y CORTES_MOCK.
 */
export const fetchCatalogo = async () => {
  try {
    const res = await fetch(`${API_URL}/catalogo`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status} al consultar catálogo`);
    }

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const enriched = data.map((item) => enrichProduct(item, CORTES_MOCK));
      try {
        localStorage.setItem(CACHE_KEY_CATALOGO, JSON.stringify(enriched));
      } catch {}
      return enriched;
    }
  } catch (err) {
    console.warn("⚠️ [Catalogo Service] Usando respaldo offline:", err.message);
  }

  // Intentar leer de caché local previo
  try {
    const cached = localStorage.getItem(CACHE_KEY_CATALOGO);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  // Fallback garantizado a CORTES_MOCK
  return CORTES_MOCK;
};

/**
 * Obtiene los banners publicitarios activos de la API en PostgreSQL.
 */
export const fetchBanners = async () => {
  try {
    const res = await fetch(`${API_URL}/banners`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((b, idx) => ({
          id: b.id,
          titulo: b.titulo || "Abastecedora Valette",
          subtitulo: b.subtitulo || "Calidad y terneza garantizada",
          imagen_desktop_url: b.imagen_desktop_url || b.imagen_mobile_url,
          imagen_mobile_url: b.imagen_mobile_url || b.imagen_desktop_url,
          imagenUrl: b.imagen_desktop_url || b.imagen_mobile_url,
          enlace_url: b.enlace_url || "/productos",
          badge_texto: b.badge_texto || "OFERTA VALETTE",
          badge_color: b.badge_color || "rojo",
          boton_texto: b.boton_texto || "Ver promo",
          bgClass:
            idx % 3 === 0
              ? "from-[#002244] via-[#003366] to-slate-900"
              : idx % 3 === 1
              ? "from-slate-950 via-slate-900 to-[#002244]"
              : "from-amber-950 via-amber-900 to-slate-950",
          btnClass:
            idx % 2 === 0
              ? "bg-white text-[#003366] hover:bg-slate-100"
              : "bg-amber-400 text-slate-950 hover:bg-amber-300",
        }));
      }
    }
  } catch (err) {
    console.warn("⚠️ [Banners Service] Usando banners por defecto:", err.message);
  }

  return DEFAULT_BANNERS;
};

/**
 * Obtiene las sucursales físicas oficiales con horarios desde PostgreSQL.
 */
export const fetchSucursales = async () => {
  try {
    const res = await fetch(`${API_URL}/sucursales`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((s) => ({
          id: s.id,
          nombre: s.nombre,
          slug: s.slug || `sucursal-${s.id}`,
          ciudad: s.ciudad || s.nombre,
          direccion: s.direccion,
          horario: s.horario_atencion || "Lun a Sáb 07:00 a 15:00 hs",
          telefono: s.telefono || "1135534033",
          activa: s.activa !== false,
          latitud: s.latitud ? parseFloat(s.latitud) : null,
          longitud: s.longitud ? parseFloat(s.longitud) : null,
          horarios_apertura: s.horarios_apertura || null,
        }));
      }
    }
  } catch (err) {
    console.warn("⚠️ [Sucursales Service] Usando sucursales por defecto:", err.message);
  }

  return null;
};

/**
 * Compatibilidad hacia atrás
 */
export const getCatalogo = fetchCatalogo;
