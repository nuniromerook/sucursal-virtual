// src/components/modals/NotificationsModal.jsx
import React, { useState } from "react";
import {
  X,
  Bell,
  CheckCheck,
  Package,
  Sparkles,
  Flame,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import { useNotifications } from "@/context/NotificationContext";
import { useCart } from "@/context/CartContext";

// Helper para formato de tiempo relativo en español
const formatTiempoRelativo = (fechaStr) => {
  if (!fechaStr) return "";
  const ahora = new Date();
  const fecha = new Date(fechaStr);
  const diffSegundos = Math.floor((ahora - fecha) / 1000);

  if (diffSegundos < 60) return "Ahora";
  const diffMinutos = Math.floor(diffSegundos / 60);
  if (diffMinutos < 60) return `Hace ${diffMinutos} min`;
  const diffHoras = Math.floor(diffMinutos / 60);
  if (diffHoras < 24) return `Hace ${diffHoras} h`;
  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias === 1) return "Ayer";
  return `Hace ${diffDias} días`;
};

export const NotificationsModal = ({
  isOpen,
  onClose,
  onBack,
  onOpenTrackingModal,
  onOpenProfileModal,
}) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const { setActiveOrderId } = useCart();

  const [filter, setFilter] = useState("todas"); // "todas" | "no_leidas"
  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    onBack || onClose,
  );

  if (!isOpen) return null;

  const filteredList = notifications.filter((n) => {
    if (filter === "no_leidas") return !n.leida;
    return true;
  });

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);

    if (
      notif.tipo === "pedido" ||
      notif.tipo === "pedido_estado" ||
      notif.pedido_id
    ) {
      if (notif.pedido_id) {
        setActiveOrderId(notif.pedido_id);
      }
      if (onOpenTrackingModal) {
        onOpenTrackingModal();
      } else {
        onClose();
      }
    } else if (notif.tipo === "puntos") {
      if (onOpenProfileModal) {
        onOpenProfileModal("points");
      } else {
        onClose();
      }
    } else if (notif.tipo === "promo" || notif.tipo === "sistema") {
      onClose();
      const rawCat =
        notif.categoria ||
        (notif.enlace && notif.enlace.match(/categoria=([a-z0-9_-]+)/i)?.[1]) ||
        (notif.enlace && notif.enlace.match(/#seccion-([a-z0-9_-]+)/i)?.[1]) ||
        "combos";
      setTimeout(() => {
        const target =
          document.getElementById(`seccion-${rawCat}`) ||
          document.getElementById("seccion-combos") ||
          document.getElementById("secciones-catalogo");
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 120);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white w-full sm:max-w-md rounded-t-4xl sm:rounded-3xl shadow-2xl h-[80vh] sm:max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Barra táctil y Cabecera Deslizable */}
        <div
          {...dragHandleProps}
          className="touch-none select-none sticky top-0 bg-white z-10 shrink-0 border-b border-slate-200/60"
        >
          {/* Barra táctil para celulares */}
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3.5 mb-2 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />

          <div className="flex items-center justify-between px-6 py-3">
            <button
              type="button"
              onClick={onBack || onClose}
              className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer shadow-2xs transition-colors"
              aria-label="Volver"
              title="Volver"
            >
              <ChevronLeft className="size-4 stroke-[2.25]" />
            </button>

            <div className="flex items-center gap-2">
              <Bell className="size-4 text-[#003366]" />
              <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight">
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <span className="size-5 rounded-full bg-valette-red text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-500 hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer shadow-2xs transition-colors"
              aria-label="Cerrar"
              title="Cerrar"
            >
              <X className="size-4 stroke-[2.25]" />
            </button>
          </div>

          {/* Filtros de Pestañas y Marcar Todo */}
          <div className="flex items-center justify-between px-6 pb-3 pt-1">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilter("todas")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filter === "todas"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Todas ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("no_leidas")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filter === "no_leidas"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                No leídas ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-[#003366] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="size-3.5" />
                <span>Marcar leídas</span>
              </button>
            )}
          </div>
        </div>

        {/* Lista de Notificaciones */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 scrollbar-none text-xs">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <div className="size-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Bell className="size-7 stroke-1" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                No hay notificaciones{" "}
                {filter === "no_leidas" ? "pendientes" : ""}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Te avisaremos sobre el estado de tus cortes, promociones
                exclusivas y puntos acumulados.
              </p>
            </div>
          ) : (
            filteredList.map((notif) => {
              const isUnread = !notif.leida;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex gap-3 ${
                    isUnread
                      ? "bg-[#003366]/5 border-[#003366]/20 hover:border-[#003366]/40"
                      : "bg-white border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  {/* Icono temático */}
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs font-bold ${
                      notif.tipo === "pedido" || notif.tipo === "pedido_estado"
                        ? "bg-blue-100 text-[#003366]"
                        : notif.tipo === "puntos"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-valette-red"
                    }`}
                  >
                    {notif.tipo === "pedido" ||
                    notif.tipo === "pedido_estado" ? (
                      <Package className="size-5" />
                    ) : notif.tipo === "puntos" ? (
                      <Sparkles className="size-5" />
                    ) : (
                      <Flame className="size-5" />
                    )}
                  </div>

                  {/* Detalle */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4
                        className={`text-xs leading-snug truncate ${
                          isUnread
                            ? "font-black text-slate-900"
                            : "font-bold text-slate-700"
                        }`}
                      >
                        {notif.titulo}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1 font-medium">
                        <Clock className="size-2.5" />
                        {formatTiempoRelativo(notif.creada_en || notif.fecha)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {notif.mensaje}
                    </p>

                    {notif.accion_texto && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#003366] hover:underline flex items-center gap-1">
                          {notif.accion_texto}
                          <ChevronRight className="size-3" />
                        </span>
                        {isUnread && (
                          <span className="size-2 rounded-full bg-[#003366] shrink-0" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
