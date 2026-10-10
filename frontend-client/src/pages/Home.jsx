// src/pages/Home.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { CombosSection } from "@/components/home/CombosSection";
import { BranchesSection } from "@/components/home/BranchesSection";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";
import {
  CategoryHorizontalShelf,
  CATEGORY_SECTIONS,
} from "@/components/products/CategoryHorizontalShelf";
import { useCatalogo } from "@/context/CatalogoContext";
import { useLocation } from "@/context/LocationContext";
import { ChevronDown, MapPin, Store } from "lucide-react";

export const Home = ({
  onOpenProduct,
  onOpenCustomizer,
  onOpenBranchModal,
  searchQuery = "",
  sortBy = "destacados",
  onlyStock = false,
  onResetFilters,
  onStickyChange,
}) => {
  const { productos, isLoading, categoryCounts } = useCatalogo();
  const { customerAddress, deliveryMode, selectedBranch } = useLocation();
  const [searchParams] = useSearchParams();

  const [activeSection, setActiveSection] = useState("combos");
  const [isNavbarFused, setIsNavbarFused] = useState(false);

  const activeSectionRef = useRef("combos");
  const categoryBarRef = useRef(null);
  const chipRefs = useRef({});
  const sentinelRef = useRef(null);
  const programmaticScrollUntil = useRef(0);
  const isCenteringChip = useRef(false);
  const isUserScrollingBar = useRef(false);
  const userBarTimeoutRef = useRef(null);

  // Auto-scroll si el usuario ingresa con parámetro ?categoria= en la URL
  useEffect(() => {
    const cat = searchParams.get("categoria");
    if (cat) {
      const target = document.getElementById(`seccion-${cat}`);
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    }
  }, [searchParams]);

  // Filtrado reactivo de cortes oficiales desde PostgreSQL
  const filteredProducts = useMemo(() => {
    let list = [...productos];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.nombre && p.nombre.toLowerCase().includes(q)) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
          (p.categoria && p.categoria.toLowerCase().includes(q)) ||
          (p.especie && p.especie.toLowerCase().includes(q)),
      );
    }

    if (onlyStock) {
      list = list.filter((p) => !p.sin_stock && p.activo !== false);
    }

    if (sortBy === "precio-menor") {
      list.sort((a, b) => a.precio - b.precio);
    } else if (sortBy === "precio-mayor") {
      list.sort((a, b) => b.precio - a.precio);
    } else if (sortBy === "alfabetico") {
      list.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return list;
  }, [productos, searchQuery, onlyStock, sortBy]);

  // Secciones con productos disponibles según filtros
  const sectionsWithProducts = useMemo(() => {
    return CATEGORY_SECTIONS.map((sec) => {
      const prods = filteredProducts.filter((p) => sec.filter(p));
      return {
        ...sec,
        products: prods,
      };
    }).filter((sec) => sec.products.length > 0);
  }, [filteredProducts]);

  // Lista de chips de categorías para el div horizontal mobile
  const stickyCategories = useMemo(
    () =>
      [
        { id: "combos", label: "Combos Ahorro", tag: "Promo", special: true },
        {
          id: "asado",
          label: "Sector Asado 🔥",
          special: true,
          count: categoryCounts.asado,
        },
        { id: "vacuno", label: "Vacuno", count: categoryCounts.vacuno },
        { id: "cerdo", label: "Cerdo", count: categoryCounts.cerdo },
        { id: "pollo", label: "Pollo & Granja", count: categoryCounts.pollo },
        {
          id: "embutidos",
          label: "Embutidos",
          count: categoryCounts.embutidos,
        },
        {
          id: "preparados",
          label: "Preparados",
          count: categoryCounts.preparados,
        },
        { id: "achuras", label: "Achuras", count: categoryCounts.achuras },
        { id: "almacen", label: "Almacén", count: categoryCounts.almacen },
      ].filter(
        (cat) => cat.special || (cat.count !== undefined && cat.count > 0),
      ),
    [categoryCounts],
  );

  // Centrado de chip horizontal sin perturbar el scroll vertical del window
  const centerChip = (catId) => {
    const container = categoryBarRef.current;
    const chip = chipRefs.current[catId];
    if (!container || !chip) return;

    const containerWidth = container.offsetWidth;
    const chipLeft = chip.offsetLeft;
    const chipWidth = chip.offsetWidth;

    const targetScrollLeft = chipLeft - containerWidth / 2 + chipWidth / 2;
    isCenteringChip.current = true;
    container.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: "smooth",
    });
    setTimeout(() => {
      isCenteringChip.current = false;
    }, 350);
  };

  // Manejo de scroll manual en la barra de categorías
  const handleCategoryBarScroll = () => {
    if (isCenteringChip.current) return;
    isUserScrollingBar.current = true;
    if (userBarTimeoutRef.current) clearTimeout(userBarTimeoutRef.current);
    userBarTimeoutRef.current = setTimeout(() => {
      isUserScrollingBar.current = false;
    }, 2000);
  };

  // Navegación suave hasta el inicio de la sección seleccionada
  const handleCategoryScroll = (catId) => {
    // Reactivar detección y auto-centrado inmediatamente al tocar la categoría
    isUserScrollingBar.current = false;
    if (userBarTimeoutRef.current) clearTimeout(userBarTimeoutRef.current);

    // Bloquear temporalmente interferencia pasiva durante la animación de scroll (~750ms)
    programmaticScrollUntil.current = Date.now() + 750;

    setActiveSection(catId);
    activeSectionRef.current = catId;
    centerChip(catId);

    const target = document.getElementById(`seccion-${catId}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Detección precisa de sección activa + detección de fusión de navbar (sombra 0)
  useEffect(() => {
    const handleScroll = () => {
      const navbarHeight = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--navbar-height",
        ) || "96",
      );

      // 1. Verificar si la barra de categorías tocó la base de la navbar (SÓLO EN MOBILE)
      const isMobile = window.innerWidth < 768;
      if (isMobile && sentinelRef.current) {
        const sentinelRect = sentinelRef.current.getBoundingClientRect();
        // Si el sentinel llegó o pasó la base de la navbar, activar fusión
        const isSticky = sentinelRect.top <= navbarHeight + 2;
        setIsNavbarFused(isSticky);
        onStickyChange?.(isSticky);
      } else if (!isMobile) {
        setIsNavbarFused(false);
        onStickyChange?.(false);
      }

      // 2. Si hay scroll programático en curso por click, no interferir con la animación
      if (Date.now() < programmaticScrollUntil.current) return;

      // 3. Offset dinámico para detectar en qué sección se encuentra el usuario
      const triggerOffset = navbarHeight + 70;
      const sectionIds = ["combos", ...CATEGORY_SECTIONS.map((s) => s.id)];
      let current = sectionIds[0];

      for (const id of sectionIds) {
        const el = document.getElementById(`seccion-${id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= triggerOffset) {
            current = id;
          }
        }
      }

      if (current !== activeSectionRef.current) {
        activeSectionRef.current = current;
        setActiveSection(current);
        if (!isUserScrollingBar.current) {
          centerChip(current);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Chequeo inicial

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (userBarTimeoutRef.current) clearTimeout(userBarTimeoutRef.current);
    };
  }, [onStickyChange]);

  const handleProductClick = (product) => {
    if (onOpenProduct) {
      onOpenProduct(product);
    } else if (onOpenCustomizer) {
      onOpenCustomizer(product);
    }
  };

  const hasAnyResults =
    sectionsWithProducts.length > 0 || (!searchQuery.trim() && !onlyStock);

  return (
    <div className="max-w-6xl mx-auto flex flex-col">
      {/* 1. Selector de Entrega / Retiro & Dirección Mobile */}
      <div className="px-4 sm:px-6 pt-4 sm:hidden">
        <button
          type="button"
          onClick={onOpenBranchModal}
          className="w-full p-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-native flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer hover:border-slate-300 group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-9 rounded-xl bg-[#003366]/5 border border-[#003366]/15 text-[#003366] flex items-center justify-center shrink-0">
              {deliveryMode === "pickup" ? (
                <Store className="size-4.5 stroke-[2.2]" />
              ) : (
                <MapPin className="size-4.5 stroke-[2.2]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[#003366]">
                  {deliveryMode === "pickup"
                    ? "Retiro en Mostrador"
                    : "Envío a Domicilio"}
                </span>
              </div>
              <p className="text-xs font-black text-slate-900 truncate mt-0.5 group-hover:text-[#003366] transition-colors">
                {deliveryMode === "pickup"
                  ? `Sucursal ${selectedBranch?.nombre || "Luis Guillón"}`
                  : customerAddress || "J. Tarulli 1474, Luis Guillón"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 pl-1">
            <span className="text-[10px] font-extrabold text-[#003366] bg-[#003366]/5 px-2 py-0.5 rounded-lg border border-[#003366]/10">
              Cambiar
            </span>
            <ChevronDown className="size-3.5 text-slate-400 group-hover:text-[#003366] transition-colors stroke-[2.5]" />
          </div>
        </button>
      </div>

      {/* 2. Carrusel de Banners Publicitarios Oficiales */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6">
        <BannerCarousel onSelectCategory={handleCategoryScroll} />
      </div>

      {/* Sentinel Invisible para detectar con precisión cuándo se alcanza el estado sticky */}
      <div
        ref={sentinelRef}
        className="h-px w-full pointer-events-none invisible"
        aria-hidden="true"
      />

      {/* 3. Div Horizontal de Categorías (Debajo del Carrusel, Sticky en Mobile y Oculto en Desktop) */}
      <nav
        ref={categoryBarRef}
        onScroll={handleCategoryBarScroll}
        onTouchStart={() => {
          isUserScrollingBar.current = true;
        }}
        aria-label="Categorías de cortes"
        style={{ top: "var(--navbar-height, 96px)" }}
        className={`md:hidden sticky z-30 bg-white transition-all duration-150 px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth my-3 ${
          isNavbarFused
            ? "border-b border-slate-200/90 shadow-xs"
            : "border-y border-slate-200/80 shadow-none"
        }`}
      >
        {stickyCategories.map((cat) => {
          const isCurrentActive = activeSection === cat.id;

          if (cat.special) {
            return (
              <button
                key={cat.id}
                ref={(el) => (chipRefs.current[cat.id] = el)}
                type="button"
                onClick={() => handleCategoryScroll(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  isCurrentActive
                    ? "bg-[#c53030] text-white shadow-2xs scale-102"
                    : "bg-red-50 text-[#c53030] border border-red-200/70 hover:bg-red-100/80"
                }`}
              >
                <span>{cat.label}</span>
                {cat.tag && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase ${
                      isCurrentActive
                        ? "bg-white/20 text-white"
                        : "bg-red-200/70 text-[#c53030]"
                    }`}
                  >
                    {cat.tag}
                  </span>
                )}
                {cat.count !== undefined && cat.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-num ${
                      isCurrentActive
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
              ref={(el) => (chipRefs.current[cat.id] = el)}
              type="button"
              onClick={() => handleCategoryScroll(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                isCurrentActive
                  ? "bg-[#003366] text-white shadow-2xs scale-102"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/70"
              }`}
            >
              <span>{cat.label}</span>
              {cat.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-num ${
                    isCurrentActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 4. Sección de Combos con Scroll Horizontal Oficial */}
      <div className="mt-2">
        <CombosSection searchQuery={searchQuery} />
      </div>

      {/* 5. Secciones de Categorías con Scroll Horizontal (Debajo de los Combos) */}
      <div id="secciones-catalogo" className="space-y-2">
        {/* Skeleton Loaders en estado de carga */}
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
        ) : !hasAnyResults ? (
          /* Estado vacío si no hay coincidencias de búsqueda */
          <div className="mx-4 sm:px-6 bg-white border border-slate-200/90 rounded-3xl p-12 text-center text-slate-500 shadow-native my-8">
            <p className="text-3xl mb-2">🔍</p>
            <h3 className="font-black text-base text-slate-800">
              No encontramos cortes para esa búsqueda
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Probá buscando términos como "asado", "vacio", "pollo", "bondiola"
            </p>
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-[#003366] text-white text-xs font-bold cursor-pointer hover:bg-valette-dark transition-colors shadow-2xs"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          /* Renderizado de todas las secciones de categorías */
          sectionsWithProducts.map((sec) => (
            <div
              key={sec.id}
              id={`seccion-${sec.id}`}
              className="scroll-mt-40 md:scroll-mt-32"
            >
              <CategoryHorizontalShelf
                title={sec.titulo}
                description={sec.descripcion}
                badge={sec.badge}
                count={sec.products.length}
              >
                {sec.products.map((prod) => (
                  <div
                    key={prod.id}
                    className="w-[80vw] sm:w-75 shrink-0 flex flex-col snap-start last:snap-end pb-4"
                  >
                    <ProductCard
                      product={prod}
                      onOpenCustomizer={() => handleProductClick(prod)}
                    />
                  </div>
                ))}
              </CategoryHorizontalShelf>
            </div>
          ))
        )}
      </div>

      {/* 6. Fichas de Sucursales y Horarios */}
      <div className="px-4 sm:px-6 mt-6">
        <BranchesSection />
      </div>
    </div>
  );
};

export default Home;
