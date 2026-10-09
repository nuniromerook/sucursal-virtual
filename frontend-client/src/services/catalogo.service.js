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
      "¡Pura terneza parrillera! Selección de novillito con la grasa justa de cobertura para lograr un cuerito crocante y jugosidad inigualable a fuego lento.",
    imagen_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800",
    puntos: 25,
    activo: true,
    sin_stock: false,
    badge: "🔥 Estrella Parrillera",
    metodos_coccion: ["Parrilla", "Horno", "Asador"],
    rinde_personas: "3 a 4 personas x kg",
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
      "¡El rey del domingo! Costillar seleccionado de novillito con hueso plano, abundante carne entrevarada y sabor parrillero tradicional inconfundible.",
    imagen_url:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800",
    puntos: 20,
    activo: true,
    sin_stock: false,
    badge: "Especial Asado",
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
      "¡Marmoleo y jugosidad suprema! Ojo de bife tierno con su ceja veteada, ideal para sellar vuelta y vuelta a la plancha de hierro o brasas fuertes.",
    imagen_url:
      "https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=800",
    puntos: 25,
    activo: true,
    sin_stock: false,
    badge: "Corte Gourmet",
    metodos_coccion: ["Plancha", "Parrilla", "Disco"],
    rinde_personas: "3 a 4 personas x kg",
    opciones_corte: [
      "Bifes Gruesos (3 cm)",
      "Bifes Medianos (2 cm)",
      "Trozo para Horno",
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
      "¡Sabor profundo que se deshace! Corte delantero magro y versátil de novillito, insuperable para guisados lentos, picar a cuchillo o mechar al horno.",
    imagen_url:
      "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=800",
    puntos: 10,
    activo: true,
    sin_stock: false,
    badge: "Ideal Cocción Lenta",
    metodos_coccion: ["Cacerola", "Horno", "Guiso"],
    rinde_personas: "4 personas x kg",
    opciones_corte: [
      "Trozado para Guiso",
      "Pieza para Horno",
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
    nombre: "Bondiola Fresca de Cerdo",
    slug: "bondiola-cerdo",
    categoria: "cerdo",
    categoria_label: "Cerdo",
    especie: "cerdo",
    precio: 8800,
    precio_anterior: 9800,
    descripcion:
      "¡Dorada y súper tierna! Carne de cerdo con veteado perfecto de grasa interna, sensacional para bifecitos de sartén o brasear con mostaza y miel.",
    imagen_url:
      "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1788422423/nwcd2bvbh1gcfkbehsv5.webp",
    puntos: 20,
    activo: true,
    sin_stock: false,
    badge: "🔥 Súper Tierna",
    metodos_coccion: ["Horno lento", "Parrilla", "Disco"],
    rinde_personas: "4 personas x kg",
    opciones_corte: [
      "Trozo para Horno",
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
      "¡Crocante por fuera y jugoso adentro! Costillitas tiernas de cerdo con manta carnosa y cuero que dora perfecto a las brasas o al horno con limón.",
    imagen_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800",
    puntos: 15,
    activo: true,
    sin_stock: false,
    badge: "🔥 Especial Parrilla",
    metodos_coccion: ["Parrilla", "Horno con limón"],
    rinde_personas: "3 a 4 personas x kg",
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
      "¡Magra, rendidora y económica! Excelente carne de cerdo para milanesas bien suaves, churrasquitos rápidos de sartén o estofados de fin de semana.",
    imagen_url:
      "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?q=80&w=800",
    puntos: 10,
    activo: true,
    sin_stock: false,
    badge: "Súper Rendidor",
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
      "¡El toque crocante para tus recetas! Grasa blanca firme y limpia de cerdo, perfecta para chicharrones dorados caseros o dar sabor a salsas y estofados.",
    imagen_url:
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=800",
    puntos: 5,
    activo: true,
    sin_stock: false,
    badge: "Charcutería",
    metodos_coccion: ["Sartén", "Horno", "Olla"],
    rinde_personas: "Para preparaciones",
    opciones_corte: ["En trozo entero", "En cubos chicos", "Laminado"],
    promos: [],
  },
  {
    id: 3,
    nombre: "Pollo de Campo Fresco",
    slug: "pollo-entero",
    categoria: "pollo",
    categoria_label: "Granja & Pollo",
    especie: "pollo",
    precio: 4500,
    precio_anterior: 4900,
    descripcion:
      "¡Fresco de granja y con sabor auténtico! Pollo de campo con alimentación controlada, carne firme y rendimiento óptimo al horno con papas o a la parrilla.",
    imagen_url:
      "https://images.unsplash.com/photo-1587593810167-a84920ea0781?q=80&w=800",
    puntos: 10,
    activo: true,
    sin_stock: false,
    badge: "Granja Fresca",
    metodos_coccion: ["Horno con papas", "Parrilla mariposa", "Spiedo"],
    rinde_personas: "3 a 4 personas x kg",
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
      "¡100% magras y listas para cocinar! Pechugas frescas limpias a cuchillo sin piel ni grasa sobrante, ideales para milanesas crocantes o salteados express.",
    imagen_url:
      "https://images.unsplash.com/photo-1604503468506-a8da13d82791?q=80&w=800",
    puntos: 15,
    activo: true,
    sin_stock: false,
    badge: "100% Magro",
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
      "¡Elaboración propia sin conservantes! Embutido parrillero fresco con tripa natural y carne 100% cerdo para una explosión de sabor en cada mordisco.",
    imagen_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800",
    puntos: 10,
    activo: true,
    sin_stock: false,
    badge: "100% Cerdo Artesanal",
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
      "¡Sanas, sabrosas y listas para la plancha! Medallones artesanales moldeados con pura pechuga de pollo y finas hierbas para resolver comidas en minutos.",
    imagen_url:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800",
    puntos: 10,
    activo: true,
    sin_stock: false,
    badge: "Elaboración Diaria",
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
    titulo: "Cortes Magros para la Semana",
    subtitulo: "Milanesas, bifes y supremas con descuentos especiales por volumen.",
    imagen_desktop_url:
      "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?q=80&w=3480&auto=format&fit=crop",
    imagen_mobile_url:
      "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?q=80&w=1280&auto=format&fit=crop",
    enlace_url: "/productos?q=milanesas",
    badge_texto: "🥩 SEMANA DE AHORRO",
    badge_color: "dorado",
    boton_texto: "Aprovechar",
    categoria: "vacuno",
    bgClass: "from-slate-900 via-[#003366] to-emerald-950",
    btnClass: "bg-white text-slate-900 hover:bg-slate-100",
  },
  {
    id: 3,
    titulo: "Sumá Puntos Club Valette",
    subtitulo: "Cada compra acumula puntos canjeables por kilos gratis.",
    imagen_desktop_url:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=3480&auto=format&fit=crop",
    imagen_mobile_url:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1280&auto=format&fit=crop",
    enlace_url: "/club-valette",
    badge_texto: "⭐ BENEFICIO EXCLUSIVO",
    badge_color: "dorado",
    boton_texto: "Conocer más",
    categoria: "puntos",
    bgClass: "from-amber-950 via-amber-900 to-slate-950",
    btnClass: "bg-white text-amber-950 hover:bg-slate-100",
  },
];

const CACHE_KEY_CATALOGO = "valette_catalogo_cache";

/**
 * Enriquece un producto proveniente de PostgreSQL con atributos de carnicería por kg.
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

  // Normalizar promociones escalonadas por volumen en kilogramos
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

  // Opciones de corte personalizadas para el cortador de mostrador
  const opcionesCorte =
    mockMatch?.opciones_corte ||
    (especie === "pollo"
      ? ["Fileteado para Milanesas", "Pechugas Enteras", "Trozado para Guiso"]
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
      : ["Parrilla", "Plancha", "Horno"]);

  const rindePersonas =
    mockMatch?.rinde_personas || "3 a 4 personas x kg";

  const badge =
    mockMatch?.badge ||
    (promos.length > 0
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
    imagen_url:
      dbProduct.imagen_url ||
      mockMatch?.imagen_url ||
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800",
    puntos: Number(dbProduct.puntos) || (dbProduct.gana_puntos ? 15 : 10),
    activo: dbProduct.activo !== false,
    sin_stock: Boolean(dbProduct.sin_stock || dbProduct.en_stock === false),
    badge,
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

  // Respaldo de contingencia: caché local o CORTES_MOCK
  try {
    const cached = localStorage.getItem(CACHE_KEY_CATALOGO);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => enrichProduct(item, CORTES_MOCK));
      }
    }
  } catch {}

  return CORTES_MOCK.map((item) => enrichProduct(item, CORTES_MOCK));
};

/**
 * Obtiene los banners publicitarios activos.
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
        return data;
      }
    }
  } catch (err) {
    console.warn("⚠️ [Catalogo Service] Usando banners por defecto:", err.message);
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
