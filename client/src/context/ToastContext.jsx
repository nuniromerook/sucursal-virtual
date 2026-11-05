// src/context/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { Check, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success", // success | error | info
  });
  const timerRef = useRef(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const showToast = useCallback((message, type = "success") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ visible: true, message, type });
    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* Toast Flotante accesible con región viva y botón de cierre explícito */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`fixed bottom-20 lg:top-6 inset-x-0 sm:right-6 z-50 flex h-fit w-fit max-w-[95vw] mx-auto items-center gap-3 px-3.5 p-3 rounded-xl bg-slate-900 text-white shadow-2xl transition-all duration-300 text-xs ${
          toast.visible
            ? "translate-y-0 opacity-100"
            : "translate-y-16 opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`size-6 rounded-full flex items-center justify-center shrink-0 ${
            toast.type === "error"
              ? "bg-red-500 text-white"
              : toast.type === "info"
                ? "bg-blue-500 text-white"
                : "bg-emerald-500 text-white"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="size-3.5 stroke-[2.5]" />
          ) : toast.type === "info" ? (
            <Info className="size-3.5 stroke-[2.5]" />
          ) : (
            <Check className="size-3.5 stroke-[2.5]" />
          )}
        </div>
        <span className="font-bold tracking-tight">{toast.message}</span>
        <button
          type="button"
          onClick={hideToast}
          aria-label="Cerrar notificación"
          className="ml-1 size-5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe ser usado dentro de ToastProvider");
  return ctx;
};
