// frontend-client/src/context/NotificationContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { API_URL } from "../config/api";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import { useToast } from "./ToastContext";

const NotificationContext = createContext(null);

export const NotificationContextProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Detección de plataforma
  const isIOS = typeof navigator !== "undefined" && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
  const isStandalone = typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true);
  // La API de Notifications requiere contexto seguro (https:// o localhost)
  const isSecureContext = typeof window !== "undefined" && window.isSecureContext;
  const supportsPush = typeof window !== "undefined" && "Notification" in window && isSecureContext;

  // Calcula el estado real actual de los permisos push
  const calcPushStatus = () => {
    if (!supportsPush) return "unsupported";
    const browserPermission = Notification.permission; // 'default' | 'granted' | 'denied'
    // Si ya fue explícitamente concedido o denegado, ese es el estado real
    if (browserPermission === "granted" || browserPermission === "denied") {
      return browserPermission;
    }
    // Solo ocultamos el banner si el usuario tocó "Ahora no" Y el navegador
    // todavía no lo denegó (cuando el usuario ya respondió, el navegador lo guarda)
    if (localStorage.getItem("valette_push_dismissed") === "true") {
      return "dismissed";
    }
    return "default";
  };

  // Estado de permisos push: 'default' | 'granted' | 'denied' | 'unsupported' | 'dismissed'
  const [pushStatus, setPushStatus] = useState(calcPushStatus);

  // Re-sincronizar el estado real del navegador cuando cambia (ej: el usuario revoca desde config del browser)
  useEffect(() => {
    if (!supportsPush) return;
    const newStatus = calcPushStatus();
    setPushStatus(newStatus);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openNotifications = () => setIsDrawerOpen(true);
  const closeNotifications = () => setIsDrawerOpen(false);
  const toggleNotifications = () => setIsDrawerOpen((prev) => !prev);

  const resetPushDismissed = () => {
    localStorage.removeItem("valette_push_dismissed");
    // Mostrar de nuevo el banner de activación
    setPushStatus(supportsPush ? Notification.permission : "unsupported");
  };

  // Cargar notificaciones desde la API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated && !user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/notificaciones?cliente_id=${user.id}`, {
        headers,
      });

      if (!res.ok) return;

      const data = await res.json();
      setNotifications(Array.isArray(data.notificaciones) ? data.notificaciones : []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token, user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Escuchar eventos en vivo de Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleNuevaNotificacion = (notif) => {
      console.log("🔔 [NotificationContext] Nueva notificación recibida:", notif);

      setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
      setUnreadCount((prev) => prev + 1);

      // Toast emergente en vivo
      if (toast) {
        toast.info(`${notif.titulo}: ${notif.mensaje}`);
      }

      // Notificación nativa del navegador si tiene permiso
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(notif.titulo, {
            body: notif.mensaje,
            icon: "/favicon.svg",
          });
        } catch (e) {
          console.warn("Error mostrando notificación push:", e);
        }
      }
    };

    const handlePedidoActualizado = (pedido) => {
      console.log("📦 [NotificationContext] Actualizando estado vivo en notificaciones:", pedido);

      setNotifications((prev) =>
        prev.map((notif) => {
          if (notif.pedido_id === pedido.id) {
            return {
              ...notif,
              estado_pedido: pedido.estado,
            };
          }
          return notif;
        })
      );
    };

    socket.on("nueva_notificacion", handleNuevaNotificacion);
    socket.on("pedido_actualizado", handlePedidoActualizado);

    return () => {
      socket.off("nueva_notificacion", handleNuevaNotificacion);
      socket.off("pedido_actualizado", handlePedidoActualizado);
    };
  }, [socket, toast]);

  // Marcar una notificación como leída
  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`${API_URL}/notificaciones/${id}/leida`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (error) {
      console.error("Error al marcar leída:", error);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
    setUnreadCount(0);

    try {
      await fetch(`${API_URL}/notificaciones/marcar-todas-leidas`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ cliente_id: user?.id }),
      });
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
    }
  };

  // Solicitar permisos Push al navegador
  // Compatible con browsers modernos (Promise) y legacy Android (callback)
  const requestPushPermission = () => {
    if (!supportsPush) {
      setPushStatus("unsupported");
      return;
    }

    // Primero limpiamos el dismissed para no bloquearnos
    localStorage.removeItem("valette_push_dismissed");

    const handleResult = (permission) => {
      const resolved = permission || Notification.permission;
      setPushStatus(resolved);
      if (resolved === "granted") {
        localStorage.setItem("valette_push_dismissed", "true");
        if (toast) toast.success("¡Notificaciones activadas con éxito!");
      }
    };

    try {
      const result = Notification.requestPermission();
      if (result && typeof result.then === "function") {
        // API moderna — retorna Promise
        result.then(handleResult).catch((err) => {
          console.error("Error al solicitar permiso push:", err);
        });
      } else {
        // API legacy (callback) — algunos Android Chrome viejos
        handleResult(result);
      }
    } catch (err) {
      console.error("Error al solicitar permiso de notificación:", err);
    }
  };

  // Ocultar banner de permisos permanentemente
  const dismissPushPrompt = () => {
    localStorage.setItem("valette_push_dismissed", "true");
    setPushStatus("dismissed");
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        isDrawerOpen,
        openNotifications,
        closeNotifications,
        toggleNotifications,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
        pushStatus,
        supportsPush,
        isIOS,
        isStandalone,
        isSecureContext,
        requestPushPermission,
        dismissPushPrompt,
        resetPushDismissed,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications debe ser usado dentro de NotificationContextProvider");
  }
  return context;
};
