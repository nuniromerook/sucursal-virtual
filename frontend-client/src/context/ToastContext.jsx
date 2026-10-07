// src/context/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";
import { Check, AlertCircle, Info } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success", // success | error | info
  });

  const showToast = useCallback((message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Flotante estilo iOS / Android nativo */}
      <div
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
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe ser usado dentro de ToastProvider");
  return ctx;
};
