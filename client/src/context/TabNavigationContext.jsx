// src/context/TabNavigationContext.jsx
import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

const TabNavigationContext = createContext(null);

export const TabNavigationProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determinación de la pestaña activa ('home' o 'catalogo')
  const isCatalogo = location.pathname.startsWith("/productos");
  const activeTab = isCatalogo ? "catalogo" : "home";

  // Almacén de posiciones de scroll en píxeles para cada pestaña
  const scrollPositions = useRef({
    home: 0,
    catalogo: 0,
  });

  // Registro de qué pestañas ya fueron visitadas en la sesión activa.
  // Permite cumplir el requisito de iniciar en 0 (arriba) la primera vez que se visita cada una.
  const visitedTabs = useRef(new Set([activeTab]));

  // Memoria de la última URL del catálogo (para recordar filtros activos como ?categoria=vacuno al volver)
  const lastCatalogoPath = useRef("/productos");

  // Bandera de sincronización para evitar guardar coordenadas durante un scroll programático
  const isRestoringScroll = useRef(false);
  const prevTab = useRef(activeTab);
  const isInitialMount = useRef(true);

  // Parámetros de búsqueda y categoría para detectar cambios en filtros de catálogo
  const searchParams = new URLSearchParams(location.search);
  const currentCategory = searchParams.get("categoria") || "todos";
  const currentQuery = searchParams.get("q") || "";
  const lastFilterKey = useRef(`${currentCategory}_${currentQuery}`);

  // 1. En la carga inicial (o refresco): forzar inicio desde arriba (scroll 0)
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  // 2. Monitoreo pasivo y continuo del scroll del usuario en la pestaña activa
  useEffect(() => {
    const handleScroll = () => {
      if (isRestoringScroll.current) return;
      scrollPositions.current[activeTab] = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab]);

  // 3. Registrar última URL visitada de catálogo (excluyendo el modal de producto para no reabrirlo sin querer)
  useEffect(() => {
    if (activeTab === "catalogo") {
      const cleanParams = new URLSearchParams(location.search);
      cleanParams.delete("producto");
      cleanParams.delete("corte");
      const cleanQuery = cleanParams.toString();
      lastCatalogoPath.current = cleanQuery
        ? `/productos?${cleanQuery}`
        : "/productos";
    }
  }, [activeTab, location.search]);

  // 4. Restauración instantánea antes del repintado (useLayoutEffect)
  useLayoutEffect(() => {
    // Si es la primera carga inicial del navegador, no restaurar nada viejo
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Caso A: Cambio de Pestaña (Fragment switch: Home <-> Catálogo)
    if (prevTab.current !== activeTab) {
      const isFirstVisit = !visitedTabs.current.has(activeTab);
      if (isFirstVisit) {
        visitedTabs.current.add(activeTab);
      }

      // Si es la primera vez que se visita esta pestaña, inicia arriba en 0.
      // Si ya fue visitada, restaura la ubicación previa exacta.
      const targetY = isFirstVisit
        ? 0
        : scrollPositions.current[activeTab] || 0;

      isRestoringScroll.current = true;
      window.scrollTo({ top: targetY, left: 0, behavior: "instant" });

      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          isRestoringScroll.current = false;
        });
        return () => cancelAnimationFrame(raf2);
      });

      prevTab.current = activeTab;
      return () => cancelAnimationFrame(raf1);
    }

    // Caso B: Misma pestaña de catálogo, pero el usuario cambió de categoría o buscó algo nuevo
    if (activeTab === "catalogo") {
      const currentFilter = `${currentCategory}_${currentQuery}`;
      if (lastFilterKey.current !== currentFilter) {
        lastFilterKey.current = currentFilter;
        scrollPositions.current.catalogo = 0;

        isRestoringScroll.current = true;
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });

        const raf1 = requestAnimationFrame(() => {
          const raf2 = requestAnimationFrame(() => {
            isRestoringScroll.current = false;
          });
          return () => cancelAnimationFrame(raf2);
        });

        return () => cancelAnimationFrame(raf1);
      }
    }
  }, [activeTab, currentCategory, currentQuery]);

  // Acciones de navegación estilo Fragments nativos
  const goToHome = useCallback(() => {
    if (activeTab === "home") {
      // Si ya está en inicio, scroll suave hacia arriba (comportamiento dock nativo)
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  }, [activeTab, navigate]);

  const goToCatalogo = useCallback(() => {
    if (activeTab === "catalogo") {
      // Si ya está en catálogo, scroll suave hacia arriba
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(lastCatalogoPath.current || "/productos");
    }
  }, [activeTab, navigate]);

  return (
    <TabNavigationContext.Provider
      value={{
        activeTab,
        isHome: activeTab === "home",
        isCatalogo: activeTab === "catalogo",
        goToHome,
        goToCatalogo,
      }}
    >
      {children}
    </TabNavigationContext.Provider>
  );
};

export const useTabNavigation = () => {
  const context = useContext(TabNavigationContext);
  if (!context) {
    throw new Error(
      "useTabNavigation debe usarse dentro de un TabNavigationProvider",
    );
  }
  return context;
};

export default TabNavigationContext;
