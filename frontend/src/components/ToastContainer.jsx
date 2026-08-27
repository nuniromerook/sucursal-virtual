// frontend/src/components/ToastContainer.jsx
import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { useCart } from "../context/CartContext";

/**
 * Configuración visual minimalista y sobria por tipo de Toast
 */
const TOAST_THEMES = {
  success: {
    containerClass: "bg-white/95 border-emerald-300 text-neutral-800 shadow-lg shadow-emerald-950/5",
    iconBg: "bg-emerald-500 text-white",
    defaultIcon: CheckCircle2,
    progressBar: "bg-emerald-500",
    actionBtn: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  error: {
    containerClass: "bg-white/95 border-rose-300 text-neutral-800 shadow-lg shadow-rose-950/5",
    iconBg: "bg-rose-500 text-white",
    defaultIcon: AlertCircle,
    progressBar: "bg-rose-500",
    actionBtn: "bg-rose-600 hover:bg-rose-700 text-white",
  },
  warning: {
    containerClass: "bg-white/95 border-amber-300 text-neutral-800 shadow-lg shadow-amber-950/5",
    iconBg: "bg-amber-500 text-white",
    defaultIcon: AlertTriangle,
    progressBar: "bg-amber-500",
    actionBtn: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  info: {
    containerClass: "bg-white/95 border-blue-200 text-neutral-800 shadow-lg shadow-blue-950/5",
    iconBg: "bg-main-blue text-white",
    defaultIcon: Info,
    progressBar: "bg-main-blue",
    actionBtn: "bg-main-blue hover:bg-main-blue/90 text-white",
  },
};

function ToastItem({ toast, onDismiss }) {
  const {
    id,
    type = "info",
    title,
    message,
    duration,
    action,
    closable = true,
    icon: CustomIcon,
    isExiting,
  } = toast;

  const theme = TOAST_THEMES[type] || TOAST_THEMES.info;
  const IconComponent = CustomIcon || theme.defaultIcon;

  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!duration || duration <= 0 || duration === Infinity) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 50);

    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div
      role="alert"
      className={`relative w-full max-w-xs sm:max-w-sm rounded-xl border shadow-md backdrop-blur-md overflow-hidden pointer-events-auto transition-all duration-200 ease-out transform ${
        isExiting
          ? "opacity-0 -translate-y-2 scale-95"
          : "opacity-100 translate-y-0 scale-100"
      } ${theme.containerClass}`}
    >
      <div className="p-3 flex items-start gap-2.5">
        {/* Icono temático compacto */}
        <div
          className={`size-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${theme.iconBg}`}
        >
          <IconComponent className="size-4" />
        </div>

        {/* Contenido textual compacto */}
        <div className="flex-1 min-w-0 pt-0.5">
          {title && (
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 leading-tight mb-0.5">
              {title}
            </h4>
          )}
          <p className="text-xs sm:text-sm font-medium text-neutral-700 leading-snug break-words">
            {message}
          </p>

          {/* Botón de acción interactivo */}
          {action && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof action.onClick === "function") {
                    action.onClick();
                  }
                  onDismiss(id);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer inline-flex items-center gap-1 ${
                  action.variantClass || theme.actionBtn
                }`}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>

        {/* Botón de cierre manual */}
        {closable && (
          <button
            type="button"
            onClick={() => onDismiss(id)}
            aria-label="Cerrar notificación"
            className="p-1 -mr-1 -mt-0.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Barra de progreso de auto-cierre */}
      {duration && duration > 0 && duration !== Infinity && (
        <div className="w-full h-0.5 bg-neutral-100">
          <div
            className={`h-full transition-all duration-75 ease-linear ${theme.progressBar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Contenedor flotante que apila las notificaciones verticalmente.
 * - En Mobile: centrado o discreto en la parte superior con márgenes seguros.
 * - En Desktop: si el CartDrawer está abierto, se desplaza suavemente hacia la izquierda
 *   para evitar superponerse al drawer del carrito.
 */
export default function ToastContainer({ toasts, onDismiss }) {
  const { isCartOpen } = useCart();

  if (!toasts || toasts.length === 0) return null;

  return (
    <aside
      aria-live="polite"
      aria-label="Notificaciones del sistema"
      className={`fixed top-3 z-9999 flex flex-col gap-2 pointer-events-none transition-all duration-300 ease-out left-3 right-3 sm:left-auto max-w-sm w-[calc(100%-1.5rem)] sm:w-auto ${
        isCartOpen ? "sm:right-[340px]" : "sm:right-5"
      }`}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </aside>
  );
}
