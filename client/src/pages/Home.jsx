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
import { useAuth } from "@/context/AuthContext";
import { scoreProductMatch } from "@/utils/searchRanking";
import { formatDisplayAddress } from "@/utils/address";
import { ChevronDown, MapPin, Store, Search, X } from "lucide-react";

export const Home = ({
  onOpenProduct,
  onOpenCustomizer,
  onOpenBranchModal,
  searchQuery = "",
  searchSubmitTick = 0,
  sortBy = "destacados",
  onlyStock = false,
  onResetFilters,
  onStickyChange,
}) => {
  const { productos, isLoading, categoryCounts } = useCatalogo();
  const { customerAddress, deliveryMode, selectedBranch } = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  const firstName =
    isAuthenticated && user?.nombre ? user.nombre.trim().split(/\s+/)[0] : "";

  const [activeSection, setActiveSection] = useState("combos");
  const [isNavbarFused, setIsNavbarFused] = useState(false);

  const activeSectionRef = useRef("combos");
  const categoryBarRef = useRef(null);
  const chipRefs = useRef({});
  const sentinelRef = useRef(null);
  const programmaticScrollUntil = useRef(0);
  const isUserTouchingBar = useRef(false);
  const sectionsWithProductsRef = useRef([]);

  const categoriaParam = searchParams.get("categoria");

  // Auto-scroll si el usuario ingresa con parámetro ?categoria= en la URL
  // Depende solo de categoriaParam para NO dispararse al escribir en el buscador (?q=...)
  useEffect(() => {
    if (categoriaParam) {
      const target = document.getElementById(`seccion-${categoriaParam}`);
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    }
  }, [categoriaParam]);

  const hasSearchQuery = Boolean(searchQuery.trim());
  const hasSearchQueryRef = useRef(hasSearchQuery);
  const lastSearchSubmitTickRef = useRef(0);

  useEffect(() => {
    hasSearchQueryRef.current = hasSearchQuery;
  }, [hasSearchQuery]);

  // Deslizar suavemente hacia "Resultados de búsqueda" ÚNICAMENTE cuando se presiona Enter
  useEffect(() => {
    if (
      !searchSubmitTick ||
      searchSubmitTick === lastSearchSubmitTickRef.current
    ) {
      return;
    }
    lastSearchSubmitTickRef.current = searchSubmitTick;
    if (!hasSearchQueryRef.current) return;

    const frameId = requestAnimationFrame(() => {
      const target = document.getElementById("seccion-resultados-busqueda");
      if (!target) return;
      const navbarHeight = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--navbar-height",
        ) || "112",
      );
      const top =
        target.getBoundingClientRect().top + window.scrollY - navbarHeight - 12;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frameId);
  }, [searchSubmitTick]);

  // Filtrado reactivo de cortes oficiales desde PostgreSQL (ordenados por coincidencias si hay búsqueda)
  const filteredProducts = useMemo(() => {
    let list = [...productos];

    if (hasSearchQuery) {
      list = list
        .map((p) => ({ prod: p, score: scoreProductMatch(p, searchQuery) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (sortBy === "precio-menor") return a.prod.precio - b.prod.precio;
          if (sortBy === "precio-mayor") return b.prod.precio - a.prod.precio;
          if (sortBy === "alfabetico")
            return a.prod.nombre.localeCompare(b.prod.nombre);
          return 0;
        })
        .map((entry) => entry.prod);
    }

    if (onlyStock) {
      list = list.filter((p) => !p.sin_stock && p.activo !== false);
    }

    if (!hasSearchQuery) {
      if (sortBy === "precio-menor") {
        list.sort((a, b) => a.precio - b.precio);
      } else if (sortBy === "precio-mayor") {
        list.sort((a, b) => b.precio - a.precio);
      } else if (sortBy === "alfabetico") {
        list.sort((a, b) => a.nombre.localeCompare(b.nombre));
      }
    }

    return list;
  }, [productos, searchQuery, hasSearchQuery, onlyStock, sortBy]);

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

  useEffect(() => {
    sectionsWithProductsRef.current = sectionsWithProducts;
  }, [sectionsWithProducts]);

  // Lista de chips de categorías para el div horizontal mobile
  const stickyCategories = useMemo(
    () =>
      [
        { id: "combos", label: "Combos", special: true },
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
    container.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: "smooth",
    });
  };

  // Navegación suave hasta el inicio de la sección seleccionada
  const handleCategoryScroll = (catId) => {
    // Si el usuario toca un chip, liberamos el bloqueo táctil de inmediato
    isUserTouchingBar.current = false;

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

      const sectionIds = ["combos", ...CATEGORY_SECTIONS.map((s) => s.id)];

      // 3. Respuesta instantánea para scroll rápido al INICIO
      if (window.scrollY < 180) {
        if (activeSectionRef.current !== "combos") {
          activeSectionRef.current = "combos";
          setActiveSection("combos");
          if (!isUserTouchingBar.current) {
            centerChip("combos");
          }
        }
        return;
      }

      // 4. Respuesta instantánea para scroll rápido al FINAL de la página
      const isAtPageBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 160;

      if (isAtPageBottom) {
        const availableSections = sectionIds.filter(
          (id) =>
            id === "combos" ||
            sectionsWithProductsRef.current.some((s) => s.id === id),
        );
        const lastSection =
          availableSections[availableSections.length - 1] || "combos";
        if (activeSectionRef.current !== lastSection) {
          activeSectionRef.current = lastSection;
          setActiveSection(lastSection);
          if (!isUserTouchingBar.current) {
            centerChip(lastSection);
          }
        }
        return;
      }

      // 5. Anticipación de detección entre secciones (al final de la card anterior)
      const categoryBarHeight = 48;
      const cardAnticipation = 230; // Anticipa la detección cuando la card anterior está finalizando
      const triggerOffset = navbarHeight + categoryBarHeight + cardAnticipation;

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
        if (!isUserTouchingBar.current) {
          centerChip(current);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Chequeo inicial

    return () => {
      window.removeEventListener("scroll", handleScroll);
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
      <div className="px-4 sm:px-6 pt-4 flex flex-col -space-y-2">
        <h1 className="text-2xl font-bold">
          Hola {firstName ? firstName : "invitado"}!
        </h1>
        <h2>Qué vas a pedir hoy?</h2>
      </div>
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
                  : formatDisplayAddress(customerAddress) ||
                    "Ingresar dirección"}
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

      {/* 4. Sección de Combos con Scroll Horizontal Oficial */}
      <div className="mt-2">
        <CombosSection searchQuery={searchQuery} />
      </div>

      {/* 4b. Sección "Resultados de búsqueda" (scroll horizontal como el resto de secciones, visible solo si hay texto) */}
      {hasSearchQuery && (
        <div
          id="seccion-resultados-busqueda"
          className="scroll-mt-36 md:scroll-mt-32 overscroll-contain"
        >
          {filteredProducts.length === 0 ? (
            <section
              aria-label="Resultados de búsqueda"
              className="px-4 sm:px-6 mb-8"
            >
              <div className="flex items-center justify-between gap-3 mb-3.5 mt-2">
                <h2 className="text-xl font-black text-slate-900 leading-tight">
                  Resultados de búsqueda
                </h2>
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-100 text-slate-600 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  <X className="size-3.5 stroke-[2.5]" aria-hidden="true" />
                  <span>Limpiar</span>
                </button>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-3xl p-8 text-center text-slate-500 shadow-native">
                <div className="size-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Search className="size-5 stroke-[2]" aria-hidden="true" />
                </div>
                <h3 className="font-black text-sm sm:text-base text-slate-800">
                  No encontramos cortes para “{searchQuery.trim()}”
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Probá buscando términos como “asado”, “vacío”, “pollo” o
                  “bondiola”.
                </p>
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#003366] text-white text-xs font-bold cursor-pointer hover:bg-valette-dark transition-colors shadow-2xs"
                >
                  Limpiar búsqueda
                </button>
              </div>
            </section>
          ) : (
            <CategoryHorizontalShelf
              title="Resultados de búsqueda"
              description={`Coincidencias para “${searchQuery.trim()}” ordenadas por relevancia.`}
              count={filteredProducts.length}
              headerAction={
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-100 text-slate-600 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  <X className="size-3.5 stroke-[2.5]" aria-hidden="true" />
                  <span>Limpiar</span>
                </button>
              }
            >
              {filteredProducts.map((prod) => (
                <div
                  key={`search-${prod.id}`}
                  className="w-65 shrink-0 flex flex-col snap-start last:snap-end pb-4"
                >
                  <ProductCard
                    product={prod}
                    onOpenCustomizer={() => handleProductClick(prod)}
                  />
                </div>
              ))}
            </CategoryHorizontalShelf>
          )}
        </div>
      )}

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
                    <div key={i} className="w-55 sm:w-60 shrink-0">
                      <ProductCardSkeleton />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : !hasAnyResults && !hasSearchQuery ? (
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
              className="scroll-mt-40 md:scroll-mt-32 overscroll-contain"
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
                    className="w-65 shrink-0 flex flex-col snap-start last:snap-end pb-4"
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
