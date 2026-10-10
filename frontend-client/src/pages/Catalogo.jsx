// src/pages/Catalogo.jsx
import React, { useState, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Scale,
  ShoppingCart,
  Sparkles,
  Eye,
} from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";
import { useCatalogo } from "@/context/CatalogoContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { formatPrecio } from "@/utils/formatters";
import { COMBOS } from "@/components/home/CombosSection";
import { ComboDetailModal } from "@/components/modals/ComboDetailModal";

/**
 * Configuración oficial de las secciones de categorías con sus títulos y descripciones informativas.
 * Arquitectura modular preparada para sumar fácilmente secciones futuras tipo
 * "Según tus favoritos", "Según tus últimas compras", etc.
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
 * Renderiza:
 * - Título de la sección
 * - Descripción
 * - Div con scroll horizontal nativo y botones de control
 */
const CategoryHorizontalShelf = ({
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
    <section className="mb-4">
      {/* Header de la Sección */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3.5 px-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2 mt-10">
            <h2 className="text-xl font-black text-slate-900 leading-5.5">
              {title}
            </h2>
            {count !== undefined && (
              <span className="text-[11px] font-bold ml-auto lg:ml-0 text-slate-500 bg-white border border-slate-200/80 px-2 py-0.5 rounded-full font-num whitespace-nowrap">
                {count} {count === 1 ? "producto" : "productos"}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-slate-600 mt-0.5">{description}</p>
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
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-6 pt-4 px-4 sm:px-6 snap-x snap-mandatory scroll-pl-4 scroll-pr-4 sm:scroll-pl-6 sm:scroll-pr-6"
      >
        {children}
        {/* Spacer de cierre para garantizar que el último elemento conserve el padding derecho del contenedor */}
        <div
          className="shrink-0 w-0.5 sm:w-2 select-none pointer-events-none"
          aria-hidden="true"
        />
      </div>
    </section>
  );
};

/**
 * Estantería horizontal especializada para Combos de Frigorífico
 */
const CombosShelf = ({ searchQuery }) => {
  const [selectedCombo, setSelectedCombo] = useState(null);
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const filteredCombos = useMemo(() => {
    if (!searchQuery.trim()) return COMBOS;
    const q = searchQuery.toLowerCase().trim();
    return COMBOS.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.descripcion.toLowerCase().includes(q) ||
        c.items.some((it) => it.nombre.toLowerCase().includes(q)),
    );
  }, [searchQuery]);

  if (filteredCombos.length === 0) return null;

  const handleAddCombo = (combo) => {
    addToCart(
      {
        id: combo.id,
        nombre: combo.nombre,
        slug: combo.slug,
        precio: combo.precio,
        puntos: combo.puntos,
        imagen_url: combo.items[0]?.imagenUrl,
      },
      1,
      {
        corte: "Combo cerrado de frigorífico",
        items_combo: combo.items
          .map((i) => `${i.peso} ${i.nombre}`)
          .join(" + "),
        unidad_medida: "u",
      },
    );
    showToast(`Sumaste el ${combo.nombre} al pedido 🥩`);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {filteredCombos.map((combo) => {
          const totalCortes = combo.items.length;
          const extraCortes = Math.max(0, totalCortes - 2);

          return (
            <div key={combo.id} className="w-full shrink-0 flex flex-col">
              <div
                onClick={() => setSelectedCombo(combo)}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-native flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all group cursor-pointer h-full"
              >
                <div>
                  {/* Tira de 3 miniaturas */}
                  <div className="relative w-full rounded-xl overflow-hidden border border-slate-200/90 bg-slate-100 shadow-2xs mb-3.5">
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900/85 text-white text-[10px] font-black uppercase tracking-wide shadow-xs flex items-center gap-1">
                        <Scale className="size-3" />
                        <span>{combo.kilos} kg en total</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 w-full aspect-16/7 divide-x divide-white/80">
                      <div className="relative h-full w-full overflow-hidden">
                        <img
                          src={combo.items[0]?.imagenUrl}
                          alt={combo.items[0]?.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="relative h-full w-full overflow-hidden">
                        <img
                          src={combo.items[1]?.imagenUrl}
                          alt={combo.items[1]?.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="relative h-full w-full overflow-hidden">
                        <img
                          src={combo.items[2]?.imagenUrl}
                          alt={combo.items[2]?.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {totalCortes > 3 && (
                          <div className="absolute inset-0 bg-slate-950/75 flex flex-col items-center justify-center text-white transition-opacity group-hover:bg-slate-950/70 p-1 text-center">
                            <span className="text-base font-black leading-none drop-shadow-sm font-num">
                              +{extraCortes}
                            </span>
                            <span className="text-[9px] font-extrabold uppercase tracking-tight text-slate-200 mt-0.5">
                              cortes
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badges de Ahorro y Puntos */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${combo.tagColor}`}
                    >
                      {combo.badge}
                    </span>
                    <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded flex items-center gap-1 font-num">
                      <Sparkles className="size-2.5 text-amber-600" />+
                      {combo.puntos} pts Club
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 leading-snug group-hover:text-[#003366] transition-colors flex items-center justify-between">
                    <span>{combo.nombre}</span>
                    <ChevronRight className="size-4 text-slate-300 group-hover:text-[#003366] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Rinde estimado: {combo.rinde}
                  </p>

                  {/* Desglose de cortes del combo */}
                  <div className="my-3 space-y-1 w-full">
                    {combo.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px]"
                      >
                        <span className="font-semibold text-slate-800 truncate">
                          {item.nombre}
                        </span>
                        <span className="font-black text-[#003366] text-[10px] bg-white px-1.5 py-0.2 rounded border border-slate-200 shrink-0 ml-2 font-num">
                          {item.peso}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-1 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#003366] group-hover:underline">
                      <Eye className="size-3" />
                      <span>Ver fotos y detalle de cada corte</span>
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-slate-900 font-num">
                        {formatPrecio(combo.precio)}
                      </span>
                      <span className="text-[11px] text-slate-400 line-through font-num">
                        {formatPrecio(combo.precioAnterior)}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-[#c53030] block">
                      Ahorrás {formatPrecio(combo.ahorro)}
                    </span>
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
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ComboDetailModal
        key={selectedCombo?.id || "catalogo-combo-modal"}
        isOpen={Boolean(selectedCombo)}
        onClose={() => setSelectedCombo(null)}
        combo={selectedCombo}
      />
    </>
  );
};

export const Catalogo = ({ onOpenProduct, onOpenCustomizer }) => {
  const { productos, isLoading, categoryCounts } = useCatalogo();
  const [searchParams, setSearchParams] = useSearchParams();

  // Categorías con conteos dinámicos oficiales de PostgreSQL
  const categoriesList = useMemo(
    () =>
      [
        { id: "todos", label: "Todos", count: categoryCounts.todos },
        {
          id: "asado",
          label: "Especial Asado 🔥",
          special: true,
          count: categoryCounts.asado,
        },
        { id: "combos", label: "Combos Ahorro", tag: "Promo", special: true },
        { id: "vacuno", label: "Carne Vacuna", count: categoryCounts.vacuno },
        { id: "cerdo", label: "Cerdo", count: categoryCounts.cerdo },
        { id: "pollo", label: "Granja & Pollo", count: categoryCounts.pollo },
        {
          id: "preparados",
          label: "Preparados",
          count: categoryCounts.preparados,
        },
        {
          id: "embutidos",
          label: "Embutidos",
          count: categoryCounts.embutidos,
        },
        { id: "achuras", label: "Achuras", count: categoryCounts.achuras },
        {
          id: "almacen",
          label: "Almacén Parrillero",
          count: categoryCounts.almacen,
        },
      ].filter(
        (cat) =>
          cat.special ||
          cat.id === "todos" ||
          (cat.count !== undefined && cat.count > 0),
      ),
    [categoryCounts],
  );

  // Derivado directo de la URL (Single Source of Truth)
  const selectedCategory = searchParams.get("categoria") || "todos";
  const searchQuery = searchParams.get("q") || "";

  const handleSelectCategory = (catId) => {
    const newParams = new URLSearchParams(searchParams);
    if (catId === "todos") {
      newParams.delete("categoria");
    } else {
      newParams.set("categoria", catId);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (val) => {
    const newParams = new URLSearchParams(searchParams);
    if (!val.trim()) {
      newParams.delete("q");
    } else {
      newParams.set("q", val);
    }
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("categoria");
    newParams.delete("q");
    setSearchParams(newParams);
  };

  const handleProductClick = (product) => {
    if (onOpenProduct) {
      onOpenProduct(product);
    } else if (onOpenCustomizer) {
      onOpenCustomizer(product);
    }
  };

  // Filtrado de las secciones visibles según el chip de categoría seleccionado
  const activeSections = useMemo(() => {
    if (selectedCategory === "combos") {
      return [];
    }
    if (selectedCategory !== "todos") {
      return CATEGORY_SECTIONS.filter((sec) => sec.id === selectedCategory);
    }
    return CATEGORY_SECTIONS;
  }, [selectedCategory]);

  // Determinar si corresponde mostrar la sección de combos
  const showCombos =
    selectedCategory === "todos" || selectedCategory === "combos";

  // Calcular productos filtrados para cada sección aplicando búsqueda si existe
  const sectionsWithProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return activeSections
      .map((sec) => {
        const filtered = productos.filter((p) => {
          if (!sec.filter(p)) return false;
          if (q) {
            return (
              (p.nombre && p.nombre.toLowerCase().includes(q)) ||
              (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
              (p.categoria && p.categoria.toLowerCase().includes(q)) ||
              (p.especie && p.especie.toLowerCase().includes(q))
            );
          }
          return true;
        });

        return {
          ...sec,
          products: filtered,
        };
      })
      .filter((sec) => sec.products.length > 0);
  }, [activeSections, productos, searchQuery]);

  // Contar el total de productos desplegados en pantalla
  const totalRenderedProducts = sectionsWithProducts.reduce(
    (acc, sec) => acc + sec.products.length,
    0,
  );

  return (
    <div className="max-w-6xl mx-auto pb-16 flex flex-col">
      {/* Header y Buscador Mobile */}
      <div className="bg-white lg:bg-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6 pt-6">
        {/* Buscador Mobile */}
        <div className="relative flex w-full md:hidden items-center">
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Search className="size-4 stroke-[2.5]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar vacío, asado, bondiola, pollo..."
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#F1F4F8] border-none text-xs font-medium placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#003366]/20 transition-all outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
            >
              <X className="size-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Categorías Horizontales con scroll nativo (los chips filtran qué sección div se despliega) */}
      <section className="bg-white lg:bg-transparent p-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {categoriesList.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          if (cat.special) {
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-[#c53030] text-white shadow-2xs"
                    : "bg-red-50 text-[#c53030] border border-red-200/70 hover:bg-red-100/80"
                }`}
              >
                <span>{cat.label}</span>
                {cat.count !== undefined && cat.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-num ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-red-200/70 text-[#c53030]"
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            );
          }

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? "bg-[#003366] text-white shadow-2xs"
                  : "bg-white lg:bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 lg:border-none"
              }`}
            >
              <span>{cat.label}</span>
              {cat.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-num ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {cat.count}
                </span>
              )}
              {cat.tag && (
                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {cat.tag}
                </span>
              )}
            </button>
          );
        })}
      </section>

      {/* Contenedor Principal de Secciones de Productos en Scroll Horizontal */}
      <div className="mt-2">
        {/* Estado de carga con Skeleton Loaders en carruseles horizontales */}
        {isLoading && productos.length === 0 ? (
          <div className="space-y-8 px-4 sm:px-6">
            {[1, 2].map((row) => (
              <div key={row} className="space-y-3">
                <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
                <div className="flex gap-4 overflow-x-hidden">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-[80vw] sm:w-75 shrink-0">
                      <ProductCardSkeleton />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : sectionsWithProducts.length === 0 && !showCombos ? (
          /* Estado sin resultados para la búsqueda o filtro */
          <div className="mx-4 sm:mx-6 bg-white border border-slate-200/90 rounded-3xl p-12 text-center text-slate-500 shadow-native mt-4">
            <p className="text-3xl mb-2">🔍</p>
            <h3 className="font-black text-base text-slate-800">
              No encontramos cortes para esa búsqueda o categoría
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Probá seleccionando "Todos" o buscando cortes como "asado",
              "vacio" o "pollo"
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-[#003366] text-white text-xs font-bold cursor-pointer hover:bg-valette-dark transition-colors"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          /* Renderizado de Secciones con Título, Descripción y Scroll Horizontal */
          <div>
            {sectionsWithProducts.map((sec) => (
              <CategoryHorizontalShelf
                key={sec.id}
                title={sec.titulo}
                description={sec.descripcion}
                badge={sec.badge}
                count={sec.products.length}
              >
                {sec.products.map((prod) => (
                  <div
                    key={prod.id}
                    className="w-[80vw] sm:w-75 shrink-0 flex flex-col snap-start last:snap-end"
                  >
                    <ProductCard
                      product={prod}
                      onOpenCustomizer={() => handleProductClick(prod)}
                    />
                  </div>
                ))}
              </CategoryHorizontalShelf>
            ))}

            {/* Sección de Combos con scroll horizontal (visible en "todos" o "combos") */}
            {showCombos && <CombosShelf searchQuery={searchQuery} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalogo;
