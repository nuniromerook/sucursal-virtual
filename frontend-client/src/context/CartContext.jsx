import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { calculateItemPrice } from "@/utils/priceCalculator";
import { formatUnidadMedida } from "@/utils/formatters";

const CartContext = createContext(null);

const DEFAULT_CUT_IMAGE =
  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800";

export const CartProvider = ({ children }) => {
  // Inicializar carrito con items de demostración o desde localStorage (asegurando imagen_url y unidad_medida)
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem("valette_cart");
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
    // Items iniciales de prueba como en la maqueta
    return [
      {
        id: 1,
        nombre: "Vacío Especial de Novillito",
        slug: "vacio-especial-novillito",
        precio: 11900,
        cantidad_kg: 1,
        cantidad: 1,
        unidad_medida: "kg",
        puntos: 15,
        corte: "Corte clásico (2 cm)",
        envasado: "Envasado al vacío",
        imagen_url:
          "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800",
        notas: "",
        promos: [{ cantidad_kg: 3, precio_promocional: 10500, activa: true }],
      },
      {
        id: 2,
        nombre: "Asado Criollo de Centro",
        slug: "asado-criollo-centro",
        precio: 10900,
        cantidad_kg: 1,
        cantidad: 1,
        unidad_medida: "kg",
        puntos: 20,
        corte: "Tiras tradicionales",
        envasado: "Bandeja filmada",
        imagen_url:
          "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800",
        notas: "",
        promos: [{ cantidad_kg: 3, precio_promocional: 9990, activa: true }],
      },
    ];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("valette_cart", JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

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
