// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

const NotificationContext = createContext(null);

const DEFAULT_NOTIFICACIONES = [
  {
    id: 1,
    tipo: "pedido_estado",
    titulo: "¡Tu pedido está en preparación! 🥩",
    mensaje: "El cortador en Sucursal Luis Guillón comenzó a preparar tu pedido #VAL-0259.",
    fecha: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // Hace 15 min
    leida: false,
    icono: "package",
    pedido_id: "0259",
    accion_texto: "Ver seguimiento",
  },
  {
    id: 2,
    tipo: "puntos",
    titulo: "Sumaste 25 puntos Club Valette ⭐",
    mensaje: "Tu saldo acumulado ahora es de 140 puntos ($2.800 en bonificaciones).",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // Hace 2 horas
    leida: false,
    icono: "sparkles",
    accion_texto: "Ver mis puntos",
  },
  {
    id: 3,
    tipo: "promo",
    titulo: "🔥 Promo Fin de Semana Activada",
    mensaje: "Llevando 3 kg de Asado Criollo o Vacío congelás precio mayorista exclusivo.",
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Ayer
    leida: true,
    icono: "flame",
    accion_texto: "Ver ofertas",
    categoria: "asado",
  },
];

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("valette_notificaciones");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_NOTIFICACIONES;
  });

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("valette_notificaciones", JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.leida).length;
  }, [notifications]);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
  }, []);

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => [
      {
        id: Date.now(),
        fecha: new Date().toISOString(),
        leida: false,
        ...notif,
      },
      ...prev,
    ]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isNotificationsOpen,
        setIsNotificationsOpen,
        openNotifications: () => setIsNotificationsOpen(true),
        closeNotifications: () => setIsNotificationsOpen(false),
        markAsRead,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications debe ser usado dentro de NotificationProvider");
  }
  return ctx;
};
