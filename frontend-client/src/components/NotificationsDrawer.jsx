// frontend-client/src/components/NotificationsDrawer.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  X,
  CheckCheck,
  Package,
  Sparkles,
  Truck,
  Tag,
  AlertTriangle,
  Megaphone,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Flame,
} from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

// Helper para formato de tiempo relativo
const formatTiempoRelativo = (fechaStr) => {
  if (!fechaStr) return "";
  const ahora = new Date();
  const fecha = new Date(fechaStr);
  const diffSegundos = Math.floor((ahora - fecha) / 1000);

  if (diffSegundos < 60) return "Hace un momento";
  const diffMinutos = Math.floor(diffSegundos / 60);
  if (diffMinutos < 60) return `Hace ${diffMinutos} min`;
  const diffHoras = Math.floor(diffMinutos / 60);
  if (diffHoras < 24) return `Hace ${diffHoras} h`;
  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias === 1) return "Ayer";
  return `Hace ${diffDias} días`;
};

// Configuración de badges según estado de pedido
const ESTADOS_PEDIDO_BADGES = {
  solicitado: { label: "Solicitado", color: "bg-amber-100 text-amber-800 border-amber-300" },
  pendiente: { label: "Solicitado", color: "bg-amber-100 text-amber-800 border-amber-300" },
  en_corte: { label: "En preparación", color: "bg-blue-100 text-blue-800 border-blue-300" },
  en_preparacion: { label: "En preparación", color: "bg-blue-100 text-blue-800 border-blue-300" },
  pesado: { label: "Pesado & Listo", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  listo: { label: "Listo para empaque", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  en_camino: { label: "En camino", color: "bg-purple-100 text-purple-800 border-purple-300" },
  listo_retiro: { label: "Listo para retirar", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  entregado: { label: "Entregado", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  completado: { label: "Entregado", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800 border-red-300" },
};

export default function NotificationsDrawer() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    isDrawerOpen,
    closeNotifications,
    markAsRead,
    markAllAsRead,
    pushStatus,
    supportsPush,
    isIOS,
    isStandalone,
    isSecureContext,
    requestPushPermission,
    dismissPushPrompt,
    resetPushDismissed,
  } = useNotifications();

  const [filtro, setFiltro] = useState("todas"); // 'todas' | 'no_leidas'
  const drawerRef = useRef(null);

  // Swipe to close
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance < -minSwipeDistance) {
      closeNotifications();
    }
  };

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isDrawerOpen) {
        closeNotifications();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeNotifications]);

  // Prevenir scroll en body
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDrawerOpen]);

  const notificacionesFiltradas = notifications.filter((n) => {
    if (filtro === "no_leidas") return !n.leida;
    return true;
  });

  const handleCardClick = (notif) => {
    if (!notif.leida) {
      markAsRead(notif.id);
    }
    closeNotifications();
    if (notif.enlace) {
      navigate(notif.enlace);
    }
  };

  const renderIcon = (tipo, icono) => {
    switch (tipo) {
      case "pedido":
        return <Package className="size-4 text-main-blue" />;
      case "puntos":
        return <Sparkles className="size-4 text-amber-500" />;
      case "alerta":
        return <AlertTriangle className="size-4 text-red-500" />;
      case "promocion":
        return <Flame className="size-4 text-emerald-600" />;
      case "sistema":
      default:
        return <Megaphone className="size-4 text-purple-600" />;
    }
  };

  const getIconBg = (tipo) => {
    switch (tipo) {
      case "pedido":
        return "bg-main-blue/10 border-main-blue/20";
      case "puntos":
        return "bg-amber-500/10 border-amber-500/20";
      case "alerta":
        return "bg-red-500/10 border-red-500/20";
      case "promocion":
        return "bg-emerald-500/10 border-emerald-500/20";
      case "sistema":
      default:
        return "bg-purple-500/10 border-purple-500/20";
    }
  };

  return (
    <div
      className={`fixed inset-0 z-101 overflow-hidden transition-all duration-300 ${
        isDrawerOpen ? "pointer-events-auto visible" : "pointer-events-none invisible"
      }`}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={closeNotifications}
        className={`fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isDrawerOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10 pointer-events-none">
        <div
          ref={drawerRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEndEvent}
          className={`w-full max-w-sm bg-white shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out pointer-events-auto ${
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* ─── Encabezado ─── */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 bg-neutral-50/70">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-main-blue/10 flex items-center justify-center text-main-blue">
                <Bell className="size-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900 leading-tight">
                  Notificaciones
                </h2>
                <p className="text-xs text-neutral-500">
                  {unreadCount === 0 ? "Al día" : `${unreadCount} sin leer`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Marcar todas como leídas"
                  className="text-xs font-bold text-main-blue hover:bg-main-blue/10 px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="size-3.5" />
                  <span>Leer todo</span>
                </button>
              )}
              <button
                type="button"
                onClick={closeNotifications}
                aria-label="Cerrar notificaciones"
                className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* ─── Diagnóstico Push: Contexto HTTP inseguro (Android/IP local) ─── */}
          {!isSecureContext && (
            <div className="mx-4 mt-3.5 p-3 bg-orange-50 border border-orange-200/80 rounded-xl flex items-start gap-2.5 shadow-2xs">
              <span className="text-base leading-none mt-0.5">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-orange-900 leading-tight">
                  Conexión insegura detectada
                </p>
                <p className="text-[11px] text-orange-800 mt-0.5 leading-relaxed">
                  Estás accediendo por IP local (<code className="font-mono text-[10px]">http://</code>). Los navegadores móviles bloquean las notificaciones por seguridad. Para activarlas necesitás acceder desde <strong>localhost</strong> o un dominio con <strong>HTTPS</strong>.
                </p>
              </div>
            </div>
          )}

          {/* ─── Banner Permiso Notificaciones Push ─── */}
          {isSecureContext && pushStatus === "default" && (
            <div className="mx-4 mt-3.5 p-3 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl flex items-start gap-3 shadow-2xs">
              <div className="size-7 rounded-lg bg-main-blue text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="size-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-neutral-900 leading-tight">
                  ¿Querés enterarte cuando tu pedido esté listo?
                </p>
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  Activá las alertas para recibir el estado de tus cortes al instante.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={requestPushPermission}
                    className="px-3 py-1 bg-main-blue hover:bg-main-blue/90 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    Activar
                  </button>
                  <button
                    type="button"
                    onClick={dismissPushPrompt}
                    className="text-[11px] font-medium text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
                  >
                    Ahora no
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Banner si el permiso fue denegado (el usuario lo bloqueó desde el browser) ─── */}
          {isSecureContext && pushStatus === "denied" && (
            <div className="mx-4 mt-3.5 p-3 bg-red-50 border border-red-200/80 rounded-xl flex items-start gap-2.5 shadow-2xs">
              <span className="text-base leading-none mt-0.5">🔕</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-red-900 leading-tight">
                  Notificaciones bloqueadas en el navegador
                </p>
                <p className="text-[11px] text-red-800 mt-0.5 leading-relaxed">
                  Para reactivarlas, andá a la configuración del navegador → Privacidad → Notificaciones → Permitir para este sitio.
                </p>
              </div>
            </div>
          )}

          {/* ─── Guía especial para iPhone (iOS Safari no standalone) ─── */}
          {isIOS && !isStandalone && (
            <div className="mx-4 mt-3.5 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 shadow-2xs">
              <span className="text-base leading-none mt-0.5">📲</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-900 leading-tight">
                  Notificaciones en iPhone
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  1. Tocá <strong>Compartir</strong> ⎙ en Safari.<br />
                  2. Elegí <strong>"Agregar a pantalla de inicio"</strong>.<br />
                  3. Abrí la App desde el ícono que aparece en tu pantalla. <br />
                  Luego el botón de activar aparecerá acá.
                </p>
              </div>
            </div>
          )}

          {/* ─── Filtros Rápidos (Todas / No leídas) ─── */}
          <div className="px-4 pt-3 pb-2 border-b border-neutral-100 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltro("todas")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filtro === "todas"
                  ? "bg-neutral-900 text-white shadow-2xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltro("no_leidas")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filtro === "no_leidas"
                  ? "bg-main-blue text-white shadow-2xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              No leídas ({unreadCount})
            </button>
          </div>

          {/* ─── Lista de Notificaciones ─── */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3 py-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-3 p-3 rounded-lg bg-neutral-50">
                    <div className="size-8 rounded-full bg-neutral-200 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-neutral-200 rounded w-3/4" />
                      <div className="h-3 bg-neutral-200 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notificacionesFiltradas.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="size-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                  <Bell className="size-6 stroke-1" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900">
                  {filtro === "no_leidas"
                    ? "¡Estás al día!"
                    : "No tenés notificaciones"}
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                  {filtro === "no_leidas"
                    ? "No hay avisos pendientes de lectura."
                    : "Acá vas a ver el seguimiento de tus pedidos, puntos acreditados y beneficios."}
                </p>
              </div>
            ) : (
              notificacionesFiltradas.map((notif) => {
                const estadoBadge =
                  notif.estado_pedido && ESTADOS_PEDIDO_BADGES[notif.estado_pedido.toLowerCase()]
                    ? ESTADOS_PEDIDO_BADGES[notif.estado_pedido.toLowerCase()]
                    : null;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleCardClick(notif)}
                    className={`py-3 px-4 transition-all cursor-pointer flex items-start gap-3 border-b last:border-b-0 ${
                      !notif.leida
                        ? "bg-white border-neutral-200"
                        : "bg-neutral-50/50 border-neutral-100"
                    }`}
                  >
                    {/* Icono temático (estilo Avatar) */}
                    <div
                      className={`size-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${getIconBg(
                        notif.tipo
                      )}`}
                    >
                      {renderIcon(notif.tipo, notif.icono)}
                    </div>

                    {/* Contenido principal */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-sm truncate ${
                            !notif.leida ? "font-bold text-neutral-900" : "font-semibold text-neutral-700"
                          }`}
                        >
                          {notif.titulo}
                        </h4>
                        <span
                          className={`text-xs shrink-0 whitespace-nowrap ${
                            !notif.leida ? "font-bold text-main-blue" : "text-neutral-500"
                          }`}
                        >
                          {formatTiempoRelativo(notif.creada_en).replace("Hace ", "")}
                        </span>
                      </div>

                      <p
                        className={`text-xs line-clamp-2 mt-0.5 leading-snug ${
                          !notif.leida ? "font-semibold text-neutral-800" : "text-neutral-500"
                        }`}
                      >
                        {notif.mensaje}
                      </p>

                      {/* Badge de estado vivo para pedidos */}
                      {estadoBadge && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${estadoBadge.color}`}
                          >
                            {estadoBadge.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ─── Footer del Drawer ─── */}
          <div className="p-3.5 border-t border-neutral-200 bg-neutral-50/70 text-center space-y-1">
            {pushStatus === "granted" ? (
              <p className="text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1">
                <CheckCircle2 className="size-3" />
                Alertas push activadas en este dispositivo
              </p>
            ) : pushStatus === "dismissed" ? (
              <button
                type="button"
                onClick={resetPushDismissed}
                className="text-[11px] font-bold text-main-blue hover:underline cursor-pointer"
              >
                Activar alertas de pedidos en este dispositivo
              </button>
            ) : null}
            <p className="text-[10px] text-neutral-400">
              Notificaciones en tiempo real • Abastecedora Valette
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
