// frontend/src/context/CartContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { VITE_API_URL } from "../config/api";

export const CartContext = createContext();

const CART_STORAGE_KEY = "valette_cart";

/**
 * Calcula el total regular, total con promociones y ahorro para un item
 * dado su cantidad y promos activas (lógica escalonada por volumen).
 */
export const calculateItemPrice = (item) => {
  const qty = Number(item.cantidad_kg) || 0;
  const unitPrice = Number(item.precio) || 0;
  const regularTotal = unitPrice * qty;
  const promos = Array.isArray(item.promos) ? item.promos : [];

  if (qty <= 0 || unitPrice <= 0) {
    return {
      total: 0,
      regularTotal: 0,
      ahorro: 0,
      hasPromo: false,
      appliedPromo: null,
    };
  }

  // 1. Coincidencia exacta con un tramo promocional
  const exactPromo = promos.find(
    (p) => Number(p.cantidad_kg) === qty && p.activa !== false,
  );
  if (exactPromo) {
    const promoTotal = Number(exactPromo.precio_promocional);
    const ahorro = Math.max(0, regularTotal - promoTotal);
    return {
      total: promoTotal,
      regularTotal,
      ahorro,
      hasPromo: ahorro > 0,
      appliedPromo: exactPromo,
    };
  }

  // 2. Combinación de tramos descendentes para cantidades mayores
  const sortedPromos = [...promos]
    .filter((p) => p.activa !== false && Number(p.cantidad_kg) > 0)
    .sort((a, b) => Number(b.cantidad_kg) - Number(a.cantidad_kg));

  let remainingQty = qty;
  let computedTotal = 0;
  let promoApplied = null;

  for (const promo of sortedPromos) {
    const promoKg = Number(promo.cantidad_kg);
    const promoPrice = Number(promo.precio_promocional);
    if (remainingQty >= promoKg) {
      const paquetes = Math.floor(remainingQty / promoKg);
      computedTotal += paquetes * promoPrice;
      remainingQty = remainingQty % promoKg;
      if (!promoApplied) promoApplied = promo;
    }
  }

  // El sobrante que no llega a promo se cobra a precio regular
  if (remainingQty > 0) computedTotal += remainingQty * unitPrice;

  const ahorro = Math.max(0, regularTotal - computedTotal);
  return {
    total: computedTotal,
    regularTotal,
    ahorro,
    hasPromo: ahorro > 0,
    appliedPromo: promoApplied,
  };
};

export function CartContextProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartAlerts, setCartAlerts] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Referencia al token actual para no incluir AuthContext como dependencia circular
  const tokenRef = useRef(null);

  // Exponer un setter de token que AuthContext invocará
  const setAuthToken = useCallback((token) => {
    tokenRef.current = token;
  }, []);

  // Persistir en localStorage cada vez que cambie cartItems
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error("Error saving cart to localStorage:", e);
    }
  }, [cartItems]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  // ─── Sincronización con DB ─────────────────────────────────────────────

  /**
   * Sube el carrito al backend y actualiza el estado local con el resultado
   * validado (precio fresco, productos activos, promos vigentes).
   * Se llama automáticamente al detectar login en AuthContext.
   */
  const sincronizarCarrito = useCallback(
    async (token, itemsToSync) => {
      if (!token) return;
      const items = itemsToSync ?? cartItems;

      setIsSyncing(true);
      try {
        const res = await fetch(`${VITE_API_URL}/carritos/sincronizar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ items }),
        });

        if (!res.ok) return;

        const data = await res.json();

        // Reemplazar el carrito local con el validado por el backend
        if (Array.isArray(data.items)) {
          setCartItems(data.items);
        }

        // Mostrar alertas de cambios detectados
        if (Array.isArray(data.alerts) && data.alerts.length > 0) {
          setCartAlerts(data.alerts);
          setIsCartOpen(true); // Abrir el drawer para que el usuario vea las alertas
        }
      } catch (error) {
        console.error("Error al sincronizar carrito con DB:", error);
      } finally {
        setIsSyncing(false);
      }
    },
    [cartItems],
  );

  /**
   * Persiste un cambio de cantidad en background (fire-and-forget).
   * No bloquea la UI.
   */
  const persistItemChange = useCallback((catalogoId, cantidad_kg) => {
    const token = tokenRef.current;
    if (!token) return;

    fetch(`${VITE_API_URL}/carritos/mi-carrito/item/${catalogoId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cantidad_kg }),
    }).catch(() => {
      // Silencioso: el estado local ya fue actualizado
    });
  }, []);

  /**
   * Limpia el carrito en DB (al cerrar sesión o hacer clearCart estando logueado).
   */
  const clearCarritoDB = useCallback(() => {
    const token = tokenRef.current;
    if (!token) return;

    fetch(`${VITE_API_URL}/carritos/mi-carrito`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }, []);

  /**
   * Actualización manual del carrito desde la DB.
   * Trae precios y promos frescos sin reemplazar el carrito local
   * (usa sincronizarCarrito para que el backend valide y unifique).
   */
  const refetchCarrito = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    await sincronizarCarrito(token);
  }, [sincronizarCarrito]);

  // ─── Operaciones de carrito ────────────────────────────────────────────

  const addToCart = (product, cantidadKg = 1) => {
    const qtyToAdd = Number(cantidadKg) > 0 ? Number(cantidadKg) : 1;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.id === product.id,
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty =
          (Number(updated[existingIndex].cantidad_kg) || 0) + qtyToAdd;
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...product,
          cantidad_kg: newQty,
        };
        // Persistir en background
        persistItemChange(product.id, newQty);
        return updated;
      }

      const newItem = {
        id: product.id,
        nombre_producto: product.nombre_producto,
        slug: product.slug,
        descripcion: product.descripcion,
        especie: product.especie,
        categoria: product.categoria,
        imagen_url: product.imagen_url,
        unidad_medida: product.unidad_medida || "kg",
        precio: Number(product.precio) || 0,
        precio_anterior: Number(product.precio_anterior) || 0,
        promos: Array.isArray(product.promos) ? product.promos : [],
        gana_puntos: Boolean(product.gana_puntos),
        puntos: Number(product.puntos) || 0,
        cantidad_kg: qtyToAdd,
      };
      persistItemChange(product.id, qtyToAdd);
      return [...prevItems, newItem];
    });

    setIsCartOpen(true);
  };

  const updateQuantity = (productId, newQuantity) => {
    const qty = Number(newQuantity);
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, cantidad_kg: qty } : item,
      ),
    );
    persistItemChange(productId, qty);
  };

  const incrementQuantity = (productId) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === productId) {
          const newQty = (Number(item.cantidad_kg) || 0) + 1;
          persistItemChange(productId, newQty);
          return { ...item, cantidad_kg: newQty };
        }
        return item;
      }),
    );
  };

  const decrementQuantity = (productId) => {
    setCartItems((prevItems) => {
      const updated = prevItems
        .map((item) => {
          if (item.id === productId) {
            const newQty = (Number(item.cantidad_kg) || 0) - 1;
            if (newQty <= 0) {
              persistItemChange(productId, 0);
              return null;
            }
            persistItemChange(productId, newQty);
            return { ...item, cantidad_kg: newQty };
          }
          return item;
        })
        .filter(Boolean);
      return updated;
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId),
    );
    persistItemChange(productId, 0);
  };

  const clearCart = () => {
    setCartItems([]);
    clearCarritoDB();
  };

  // ─── Alertas ───────────────────────────────────────────────────────────

  const dismissAlert = (idx) => {
    setCartAlerts((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearAlerts = () => setCartAlerts([]);

  // ─── Totales ───────────────────────────────────────────────────────────

  const summary = useMemo(() => {
    let subtotal = 0;
    let totalEstimado = 0;
    let totalAhorro = 0;
    let totalKg = 0;
    let totalUnidades = 0;
    const totalItems = cartItems.length;
    let totalPuntos = 0;

    for (const item of cartItems) {
      const calc = calculateItemPrice(item);
      subtotal += calc.regularTotal;
      totalEstimado += calc.total;
      totalAhorro += calc.ahorro;

      const qty = Number(item.cantidad_kg) || 0;
      const unidad = (item.unidad_medida || "kg").toLowerCase().trim();
      if (
        unidad === "u" ||
        unidad === "unidad" ||
        unidad === "unidades" ||
        unidad === "unid."
      ) {
        totalUnidades += qty;
      } else {
        totalKg += qty;
      }

      if (item.gana_puntos && item.puntos > 0) {
        totalPuntos += Number(item.puntos);
      }
    }

    // Resumen combinado ej: "1 kg y 2 u" o "2 kg" o "5 u"
    const resumenPartes = [];
    if (totalKg > 0) {
      resumenPartes.push(
        totalKg % 1 === 0
          ? `${Math.round(totalKg)} kg`
          : `${totalKg.toLocaleString("es-AR")} kg`,
      );
    }
    if (totalUnidades > 0) {
      resumenPartes.push(`${totalUnidades} u`);
    }
    const resumenCantidad =
      resumenPartes.length > 0 ? resumenPartes.join(" y ") : "0 kg";

    return {
      subtotal,
      totalEstimado,
      totalAhorro,
      totalKg,
      totalUnidades,
      resumenCantidad,
      totalItems,
      totalPuntos,
    };
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        // Estado
        cartItems,
        isCartOpen,
        isSyncing,
        cartAlerts,
        // Acciones de UI
        openCart,
        closeCart,
        toggleCart,
        // Acciones de carrito
        addToCart,
        updateQuantity,
        incrementQuantity,
        decrementQuantity,
        removeFromCart,
        clearCart,
        // Alertas
        dismissAlert,
        clearAlerts,
        // Sincronización (llamada desde AuthContext)
        sincronizarCarrito,
        setAuthToken,
        clearCarritoDB,
        refetchCarrito,
        // Totales
        ...summary,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe ser usado dentro de un CartContextProvider");
  }
  return context;
};
