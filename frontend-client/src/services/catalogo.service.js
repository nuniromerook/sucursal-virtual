// src/services/catalogo.service.js

export const CORTES_MOCK = [
  {
    id: 1,
    nombre: "Vacío Especial de Novillito",
    slug: "vacio-especial-novillito",
    categoria: "vacuno",
    categoria_label: "Carne Vacuna",
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
    peso_promedio_pieza: 1.0,
    metodos_coccion: ["Parrilla", "Asador"],
    rinde_personas: "2 a 3 personas x kg",
    opciones_corte: [
      "Tiras Tradicionales (2 dedos)",
      "Tiras Anchas (Parrillero)",
      "Tira Banderita (Fina)",
      "Trozo Entero",
    ],
    promos: [
      {
        id: 12,
        cantidad_kg: 3,
        precio_promocional: 13200,
        activa: true,
      },
    ],
  },
  {
    id: 3,
    nombre: "Bondiola de Cerdo Fresca",
    slug: "bondiola-de-cerdo-fresca",
    categoria: "cerdo",
    categoria_label: "Cerdo Seleccionado",
    precio: 8800,
    precio_anterior: 9500,
    descripcion:
      "Extra jugosa con marmoleo perfecto. Ideal para brasear, desmechar o churrascos a la plancha.",
    descripcion_larga:
      "Bondiola fresca de cerdo de granja. Su infiltración de grasa intramuscular garantiza una terneza suprema al horno envuelta en aluminio o a la parrilla en rodajas gruesas.",
    imagen_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800",
    puntos: 18,
    activo: true,
    sin_stock: false,
    badge: "Venta x Pieza Entera",
    es_pieza_entera: true,
    peso_promedio_pieza: 3,
    peso_min_pieza: 2,
    peso_max_pieza: 4,
    metodos_coccion: ["Horno", "Parrilla", "Disco"],
    rinde_personas: "6 a 7 personas",
    opciones_corte: [
      "Pieza Entera",
      "Churrascos Gruesos (2 cm)",
      "Bifes Finos",
      "Mitad y Mitad",
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
    id: 4,
    nombre: "Matambrito de Cerdo",
    slug: "matambrito-de-cerdo",
    categoria: "cerdo",
    categoria_label: "Cerdo Seleccionado",
    precio: 9000,
    precio_anterior: 9800,
    descripcion:
      "Fino, crocante y dorado a la perfección. El preferido de las picadas y antesalas parrilleras.",
    descripcion_larga:
      "Corte parrillero estrella de cocción rápida. Ideal a la pizza con queso fundido o simplemente al limón con sal entrefina sobre brasas intensas.",
    imagen_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800",
    puntos: 16,
    activo: true,
    sin_stock: false,
    badge: "Crujiente & Jugoso",
    es_pieza_entera: true,
    peso_promedio_pieza: 2,
    peso_min_pieza: 1,
    peso_max_pieza: 2,
    metodos_coccion: ["Parrilla", "Horno", "Plancha"],
    rinde_personas: "3 a 4 personas",
    opciones_corte: [
      "Pieza Entera",
      "Marcado Superficial",
      "Cortado en Tiras",
    ],
    promos: [],
  },
  {
    id: 5,
    nombre: "Pata y Muslo Fresca",
    slug: "pata-y-muslo-fresca",
    categoria: "pollo",
    categoria_label: "Granja & Pollo",
    precio: 3900,
    precio_anterior: 4200,
    descripcion:
      "Pollo fresco de granja, carnoso y tierno. Escala de ahorro progresivo llevando 3 kg o 5 kg.",
    descripcion_larga:
      "Corte económico y rendidor de ave fresca sin congelar. Piel firme y carne jugosa, perfecta para hornear con papas, guisar o hacer a la parrilla.",
    imagen_url:
      "https://images.unsplash.com/photo-1604503468506-a8da13d82791?q=80&w=800",
    puntos: 10,
    activo: true,
    sin_stock: false,
    badge: "Super Ahorro",
    es_pieza_entera: false,
    peso_promedio_pieza: 1.0,
    metodos_coccion: ["Horno", "Parrilla", "Cacerola"],
    rinde_personas: "2 a 3 piezas x kg",
    opciones_corte: [
      "Enteras con piel",
      "Separar Pata de Muslo",
      "Sin piel",
      "Deshuesadas",
    ],
    promos: [
      {
        id: 14,
        cantidad_kg: 3,
        precio_promocional: 3500,
        activa: true,
      },
      {
        id: 15,
        cantidad_kg: 5,
        precio_promocional: 3100,
        activa: true,
      },
    ],
  },
  {
    id: 6,
    nombre: "Pollo Entero de Campo",
    slug: "pollo-entero-de-campo",
    categoria: "pollo",
    categoria_label: "Granja & Pollo",
    precio: 4500,
    precio_anterior: 4800,
    descripcion:
      "Pollo entero limpio y eviscerado. Peso promedio de 2.2 kg a 2.6 kg por unidad.",
    descripcion_larga:
      "Pollo fresco seleccionado de campo. Carne magra y sabrosa, ideal para asar entero al espiedo, al horno con verduras o deshuesar para arrollar.",
    imagen_url:
      "https://images.unsplash.com/photo-1604503468506-a8da13d82791?q=80&w=800",
    puntos: 12,
    activo: true,
    sin_stock: false,
    badge: "Venta x Pieza Entera",
    es_pieza_entera: true,
    peso_promedio_pieza: 2,
    peso_min_pieza: 2,
    peso_max_pieza: 3,
    metodos_coccion: ["Horno", "Parrilla", "Cacerola"],
    rinde_personas: "4 a 5 personas",
    opciones_corte: [
      "Entero eviscerado",
      "Trozado en 8 presas",
      "Abierto para parrilla (Rana)",
      "Sin cogote ni rabadilla",
    ],
    promos: [],
  },
  {
    id: 7,
    nombre: "Milanesas Cortadas de Nalga",
    slug: "milanesas-cortadas-de-nalga",
    categoria: "preparados",
    categoria_label: "Preparados & Listos",
    precio: 16500,
    precio_anterior: 17200,
    descripcion:
      "Bifes finos de nalga de primera calidad, desgrasados y listos para pasar por huevo y pan rallado.",
    descripcion_larga:
      "Corte especial de nalga tierna fraccionado con espesor milimétrico parejo. Sin nervios ni grasa excedente, rinde al máximo en cada fritura o al horno.",
    imagen_url:
      "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?q=80&w=800",
    puntos: 20,
    activo: true,
    sin_stock: false,
    badge: "Listas para Rebozar",
    es_pieza_entera: false,
    peso_promedio_pieza: 1.0,
    metodos_coccion: ["Sartén", "Horno"],
    rinde_personas: "3 a 4 personas x kg",
    opciones_corte: [
      "Espesor Fino (Tradicional)",
      "Espesor Medio",
      "Separadas con film",
    ],
    promos: [
      {
        id: 16,
        cantidad_kg: 3,
        precio_promocional: 15800,
        activa: true,
      },
    ],
  },
  {
    id: 8,
    nombre: "Chorizo Puro Cerdo (Gancho)",
    slug: "chorizo-puro-cerdo-gancho",
    categoria: "embutidos",
    categoria_label: "Embutidos Frescos",
    precio: 6600,
    precio_anterior: 7200,
    descripcion:
      "Elaboración propia con 100% pulpa de cerdo y condimentos naturales seleccionados.",
    descripcion_larga:
      "Chorizo parrillero tradicional en tripa natural. Atado a mano sin aditivos ni harinas añadidas. Punto de grasa balanceado para quedar jugoso sin resultar pesado.",
    imagen_url:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800",
    puntos: 14,
    activo: true,
    sin_stock: false,
    badge: "100% Cerdo",
    es_pieza_entera: false,
    peso_promedio_pieza: 1.0,
    metodos_coccion: ["Parrilla", "Horno"],
    rinde_personas: "Aprox. 7 a 8 chorizos x kg",
    opciones_corte: ["En gancho continuo", "Separados individuales"],
    promos: [
      {
        id: 17,
        cantidad_kg: 3,
        precio_promocional: 6100,
        activa: true,
      },
    ],
  },
  {
    id: 9,
    nombre: "Salchicha Parrillera Fresca",
    slug: "salchicha-parrillera-fresca",
    categoria: "embutidos",
    categoria_label: "Embutidos Frescos",
    precio: 8800,
    precio_anterior: 9400,
    descripcion:
      "Rosca fina de cerdo especiada al estilo criollo. Cocción rápida y crocante.",
    descripcion_larga:
      "Embutido fino en tripa de cordero natural. Su textura delicada y cocción pareja la convierten en la reina de la picada parrillera antes de los cortes principales.",
    imagen_url:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800",
    puntos: 15,
    activo: true,
    sin_stock: false,
    badge: "Rosca Parrillera",
    es_pieza_entera: false,
    peso_promedio_pieza: 1.0,
    metodos_coccion: ["Parrilla", "Plancha"],
    rinde_personas: "4 a 5 porciones x kg",
    opciones_corte: ["En rosca entera", "Cortada en tramos"],
    promos: [],
  },
  {
    id: 10,
    nombre: "Molleja de Corazón",
    slug: "molleja-de-corazon",
    categoria: "achuras",
    categoria_label: "Achuras de Novillito",
    precio: 27000,
    precio_anterior: 28900,
    descripcion:
      "Molleja de corazón seleccionada, blanca, tiernísima y limpia de membranas.",
    descripcion_larga:
      "La achura gourmet por excelencia. Dorada a fuego suave con limón exprimido y sal marina, queda crocante por fuera y con textura aterciopelada por dentro.",
    imagen_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800",
    puntos: 35,
    activo: true,
    sin_stock: false,
    badge: "Corte Gourmet",
    es_pieza_entera: false,
    peso_promedio_pieza: 1.0,
    metodos_coccion: ["Parrilla", "Plancha"],
    rinde_personas: "3 a 4 personas x kg",
    opciones_corte: ["Pieza entera", "Abierta al medio (Mariposa)"],
    promos: [],
  },
  {
    id: 11,
    nombre: "Bife de Chorizo",
    slug: "bife-de-chorizo",
    categoria: "vacuno",
    categoria_label: "Carne Vacuna",
    precio: 19900,
    precio_anterior: 21500,
    descripcion:
      "Corte clásico del lomo ancho con tapa de grasa. Tierno, jugoso y de gran presencia.",
    descripcion_larga:
      "Proveniente de novillito de exportación. Es el emblema de la parrilla porteña: carne magra de fibra corta acompañada por una faja de grasa que se carameliza en el fuego.",
    imagen_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800",
    puntos: 28,
    activo: true,
    sin_stock: false,
    badge: "Corte Premium",
    es_pieza_entera: false,
    peso_promedio_pieza: 1.0,
    metodos_coccion: ["Parrilla", "Plancha", "Hierro"],
    rinde_personas: "2 bifes gruesos x kg aprox.",
    opciones_corte: [
      "Bifes Gruesos (3 cm)",
      "Bifes Medios (2 cm)",
      "Trozo Entero de Barra",
    ],
    promos: [],
  },
  {
    id: 12,
    nombre: "Picada Especial Vacuna",
    slug: "picada-especial-vacuna",
    categoria: "vacuno",
    categoria_label: "Carne Vacuna",
    precio: 12900,
    precio_anterior: 13500,
    descripcion:
      "Picada magra de bola de lomo y roast beef a la vista. $11.500/kg llevando 2 kg.",
    descripcion_larga:
      "Carne picada de primera pasada, molida fresca en el momento. Muy baja en grasa, perfecta para hamburguesas caseras, pastel de papas o empanadas criollas.",
    imagen_url:
      "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?q=80&w=800",
    puntos: 15,
    activo: true,
    sin_stock: false,
    badge: "Ahorro x 2 kg",
    es_pieza_entera: false,
    peso_promedio_pieza: 1.0,
    metodos_coccion: ["Sartén", "Horno", "Cacerola"],
    rinde_personas: "4 porciones x kg",
    opciones_corte: ["Molido Simple", "Molido Doble", "En dos bolsas"],
    promos: [
      {
        id: 18,
        cantidad_kg: 2,
        precio_promocional: 11500,
        activa: true,
      },
    ],
  },
];

/**
 * Obtiene el catálogo de cortes con soporte de fallback
 */
export const getCatalogo = async () => {
  return CORTES_MOCK;
};
