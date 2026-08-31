// frontend-client/src/context/NotificationContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { API_URL } from "../config/api";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import { useToast } from "./ToastContext";

const NotificationContext = createContext(null);

/**
 * Convierte una clave VAPID pública base64 en Uint8Array para el Service Worker
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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
  const isSecureContext = typeof window !== "undefined" && window.isSecureContext;
  const supportsPush = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && isSecureContext;

  // Calcula el estado real actual de los permisos push
  const calcPushStatus = () => {
    if (!supportsPush) return "unsupported";
    const browserPermission = Notification.permission; // 'default' | 'granted' | 'denied'
    if (browserPermission === "granted" || browserPermission === "denied") {
      return browserPermission;
    }
    if (localStorage.getItem("valette_push_dismissed") === "true") {
      return "dismissed";
    }
    return "default";
  };

  const [pushStatus, setPushStatus] = useState(calcPushStatus);

  // 1. Registrar el Service Worker al inicio
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("⚙️ [Service Worker] Registrado con éxito en scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("⚠️ [Service Worker] Error al registrar:", err);
        });
    }
  }, []);

  // 2. Sincronizar suscripción Web Push con el backend
  const syncPushSubscription = useCallback(async (currentUserId) => {
    if (!supportsPush) return;
    try {
      if (Notification.permission !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      // Si no existe suscripción previa, obtener la clave pública VAPID y suscribir
      if (!sub) {
        const resKey = await fetch(`${API_URL}/notificaciones/push/public-key`);
        const { publicKey } = await resKey.json();
        if (!publicKey) {
          console.warn("⚠️ [Push] No se pudo obtener la clave VAPID pública");
          return;
        }

        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      // Enviar la suscripción al servidor vinculado al ID del cliente
      const subJson = sub.toJSON();
      await fetch(`${API_URL}/notificaciones/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: currentUserId || null,
          endpoint: sub.endpoint,
          keys: subJson.keys,
        }),
      });

      console.log("✅ [Push] Suscripción sincronizada con el backend para cliente:", currentUserId || "anónimo");
    } catch (err) {
      console.error("❌ [Push] Error al sincronizar suscripción push:", err);
    }
  }, [supportsPush]);

  // Re-sincronizar suscripción cuando el usuario inicia sesión o cambia de cuenta
  useEffect(() => {
    if (supportsPush && Notification.permission === "granted") {
      syncPushSubscription(user?.id);
    }
  }, [user?.id, supportsPush, syncPushSubscription]);

  const openNotifications = () => setIsDrawerOpen(true);
  const closeNotifications = () => setIsDrawerOpen(false);
  const toggleNotifications = () => setIsDrawerOpen((prev) => !prev);

  const resetPushDismissed = () => {
    localStorage.removeItem("valette_push_dismissed");
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

  // Escuchar eventos en vivo de Socket.io (cuando la web está abierta)
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
    };

    const handlePedidoActualizado = (pedido) => {
      console.log("📦 [NotificationContext] Actualizando estado vivo en notificaciones:", pedido);

      setNotifications((prev) =>
        prev.map((notif) => {
          if (notif.pedido_id === pedido.id) {
            return {
              ...notif,
              estado_pedido: pedido.estado || pedido.estado_local,
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

  // Solicitar permisos Push al navegador y suscribir con VAPID
  const requestPushPermission = async () => {
    if (!supportsPush) {
      setPushStatus("unsupported");
      return;
    }

    localStorage.removeItem("valette_push_dismissed");

    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);

      if (permission === "granted") {
        localStorage.setItem("valette_push_dismissed", "true");
        await syncPushSubscription(user?.id);
        if (toast) toast.success("¡Notificaciones en segundo plano activadas!");
      }
    } catch (err) {
      console.error("Error al solicitar permiso de notificación:", err);
    }
  };

  // Ocultar banner de permisos
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
