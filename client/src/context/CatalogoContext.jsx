// src/context/CatalogoContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { getSocket } from "@/utils/socket";
import {
  CORTES_MOCK,
  DEFAULT_BANNERS,
  fetchCatalogo,
  fetchBanners,
} from "@/services/catalogo.service";
import { matchesAnimalCategory } from "@/components/products/CategoryHorizontalShelf";

const CatalogoContext = createContext(null);

export const CatalogoProvider = ({ children }) => {
  // Inicializar con CORTES_MOCK para renderizado inmediato sin parpadeo (Instant FCP)
  const [productos, setProductos] = useState(() => {
    try {
      const cached = localStorage.getItem("valette_catalogo_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return CORTES_MOCK;
  });

  const [banners, setBanners] = useState(DEFAULT_BANNERS);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Carga asíncrona en montaje sin setState síncrono inicial (React 19 compliant)
  useEffect(() => {
    let isCancelled = false;

    const runFetch = async () => {
      try {
        const [cortesData, bannersData] = await Promise.all([
          fetchCatalogo(),
          fetchBanners(),
        ]);

        if (!isCancelled) {
          if (cortesData && cortesData.length > 0) {
            setProductos(cortesData);
          }
          if (bannersData && bannersData.length > 0) {
            setBanners(bannersData);
          }
          setIsError(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error al cargar datos oficiales:", err);
          setIsError(true);
        }
      }
    };

    runFetch();

    // Suscripción en tiempo real a cambios de catálogo o stock vía Socket singleton
    const socket = getSocket();

    const handleConnect = () => {
      socket.emit("join_stock");
    };
    const handleRefresh = () => {
      runFetch();
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);
    socket.on("catalogo_actualizado", handleRefresh);
    socket.on("stock_actualizado", handleRefresh);

    return () => {
      isCancelled = true;
      socket.off("connect", handleConnect);
      socket.off("catalogo_actualizado", handleRefresh);
      socket.off("stock_actualizado", handleRefresh);
    };
  }, []);

  const refreshCatalogo = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cortesData, bannersData] = await Promise.all([
        fetchCatalogo(),
        fetchBanners(),
      ]);

      if (cortesData && cortesData.length > 0) {
        setProductos(cortesData);
      }
      if (bannersData && bannersData.length > 0) {
        setBanners(bannersData);
      }
      setIsError(false);
    } catch (err) {
      console.error("Error al refrescar datos:", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Buscador rápido de producto por slug o ID (usado por URL params y modales)
  const getProductBySlugOrId = useCallback(
    (identifier) => {
      if (!identifier) return null;
      const strId = String(identifier).toLowerCase().trim();
      return (
        productos.find(
          (p) =>
            p.slug === strId ||
            String(p.id) === strId ||
            (p.slug && p.slug.toLowerCase() === strId)
        ) || null
      );
    },
    [productos]
  );

  // Conteo dinámico de cortes por categoría
  const categoryCounts = useMemo(() => {
    const counts = {
      todos: productos.length,
      vacuno: 0,
      cerdo: 0,
      pollo: 0,
      preparados: 0,
      embutidos: 0,
      achuras: 0,
      asado: 0,
      almacen: 0,
    };

    productos.forEach((p) => {
      const cat = p.categoria || "vacuno";
      if (["preparados", "embutidos", "achuras", "almacen"].includes(cat)) {
        counts[cat]++;
      }
      if (matchesAnimalCategory(p, "vacuno")) counts.vacuno++;
      if (matchesAnimalCategory(p, "cerdo")) counts.cerdo++;
      if (matchesAnimalCategory(p, "pollo")) counts.pollo++;
      // Cortes parrilleros
      if (["vacuno", "cerdo", "embutidos", "achuras"].includes(cat)) {
        counts.asado++;
      }
    });

    return counts;
  }, [productos]);

  return (
    <CatalogoContext.Provider
      value={{
        productos,
        banners,
        isLoading,
        isError,
        refreshCatalogo,
        getProductBySlugOrId,
        categoryCounts,
      }}
    >
      {children}
    </CatalogoContext.Provider>
  );
};

export const useCatalogo = () => {
  const context = useContext(CatalogoContext);
  if (!context) {
    throw new Error("useCatalogo debe ser utilizado dentro de un CatalogoProvider");
  }
  return context;
};
