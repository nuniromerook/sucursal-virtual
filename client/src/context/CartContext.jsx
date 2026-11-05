import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { calculateItemPrice } from "@/utils/priceCalculator";
import { formatUnidadMedida } from "@/utils/formatters";
import { API_URL } from "@/config/api";
import { trackEvent } from "@/utils/analytics";

const CartContext = createContext(null);

const DEFAULT_CUT_IMAGE =
  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800";

function getOrCreateSesionId() {
  try {
    let id = localStorage.getItem("valette_sesion_id");
    if (!id) {
      id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem("valette_sesion_id", id);
    }
    return id;
  } catch {
    return `dev_${Date.now()}`;
  }
}

function getAuthHeaders() {
  try {
    const token = localStorage.getItem("valette_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export const CartProvider = ({ children }) => {
  const [sesionId] = useState(getOrCreateSesionId);

  // Pedido activo en seguimiento en vivo
  const [activeOrderId, setActiveOrderIdState] = useState(() => {
    try {
      const saved = localStorage.getItem("valette_active_order_id");
      return saved ? Number(saved) || null : null;
    } catch {
      return null;
    }
  });

  const setActiveOrderId = useCallback((orderId) => {
    setActiveOrderIdState(orderId ? Number(orderId) : null);
    try {
      if (orderId) {
        localStorage.setItem("valette_active_order_id", String(orderId));
      } else {
        localStorage.removeItem("valette_active_order_id");
      }
    } catch {}
  }, []);

  // Inicializar carrito real desde localStorage (sin ítems demo hardcodeados)
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem("valette_cart_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => ({
            ...item,
            unidad_medida: formatUnidadMedida(item.unidad_medida || "kg"),
            imagen_url:
              item.imagen_url ||
              item.imagenUrl ||
              item.image ||
              DEFAULT_CUT_IMAGE,
          }));
        }
      }
    } catch {}
    return [];
  });

  const [isCartOpen, setIsCartOpenState] = useState(false);
  const hasHydratedCloudRef = useRef(false);
  const skipNextCloudSyncRef = useRef(false);

  // Registrar paso del embudo en PostgreSQL (carritos.ultimo_paso / motivo_abandono)
  const registerFunnelStep = useCallback(
    async (ultimoPaso, motivoAbandono = undefined) => {
      try {
        trackEvent("embudo_checkout", ultimoPaso, {
          motivo_abandono: motivoAbandono || null,
        });
        await fetch(`${API_URL}/carritos/paso`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            sesion_id: sesionId,
            ultimo_paso: ultimoPaso,
            ...(motivoAbandono !== undefined
              ? { motivo_abandono: motivoAbandono }
              : {}),
          }),
        });
      } catch {
        // Silencioso en caso de desconexión momentánea
      }
    },
    [sesionId]
  );

  const setIsCartOpen = useCallback(
    (nextOpen) => {
      setIsCartOpenState((prev) => {
        const resolved =
          typeof nextOpen === "function" ? nextOpen(prev) : Boolean(nextOpen);
        if (resolved && !prev) {
          registerFunnelStep("carrito_abierto", null);
        }
        return resolved;
      });
    },
    [registerFunnelStep]
  );

  // 1. Al montar: recuperar carrito en la nube si el dispositivo no tiene items locales
  useEffect(() => {
    let isMounted = true;
    const hydrateFromCloud = async () => {
      try {
        if (cartItems.length === 0) {
          const res = await fetch(
            `${API_URL}/carritos/mi-carrito?sesion_id=${encodeURIComponent(sesionId)}`,
            {
              headers: {
                ...getAuthHeaders(),
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            if (
              isMounted &&
              Array.isArray(data.items) &&
              data.items.length > 0
            ) {
              skipNextCloudSyncRef.current = true;
              setCartItems(
                data.items.map((item) => ({
                  ...item,
                  nombre: item.nombre || item.nombre_producto,
                  unidad_medida: formatUnidadMedida(item.unidad_medida || "kg"),
                  imagen_url:
                    item.imagen_url || item.imagenUrl || DEFAULT_CUT_IMAGE,
                }))
              );
            }
          }
        }
      } catch {
        // Mantener estado local si la API no responde
      } finally {
        if (isMounted) {
          hasHydratedCloudRef.current = true;
        }
      }
    };

    hydrateFromCloud();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesionId]);

  // 2. Persistir en localStorage y sincronizar con PostgreSQL (carritos + carrito_items)
  useEffect(() => {
    try {
      localStorage.setItem("valette_cart_v1", JSON.stringify(cartItems));
    } catch {}

    if (!hasHydratedCloudRef.current) return;
    if (skipNextCloudSyncRef.current) {
      skipNextCloudSyncRef.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      try {
        await fetch(`${API_URL}/carritos/sincronizar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            sesion_id: sesionId,
            replace: true,
            items: cartItems.map((it) => ({
              id: it.id,
              catalogo_id: it.catalogo_id || it.id,
              nombre: it.nombre || it.nombre_producto,
              slug: it.slug,
              precio: Number(it.precio) || 0,
              cantidad_kg: Number(it.cantidad_kg || it.cantidad || 1),
              unidad_medida: it.unidad_medida || "kg",
              corte: it.corte || "Corte tradicional",
              imagen_url: it.imagen_url,
              puntos: it.puntos || 15,
              promos: it.promos || [],
            })),
          }),
        });
      } catch {
        // Ignorar errores de red en background
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [cartItems, sesionId]);

  // Cálculos financieros y métricas (separando kilos de unidades)
  const {
    subtotal,
    totalAhorro,
    totalEstimado,
    totalKg,
    totalUnidades,
    totalItems,
    totalPuntos,
  } = useMemo(() => {
    let sub = 0;
    let ahorro = 0;
    let total = 0;
    let kgSum = 0;
    let uSum = 0;
    let ptsSum = 0;

    cartItems.forEach((item) => {
      const calc = calculateItemPrice(item);
      const itemCant = parseFloat(item.cantidad_kg || item.cantidad || 1);
      sub += Math.round(itemCant * parseFloat(item.precio || 0));
      ahorro += calc.ahorro;
      total += calc.total;
      if (item.unidad_medida === "u") {
        uSum += itemCant;
      } else {
        kgSum += itemCant;
      }
      ptsSum += (item.puntos || 10) * Math.ceil(itemCant);
    });

    return {
      subtotal: sub,
      totalAhorro: ahorro,
      totalEstimado: total,
      totalKg: parseFloat(kgSum.toFixed(2)),
      totalUnidades: Math.round(uSum),
      totalItems: cartItems.length,
      totalPuntos: ptsSum,
    };
  }, [cartItems]);

  const addToCart = (product, cantidad = 1, options = {}) => {
    const intCant = Math.max(1, Math.round(Number(cantidad) || 1));
    const unidadMedida = formatUnidadMedida(
      product.unidad_medida || options.unidad_medida || "kg"
    );
    trackEvent("agregar_carrito", product.id, {
      nombre: product.nombre || product.nombre_producto,
      cantidad: intCant,
      unidad: unidadMedida,
      corte: options.corte || "Corte tradicional",
    });
    const imageUrl =
      product.imagen_url ||
      product.imagenUrl ||
      product.image ||
      options.imagen_url ||
      options.imagenUrl ||
      DEFAULT_CUT_IMAGE;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const prevCant =
          updated[existingIndex].cantidad_kg ||
          updated[existingIndex].cantidad ||
          1;
        updated[existingIndex] = {
          ...updated[existingIndex],
          cantidad_kg: Math.round(prevCant + intCant),
          cantidad: Math.round(prevCant + intCant),
          unidad_medida:
            updated[existingIndex].unidad_medida || unidadMedida,
          imagen_url: updated[existingIndex].imagen_url || imageUrl,
          ...options,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: product.id,
          catalogo_id: product.catalogo_id || product.id,
          es_combo: Boolean(product.es_combo),
          combo_id: product.combo_id || null,
          nombre: product.nombre || product.nombre_producto,
          slug: product.slug,
          precio: product.precio,
          cantidad_kg: intCant,
          cantidad: intCant,
          unidad_medida: unidadMedida,
          puntos: product.puntos || 15,
          promos: product.promos || [],
          corte:
            options.corte ||
            (unidadMedida === "u" ? "Estándar" : "Corte tradicional"),
          envasado: options.envasado || "Bandeja Filmada",
          notas: options.notas || "",
          imagen_url: imageUrl,
          items_combo: options.items_combo || undefined,
        },
      ];
    });
  };

  const updateItemCantidad = (id, newCant) => {
    const intCant = Math.round(Number(newCant));
    if (intCant <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, cantidad_kg: intCant, cantidad: intCant }
          : item
      )
    );
  };

  const updateItemKg = updateItemCantidad;

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        sesionId,
        activeOrderId,
        setActiveOrderId,
        registerFunnelStep,
        cartItems,
        totalItems,
        totalKg,
        totalUnidades,
        subtotal,
        totalAhorro,
        totalEstimado,
        totalPuntos,
        addToCart,
        updateItemKg,
        updateItemCantidad,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe ser usado dentro de CartProvider");
  return ctx;
};
