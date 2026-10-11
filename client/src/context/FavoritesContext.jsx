// src/context/FavoritesContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("valette_favorites");
      return saved ? JSON.parse(saved) : [1]; // ID 1 como favorito inicial
    } catch {
      return [1];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("valette_favorites", JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  const toggleFavorite = (productId, productName = "este corte") => {
    setFavorites((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast(`Sacaste ${productName} de tus favoritos`, "info");
        return prev.filter((id) => id !== productId);
      } else {
        showToast(`Agregaste ${productName} a tus favoritos`, "success");
        return [...prev, productId];
      }
    });
  };

  const isFavorite = (productId) => favorites.includes(productId);

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
