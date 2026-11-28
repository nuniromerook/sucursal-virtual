// admin/src/context/TabNavigationContext.jsx
import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useState,
} from "react";

const TabNavigationContext = createContext(null);

export const TabNavigationProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState("pedidos");

  // Almacén de coordenadas de scroll en píxeles para cada fragmento
  const scrollPositions = useRef({
    catalogo: 0,
    pedidos: 0,
    ingresos: 0,
    combos: 0,
    banners: 0,
    contenido: 0,
    metricas: 0,
    clientes: 0,
    notificaciones: 0,
    equipo: 0,
    ajustes: 0,
  });

  const isRestoringScroll = useRef(false);
  const prevTab = useRef(activeTab);
  const visitedTabs = useRef(new Set([activeTab]));

  // 1. En recarga inicial: forzar inicio desde arriba
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  // 2. Monitoreo pasivo y continuo del scroll en window
  useEffect(() => {
    const handleScroll = () => {
      if (isRestoringScroll.current) return;
      scrollPositions.current[activeTab] = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab]);

  // 3. Restauración instantánea antes del repintado (useLayoutEffect)
  useLayoutEffect(() => {
    if (prevTab.current !== activeTab) {
      const isFirstVisit = !visitedTabs.current.has(activeTab);
      if (isFirstVisit) {
        visitedTabs.current.add(activeTab);
      }

      const targetY = isFirstVisit ? 0 : scrollPositions.current[activeTab] || 0;

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
  }, [activeTab]);

  // Navegación nativa entre fragmentos
  const switchTab = useCallback((tabName) => {
    setActiveTab((current) => {
      if (current === tabName) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return current;
      }
      return tabName;
    });
  }, []);

  return (
    <TabNavigationContext.Provider
      value={{
        activeTab,
        switchTab,
      }}
    >
      {children}
    </TabNavigationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTabNavigation = () => {
  const context = useContext(TabNavigationContext);
  if (!context) {
    throw new Error("useTabNavigation debe usarse dentro de TabNavigationProvider");
  }
  return context;
};

export default TabNavigationContext;
