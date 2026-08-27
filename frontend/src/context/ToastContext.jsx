// frontend/src/context/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import ToastContainer from "../components/ToastContainer";

export const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastContextProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    // Si tiene un timer activo, lo limpiamos
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id));
      timersRef.current.delete(id);
    }

    // Marcamos primero con animación de salida
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );

    // Luego de la animación (250ms), lo quitamos del estado
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  /**
   * Agrega un nuevo Toast. Al agregarse al inicio del array ([newToast, ...prev]),
   * empuja automáticamente a las notificaciones anteriores hacia abajo en el contenedor flex-col.
   */
  const addToast = useCallback(
    ({
      type = "info", // "success" | "error" | "warning" | "info"
      title = "",
      message = "",
      duration = 4500, // milisegundos (0 o Infinity para persistente)
      action = null, // { label: string, onClick: function, variant?: string }
      closable = true,
      icon = null,
    }) => {
      const id = ++toastIdCounter;

      const newToast = {
        id,
        type,
        title,
        message,
        duration,
        action,
        closable,
        icon,
        isExiting: false,
        createdAt: Date.now(),
      };

      // Nuevo toast arriba (empuja a los viejos hacia abajo)
      setToasts((prev) => [newToast, ...prev]);

      // Auto-dismiss si tiene duración definida
      if (duration && duration > 0 && duration !== Infinity) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [removeToast]
  );

  // Helper shortcuts para simplificar el uso en cualquier parte
  const toast = {
    show: (options) => addToast(typeof options === "string" ? { message: options } : options),
    success: (message, options = {}) =>
      addToast({
        type: "success",
        message,
        ...options,
      }),
    error: (message, options = {}) =>
      addToast({
        type: "error",
        message,
        duration: options.duration ?? 6000,
        ...options,
      }),
    warning: (message, options = {}) =>
      addToast({
        type: "warning",
        message,
        duration: options.duration ?? 5000,
        ...options,
      }),
    info: (message, options = {}) =>
      addToast({
        type: "info",
        message,
        ...options,
      }),
    dismiss: (id) => removeToast(id),
    clear: () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
      setToasts([]);
    },
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe ser utilizado dentro de un ToastContextProvider");
  }
  return context;
};
