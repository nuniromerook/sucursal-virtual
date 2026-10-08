// src/context/CatalogoContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  CORTES_MOCK,
  DEFAULT_BANNERS,
  fetchCatalogo,
  fetchBanners,
} from "@/services/catalogo.service";

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

    return () => {
      isCancelled = true;
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
    };

    productos.forEach((p) => {
      const cat = p.categoria || "vacuno";
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
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
