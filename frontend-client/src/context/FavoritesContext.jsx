// frontend-client/src/context/FavoritesContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { VITE_API_URL } from "../config/api";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext(null);
const FAVORITES_STORAGE_KEY = "valette_favoritos";

export function FavoritesContextProvider({ children }) {
  const { user, isAuthenticated, token } = useAuth();

  // IDs de productos favoritos en memoria / localStorage
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Limpiar memoria de favoritos (invocado en logout)
  const clearFavoritesLocal = useCallback(() => {
    setFavoriteIds([]);
    try {
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
    } catch (e) {
      console.error("Error limpiando favoritos local:", e);
    }
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      clearFavoritesLocal();
    };
    window.addEventListener("valette_logout", handleLogout);
    return () => window.removeEventListener("valette_logout", handleLogout);
  }, [clearFavoritesLocal]);

  // Cargar y sincronizar con la base de datos cuando el usuario inicia sesión
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const syncFavoritesWithBackend = async () => {
      try {
        // 1. Sincronizar los que tenga guardados localmente antes de loguear
        const localFavs = favoriteIds;
        if (localFavs.length > 0) {
          const syncRes = await fetch(
            `${VITE_API_URL}/catalogo/favoritos/sincronizar`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                cliente_id: user.id,
                ids: localFavs,
              }),
            },
          );
          if (syncRes.ok) {
            const syncData = await syncRes.json();
            if (Array.isArray(syncData.favoritos)) {
              setFavoriteIds(syncData.favoritos);
              return;
            }
          }
        }

        // 2. Si no había locales o falló sync, consultar los favoritos del cliente
        const res = await fetch(
          `${VITE_API_URL}/catalogo/favoritos/cliente/${user.id}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.favoritos)) {
            setFavoriteIds(data.favoritos);
          }
        }
      } catch (err) {
        console.error("Error al sincronizar favoritos con backend:", err);
      }
    };

    syncFavoritesWithBackend();
  }, [isAuthenticated, user?.id, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Alternar favorito (optimista)
  const toggleFavorite = useCallback(
    async (productId) => {
      if (!productId) return;
      const idNum = Number(productId);

      setFavoriteIds((prev) => {
        const isFav = prev.includes(idNum);
        const next = isFav
          ? prev.filter((id) => id !== idNum)
          : [...prev, idNum];
        return next;
      });

      // Si está logueado, persistir en PostgreSQL
      if (isAuthenticated && user?.id) {
        try {
          await fetch(`${VITE_API_URL}/catalogo/${idNum}/favorito`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ cliente_id: user.id }),
          });
        } catch (err) {
          console.error("Error persistiendo favorito en backend:", err);
        }
      }
    },
    [isAuthenticated, user?.id, token],
  );

  const isFavorite = useCallback(
    (productId) => {
      if (!productId) return false;
      return favoriteIds.includes(Number(productId));
    },
    [favoriteIds],
  );

  // Limpia IDs de productos que ya no existen en el catálogo
  const cleanInvalidFavorites = useCallback((validIds) => {
    if (!Array.isArray(validIds) || validIds.length === 0) return;
    const validSet = new Set(validIds.map(Number));
    setFavoriteIds((prev) => {
      const cleaned = prev.filter((id) => validSet.has(Number(id)));
      if (cleaned.length !== prev.length) {
        try {
          localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(cleaned));
        } catch {}
        return cleaned;
      }
      return prev;
    });
  }, []);

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        favoritesCount: favoriteIds.length,
        isFavorite,
        toggleFavorite,
        cleanInvalidFavorites,
        clearFavoritesLocal,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error(
      "useFavorites debe usarse dentro de un FavoritesContextProvider",
    );
  }
  return context;
}
