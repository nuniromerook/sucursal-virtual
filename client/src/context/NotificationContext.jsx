// src/context/NotificationContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { API_URL } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

const NotificationContext = createContext(null);

const STORAGE_KEY = "valette_notificaciones_v1";

function normalizeNotification(n) {
  if (!n) return null;
  const tipo = n.tipo || "sistema";
  const isPedido = tipo === "pedido" || tipo === "pedido_estado" || Boolean(n.pedido_id && tipo !== "puntos");
  let accionTexto = n.accion_texto;
  if (!accionTexto) {
    if (isPedido) accionTexto = "Ver seguimiento en vivo";
    else if (tipo === "puntos") accionTexto = "Ver mis puntos";
    else if (tipo === "promo") accionTexto = "Ver ofertas";
  }

  return {
    ...n,
    tipo: isPedido ? "pedido" : tipo,
    fecha: n.creada_en || n.fecha || new Date().toISOString(),
    leida: Boolean(n.leida),
    accion_texto: accionTexto,
  };
}

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const userId = user?.id || null;
  const { activeOrderId } = useCart();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeNotification).filter(Boolean);
        }
      }
    } catch {}
    return [];
  });

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Persistir copia local en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // 1. Sincronizar notificaciones reales desde PostgreSQL (GET /notificaciones)
  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (userId) params.set("cliente_id", String(userId));
      if (activeOrderId) params.set("pedido_id", String(activeOrderId));

      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const qs = params.toString();
      const res = await fetch(
        `${API_URL}/notificaciones${qs ? `?${qs}` : ""}`,
        { headers }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.notificaciones)) {
        setNotifications(
          data.notificaciones.map(normalizeNotification).filter(Boolean)
        );
      }
    } catch {
      // Conservar caché local si no hay red
    }
  }, [userId, token, activeOrderId]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!isMounted) return;
      await fetchNotifications();
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [fetchNotifications]);

  // 2. Suscripción en tiempo real vía Socket.io (join_cliente + join_pedido + nueva_notificacion)
  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      if (userId) {
        socket.emit("join_cliente", userId);
      }
      if (activeOrderId) {
        socket.emit("join_pedido", activeOrderId);
      }
    });

    socket.on("nueva_notificacion", (rawNotif) => {
      const notif = normalizeNotification(rawNotif);
      if (!notif) return;

      setNotifications((prev) => {
        const existsIdx = prev.findIndex((item) => item.id === notif.id);
        if (existsIdx !== -1) {
          const copy = [...prev];
          copy[existsIdx] = notif;
          // Mover al principio al actualizarse una notificación viva de pedido
          const [updatedItem] = copy.splice(existsIdx, 1);
          return [updatedItem, ...copy];
        }
        return [notif, ...prev];
      });

      if (notif.titulo) {
        showToast(notif.titulo, "info");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, activeOrderId, showToast]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.leida).length;
  }, [notifications]);

  const markAsRead = useCallback(
    async (id) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );

      if (!id) return;
      try {
        const headers = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        await fetch(`${API_URL}/notificaciones/${id}/leida`, {
          method: "PATCH",
          headers,
        });
      } catch {}
    },
    [token]
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      await fetch(`${API_URL}/notificaciones/marcar-todas-leidas`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          cliente_id: userId,
          pedido_id: activeOrderId || null,
        }),
      });
    } catch {}
  }, [token, userId, activeOrderId]);

  const addNotification = useCallback((notif) => {
    const normalized = normalizeNotification({
      id: Date.now(),
      creada_en: new Date().toISOString(),
      leida: false,
      ...notif,
    });
    if (!normalized) return;
    setNotifications((prev) => [normalized, ...prev]);
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
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications debe ser usado dentro de NotificationProvider"
    );
  }
  return ctx;
};
