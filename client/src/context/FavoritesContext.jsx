// src/context/FavoritesContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/config/api";

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const { showToast } = useToast();
  const { token } = useAuth();

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("valette_favorites_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((id) => Number(id)).filter((id) => Number.isFinite(id));
        }
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem("valette_favorites_v1", JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  // Sincronizar favoritos con PostgreSQL al iniciar sesión
  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    const syncWithCloud = async () => {
      try {
        let localFavs = [];
        try {
          const saved = localStorage.getItem("valette_favorites_v1");
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) localFavs = parsed;
          }
        } catch {}

        const res = await fetch(`${API_URL}/clientes/favoritos/sincronizar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ favoritos: localFavs }),
        });

        if (res.ok && isMounted) {
          const data = await res.json();
          if (Array.isArray(data.favoritos)) {
            setFavorites(data.favoritos.map((id) => Number(id)));
          }
        }
      } catch {}
    };

    syncWithCloud();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const toggleFavorite = (productId, productName = "este corte") => {
    const numericId = Number(productId);
    setFavorites((prev) => {
      const exists = prev.includes(numericId);
      if (exists) {
        showToast(`Sacaste ${productName} de tus favoritos`, "info");
        return prev.filter((id) => id !== numericId);
      } else {
        showToast(`Agregaste ${productName} a tus favoritos`, "success");
        return [...prev, numericId];
      }
    });

    if (token && Number.isFinite(numericId) && numericId > 0) {
      fetch(`${API_URL}/clientes/favoritos/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ catalogo_id: numericId }),
      }).catch(() => {});
    }
  };

  const isFavorite = (productId) => favorites.includes(Number(productId));

  return (
    <FavoritesContext.Provider
      value={{ favorites, toggleFavorite, isFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx)
    throw new Error("useFavorites debe ser usado dentro de FavoritesProvider");
  return ctx;
};
