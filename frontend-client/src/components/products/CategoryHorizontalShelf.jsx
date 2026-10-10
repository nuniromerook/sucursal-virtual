// src/components/products/CategoryHorizontalShelf.jsx
import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Configuración oficial de las secciones de categorías con sus títulos y descripciones informativas.
 */
export const CATEGORY_SECTIONS = [
  {
    id: "asado",
    titulo: "🔥 Sector Asado",
    descripcion:
      "Selección de cortes parrilleros clásicos, cerdo y achuras, todo para el fuego.",
    badge: "Parrilla del Domingo",
    filter: (p) =>
      ["vacuno", "cerdo", "embutidos", "achuras"].includes(p.categoria) &&
      (p.metodos_coccion?.includes("Parrilla") ||
        p.metodos_coccion?.includes("Asador") ||
        p.categoria === "embutidos" ||
        p.categoria === "achuras" ||
        p.badge?.toLowerCase().includes("asado") ||
        p.badge?.toLowerCase().includes("parrill") ||
        p.slug?.includes("asado") ||
        p.slug?.includes("vacio")),
  },
  {
    id: "vacuno",
    titulo: "🥩 Vacuno",
    descripcion:
      "Cortes vacunos directos de nuestra hacienda seleccionada, frescos y rendidores.",
    badge: "Novillito Premium",
    filter: (p) => p.categoria === "vacuno",
  },
  {
    id: "cerdo",
    titulo: "🥓 Cerdo",
    descripcion:
      "Todo en Cerdo de genética! Cortes frescos, directo de nuestra producción a tu mesa.",
    badge: "100% Fresco",
    filter: (p) => p.categoria === "cerdo",
  },
  {
    id: "pollo",
    titulo: "🍗 Pollo & Granja 🥚",
    descripcion:
      "Cortes y productos frescos de campo seleccionados por terneza, versatilidad diaria y máximo rinde.",
    badge: "Granja Fresca",
    filter: (p) => p.categoria === "pollo",
  },
  {
    id: "embutidos",
    titulo: "🌭 Embutidos producción propia",
    descripcion:
      "Elaboración diaria con tripa natural y carne fresca pura sin conservantes.",
    badge: "Elaboración Diaria",
    filter: (p) => p.categoria === "embutidos",
  },
  {
    id: "preparados",
    titulo: "🫓 Preparados",
    descripcion:
      "Milanesas, hamburguesas y medallones del día listos para cocinar en pocos minutos.",
    badge: "Listos para Cocinar",
    filter: (p) => p.categoria === "preparados",
  },
  {
    id: "achuras",
    titulo: "Achuras Frescas",
    descripcion:
      "Selección fresca y limpia para abrir el fuego con el auténtico sabor parrillero tradicional.",
    badge: "Sabor Tradición",
    filter: (p) => p.categoria === "achuras",
  },
  {
    id: "almacen",
    titulo: "Almacén Parrillero",
    descripcion:
      "Salsas caseras, condimentos exclusivos y complementos indispensables para tu asado.",
    badge: "Complementos",
    filter: (p) => p.categoria === "almacen",
  },
];

/**
 * Componente contenedor de estantería horizontal para cada categoría.
 */
export const CategoryHorizontalShelf = ({
  title,
  description,
  count,
  badge,
  children,
}) => {
  const scrollRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 340;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="mb-6">
      {/* Header de la Sección */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3 px-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2 mt-4 sm:mt-6">
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              {title}
            </h2>
            {count !== undefined && (
              <span className="text-[11px] font-bold ml-auto lg:ml-0 text-slate-500 bg-white border border-slate-200/80 px-2 py-0.5 rounded-full font-num whitespace-nowrap shadow-2xs">
                {count} {count === 1 ? "producto" : "productos"}
              </span>
            )}
            {badge && (
              <span className="hidden md:inline text-[10px] font-bold text-[#003366] bg-[#003366]/5 px-2 py-0.5 rounded-full border border-[#003366]/10">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 mt-1">{description}</p>
          )}
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

      {/* Div con scroll horizontal con todos los productos de cada categoría */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1 px-4 sm:px-6 snap-x snap-mandatory scroll-pl-4 scroll-pr-4 sm:scroll-pl-6 sm:scroll-pr-6"
      >
        {children}
        {/* Spacer de cierre para garantizar que el último elemento conserve el padding derecho del contenedor */}
        <div
          className="shrink-0 w-1 sm:w-3 select-none pointer-events-none"
          aria-hidden="true"
        />
      </div>
    </section>
  );
};

export default CategoryHorizontalShelf;
