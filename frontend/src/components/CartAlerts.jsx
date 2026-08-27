// frontend/src/components/CartAlerts.jsx
import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Ban,
  Tag,
  X,
} from "lucide-react";

const ALERT_CONFIG = {
  price_up: {
    icon: TrendingUp,
    bg: "bg-red-50 border-red-200",
    iconColor: "text-red-500",
    titleColor: "text-red-700",
    title: "Precio actualizado",
    formatMsg: (a) =>
      `"${a.nombre}" subió de $${Number(a.precioAnterior).toFixed(2)} a $${Number(a.precioNuevo).toFixed(2)}.`,
  },
  price_down: {
    icon: TrendingDown,
    bg: "bg-green-50 border-green-200",
    iconColor: "text-green-600",
    titleColor: "text-green-700",
    title: "¡Precio mejorado!",
    formatMsg: (a) =>
      `"${a.nombre}" bajó de $${Number(a.precioAnterior).toFixed(2)} a $${Number(a.precioNuevo).toFixed(2)}. ¡Aprovechá!`,
  },
  inactive: {
    icon: Ban,
    bg: "bg-neutral-100 border-neutral-300",
    iconColor: "text-neutral-500",
    titleColor: "text-neutral-700",
    title: "Producto no disponible",
    formatMsg: (a) =>
      `"${a.nombre}" fue removido de tu carrito porque no está disponible actualmente.`,
  },
  promo_expired: {
    icon: Tag,
    bg: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-500",
    titleColor: "text-amber-700",
    title: "Promo vencida",
    formatMsg: (a) =>
      `La promoción de "${a.nombre}" ya no está vigente. Se calculó al precio regular.`,
  },
};

const CartAlerts = ({ alerts, onClearAll, onDismiss }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="px-4 pt-3 pb-1 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          Actualizaciones del carrito
        </p>
        <button
          type="button"
          onClick={onClearAll}
          className="text-[11px] text-neutral-400 hover:text-neutral-600 underline cursor-pointer transition-colors"
        >
          Cerrar todo
        </button>
      </div>

      {alerts.map((alert, idx) => {
        const config = ALERT_CONFIG[alert.type];
        if (!config) return null;

        const Icon = config.icon;

        return (
          <div
            key={`${alert.type}-${alert.catalogoId}-${idx}`}
            className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${config.bg}`}
          >
            <Icon className={`size-4 shrink-0 mt-0.5 ${config.iconColor}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-[11px] font-bold ${config.titleColor}`}>
                {config.title}
              </p>
              <p className="text-[11px] text-neutral-600 mt-0.5 leading-snug">
                {config.formatMsg(alert)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(idx)}
              aria-label="Descartar alerta"
              className="shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer mt-0.5"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default CartAlerts;
