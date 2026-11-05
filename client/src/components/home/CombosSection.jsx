// src/components/home/CombosSection.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { formatPrecio } from "@/utils/formatters";
import { API_URL } from "@/config/api";
import {
  Scale,
  ShoppingCart,
  Sparkles,
  Eye,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { ComboDetailModal } from "@/components/modals/ComboDetailModal";

const DEFAULT_COMBO_IMAGE =
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop";

// Fallback inicial con 1 imagen custom de prueba por combo hasta subir las definitivas
export const COMBOS = [
  {
    id: 1,
    nombre: "Combo Asado Parrillero Tradición (5 kg)",
    slug: "combo-asado-parrillero",
    badge: "🔥 Parrilla Tradición",
    tagColor: "bg-red-50 text-valette-red border-red-200/80",
    kilos: 5,
    rinde: "6 a 8 personas",
    ahorro: 5400,
    puntos: 50,
    precio: 37900,
    precio_anterior: 43300,
    imagen_url:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop",
    imagenUrl:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop",
    descripcion:
      "La selección parrillera definitiva con novillito seleccionado, cerdo crocante y chorizo puro cerdo. Todo lo indispensable para lucirse frente a las brasas.",
    items: [
      {
        nombre: "Asado",
        peso: "2 kg",
        descripcion:
          "Costillar de novillito con hueso plano y veteado parejo. Clásico para hacer a la cruz o sobre brasas lentas.",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1791685051/nqtxmos2sbshqtvip3yq.webp",
      },
      {
        nombre: "Pechito de Cerdo",
        peso: "2 kg",
        descripcion:
          "Costillar porcino con abundante manta de carne y hueso fino. Dorado parejo y textura crocante al fuego.",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1788424319/e94tqmvv5ouclrbwh6vr.jpg",
      },
      {
        nombre: "Chorizo",
        peso: "1 kg (6 u.)",
        descripcion:
          "Embutido parrillero fresco elaborado con receta tradicional en tripa natural. Jugoso y especiado en su punto exacto.",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1791685191/qygthxwjvw6t8w4ra4j1.jpg",
      },
    ],
  },
  {
    id: 2,
    nombre: "Combo Familiar Semanal (6 kg)",
    slug: "combo-familiar-semanal",
    badge: "📦 Rinde 20+ Comidas",
    tagColor: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    kilos: 6,
    rinde: "Almuerzos y cenas de la semana",
    ahorro: 6700,
    puntos: 60,
    precio: 52900,
    precio_anterior: 59600,
    imagen_url:
      "https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=1000&auto=format&fit=crop",
    imagenUrl:
      "https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=1000&auto=format&fit=crop",
    descripcion:
      "Paquete completo y versátil para resolver las comidas cotidianas con proteínas magras y cortes rendidores: supremas frescas, roast beef y hamburguesas caseras de pollo.",
    items: [
      {
        nombre: "Supremas",
        peso: "2 kg",
        descripcion:
          "Pechuga de pollo desgrasada y sin piel, 100% pulpa limpia. Proteína magra lista para la plancha o rebozar.",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1791685232/dffz5ux606ealcpkzffz.webp",
      },
      {
        nombre: "Roast Beef",
        peso: "2 kg",
        descripcion:
          "Corte vacuno sabroso con vetas de colágeno que funden en guisos, empanadas al cuchillo o estofados.",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1791685357/caklpusrn5thu9u8kgoi.webp",
      },
      {
        nombre: "Hamburguesas de Pollo",
        peso: "2 kg",
        descripcion:
          "Medallones caseros elaborados con pechuga de pollo magra y hierbas seleccionadas, listos para cocinar.",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1791685476/sb35jibeojseltwvgcd5.webp",
      },
    ],
  },
  {
    id: 3,
    nombre: "Combo Cortes Especiales & Cerdo (5 kg)",
    slug: "combo-cortes-especiales-cerdo",
    badge: "🥩 Selección Gourmet",
    tagColor: "bg-amber-50 text-amber-900 border-amber-200/80",
    kilos: 5,
    rinde: "6 a 8 personas",
    ahorro: 7000,
    puntos: 55,
    precio: 52500,
    precio_anterior: 59500,
    imagen_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000&auto=format&fit=crop",
    imagenUrl:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000&auto=format&fit=crop",
    descripcion:
      "Cortes tiernos y selectos para los amantes del buen comer: bifes anchos con ojo de bife veteado, bondiola jugosa de cerdo y matambre vacuno tierno.",
    items: [
      {
        nombre: "Bife Ancho",
        peso: "2 kg",
        descripcion:
          "Corte vacuno con el clásico ojo central y veteado parrillero. Jugosidad intensa y sellado perfecto a la plancha o a las brasas.",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1791685112/fb7oorariii16nelsew8.webp",
      },
      {
        nombre: "Bondiola",
        peso: "2 kg",
        descripcion:
          "Corte de cerdo premium con grasa intramuscular. Se dora crocante por fuera y queda tierna y jugosa al brasear o en bifes.",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1788422423/nwcd2bvbh1gcfkbehsv5.webp",
      },
      {
        nombre: "Matambre",
        peso: "1 kg",
        descripcion:
          "Corte delgado y tierno entre el cuero y el costillar. Clásico para tiernizar a la pizza, arrollar o hacer a la parrilla.",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1791526373/geg0ezk3acs5xrhd0jmf.webp",
      },
    ],
  },
];

const getTagColor = (badge = "") => {
  if (/parrilla/i.test(badge))
    return "bg-red-50 text-valette-red border-red-200/80";
  if (/familiar|comida|semanal/i.test(badge))
    return "bg-emerald-50 text-emerald-800 border-emerald-200/80";
  if (/gourmet|especial/i.test(badge))
    return "bg-amber-50 text-amber-900 border-amber-200/80";
  return "bg-red-50 text-valette-red border-red-200/80";
};

export const CombosSection = ({ searchQuery = "" }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [combos, setCombos] = useState(COMBOS);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const scrollRef = useRef(null);

  // Cargar combos reales desde la API / PostgreSQL
  useEffect(() => {
    let isMounted = true;
    const fetchCombos = async () => {
      try {
        const res = await fetch(`${API_URL}/combos`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && isMounted) {
            setCombos(data);
          }
        }
      } catch (err) {
        console.warn("Utilizando combos de reserva:", err);
      }
    };

    fetchCombos();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCombos = useMemo(() => {
    if (!searchQuery.trim()) return combos;
    const q = searchQuery.toLowerCase().trim();
    return combos.filter(
      (c) =>
        c.nombre?.toLowerCase().includes(q) ||
        c.descripcion?.toLowerCase().includes(q) ||
        (Array.isArray(c.items) &&
          c.items.some(
            (it) =>
              it.nombre?.toLowerCase().includes(q) ||
              it.categoria?.toLowerCase().includes(q),
          )),
    );
  }, [combos, searchQuery]);

  if (filteredCombos.length === 0) return null;

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 360;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleAddCombo = (combo) => {
    const items = Array.isArray(combo.items) ? combo.items : [];
    const mainImg =
      combo.imagen_url ||
      combo.imagenUrl ||
      items[0]?.imagen_url ||
      items[0]?.imagenUrl ||
      DEFAULT_COMBO_IMAGE;

    addToCart(
      {
        id: `combo-${combo.id}`,
        catalogo_id: items[0]?.catalogo_id || combo.id,
        es_combo: true,
        combo_id: combo.id,
        nombre: combo.nombre,
        slug: combo.slug,
        precio: Number(combo.precio) || 0,
        unidad_medida: "u",
        puntos: Number(combo.puntos) || 50,
        imagen_url: mainImg,
      },
      1,
      {
        corte: "Combo preparado de cortes surtidos",
        envasado: "Envasado con cadena de frío",
        kilos: Number(combo.kilos) || 0,
        items_combo: items
          .map((i) => `${i.cantidad_o_peso || i.peso} de ${i.nombre}`)
          .join(", "),
      },
    );
    showToast(`Sumaste ${combo.nombre} al pedido 🥩`);
  };

  return (
    <section id="seccion-combos" className="scroll-mt-36 md:scroll-mt-32 mb-8">
      {/* Cabecera de Sección con Flechas Desktop */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3 px-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2 mt-4 sm:mt-6">
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              Combos esenciales
            </h2>
            <span className="text-[11px] font-bold ml-auto lg:ml-0 text-valette-red bg-red-50 border border-red-200/80 px-2 py-0.5 rounded-full font-num whitespace-nowrap shadow-2xs">
              {filteredCombos.length} combos
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Paquetes armados para cada gusto y necesidad.
          </p>
        </div>

        {/* Flechas de navegación en Desktop */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            className="size-8 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
            title="Ver anteriores"
            aria-label="Ver anteriores"
          >
            <ChevronLeft className="size-4 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll("right")}
            className="size-8 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
            title="Ver siguientes"
            aria-label="Ver siguientes"
          >
            <ChevronRight className="size-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Contenedor con Scroll Horizontal de Tarjetas de Combos */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1 px-4 sm:px-6 snap-x snap-mandatory scroll-pl-4 scroll-pr-4 sm:scroll-pl-6 sm:scroll-pr-6"
      >
        {filteredCombos.map((combo) => {
          const tagColorClass = combo.tagColor || getTagColor(combo.badge);

          const precio = Number(combo.precio) || 0;
          const precioAnterior =
            Number(combo.precio_anterior) ||
            Number(combo.precioAnterior) ||
            Number(combo.precio_regular_calculado) ||
            precio;

          const comboImg =
            combo.imagen_url || combo.imagenUrl || DEFAULT_COMBO_IMAGE;

          return (
            <article
              key={combo.id}
              onClick={() => setSelectedCombo(combo)}
              className="w-[80vw] sm:w-[350px] md:w-[360px] shrink-0 snap-start last:snap-end bg-white border border-slate-200/90 rounded-2xl p-4 shadow-native flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all group cursor-pointer"
            >
              <div>
                {/* 1. Imagen Única Custom del Combo */}
                <div className="relative w-full rounded-xl overflow-hidden border border-slate-200/90 bg-slate-100 shadow-2xs mb-3.5">
                  {/* Badge flotante de Kilos Totales sobre la foto */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900/85 text-white text-[10px] font-black uppercase tracking-wide shadow-xs flex items-center gap-1 font-num">
                      <Scale className="size-3" />
                      <span>{combo.kilos} kg en total</span>
                    </span>
                  </div>

                  {/* Badge flotante "Ver detalle" en esquina derecha */}
                  <div className="absolute top-2.5 right-2.5 z-10 hidden sm:flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    <span className="px-2 py-0.5 rounded-lg bg-white/90 text-[#003366] text-[10px] font-black uppercase tracking-tight shadow-xs flex items-center gap-1">
                      <Eye className="size-2.5" />
                      <span>Ver detalle</span>
                    </span>
                  </div>

                  <img
                    src={comboImg}
                    alt={combo.nombre}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_COMBO_IMAGE;
                    }}
                    className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* 2. Badges de Ahorro y Puntos */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${tagColorClass}`}
                  >
                    {combo.badge || "🔥 Combo Ahorro"}
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded flex items-center gap-1 font-num">
                    <Sparkles className="size-2.5 text-amber-600" />+
                    {combo.puntos || 50} pts Club
                  </span>
                </div>

                {/* 3. Título y Rinde */}
                <h3 className="text-base font-black text-slate-900 leading-snug group-hover:text-[#003366] transition-colors flex items-center justify-between">
                  <span>{combo.nombre}</span>
                  <ChevronRight className="size-4 text-slate-300 group-hover:text-[#003366] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </h3>
              </div>

              {/* 4. Precios y Botón de Acción en la Base */}
              <footer className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-xl font-black text-slate-900 font-num">
                    {formatPrecio(precio)}
                  </span>
                  {precioAnterior > precio && (
                    <span className="text-[11px] text-slate-400 line-through font-num">
                      {formatPrecio(precioAnterior)}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddCombo(combo);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#003366] hover:bg-valette-dark text-white font-extrabold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-2xs cursor-pointer shrink-0"
                >
                  <ShoppingCart className="size-3.5" />
                  <span>Sumar</span>
                </button>
              </footer>
            </article>
          );
        })}
        {/* Spacer de cierre */}
        <div
          className="shrink-0 w-1 sm:w-3 select-none pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Modal / Bottom Sheet para Visualizar el Combo con foto de cada corte */}
      <ComboDetailModal
        key={selectedCombo?.id || "combo-detail-modal"}
        isOpen={Boolean(selectedCombo)}
        onClose={() => setSelectedCombo(null)}
        combo={selectedCombo}
      />
    </section>
  );
};

export default CombosSection;
