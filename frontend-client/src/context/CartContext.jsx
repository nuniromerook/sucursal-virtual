// src/context/CartContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { calculateItemPrice } from "@/utils/priceCalculator";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  // Inicializar carrito con items de demostración o desde localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem("valette_cart");
      if (saved) return JSON.parse(saved);
    } catch {}
    // Items iniciales de prueba como en la maqueta
    return [
      {
        id: 1,
        nombre: "Vacío Especial de Novillito",
        slug: "vacio-especial-novillito",
        precio: 11900,
        cantidad_kg: 1,
        puntos: 15,
        corte: "Corte clásico (2 cm)",
        envasado: "Envasado al vacío",
        imagen_url:
          "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800",
        notas: "",
        promos: [{ cantidad_kg: 3, precio_promocional: 10500, activa: true }],
      },
      {
        id: 2,
        nombre: "Asado Criollo de Centro",
        slug: "asado-criollo-centro",
        precio: 10900,
        cantidad_kg: 1,
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

  // Cálculos financieros y métricas
  const {
    subtotal,
    totalAhorro,
    totalEstimado,
    totalKg,
    totalItems,
    totalPuntos,
  } = useMemo(() => {
    let sub = 0;
    let ahorro = 0;
    let total = 0;
    let kgSum = 0;
    let ptsSum = 0;

    cartItems.forEach((item) => {
      const calc = calculateItemPrice(item);
      const itemKg = parseFloat(item.cantidad_kg || 1);
      sub += Math.round(itemKg * parseFloat(item.precio || 0));
      ahorro += calc.ahorro;
      total += calc.total;
      kgSum += itemKg;
      ptsSum += (item.puntos || 10) * Math.ceil(itemKg);
    });

    return {
      subtotal: sub,
      totalAhorro: ahorro,
      totalEstimado: total,
      totalKg: parseFloat(kgSum.toFixed(2)),
      totalItems: cartItems.length,
      totalPuntos: ptsSum,
    };
  }, [cartItems]);

  const addToCart = (product, kg = 1, options = {}) => {
    const intKg = Math.max(1, Math.round(Number(kg) || 1));
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          cantidad_kg: Math.round(updated[existingIndex].cantidad_kg + intKg),
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
          cantidad_kg: intKg,
          puntos: product.puntos || 15,
          promos: product.promos || [],
          corte: options.corte || "Corte tradicional",
          envasado: options.envasado || "Bandeja Filmada",
          notas: options.notas || "",
        },
      ];
    });
  };

  const updateItemKg = (id, newKg) => {
    const intKg = Math.round(Number(newKg));
    if (intKg <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, cantidad_kg: intKg } : item,
      ),
    );
  };

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
        subtotal,
        totalAhorro,
        totalEstimado,
        totalPuntos,
        addToCart,
        updateItemKg,
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
