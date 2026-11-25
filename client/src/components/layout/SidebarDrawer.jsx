// src/components/layout/SidebarDrawer.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Home,
  Flame,
  Package,
  Heart,
  MapPin,
  Truck,
  MessageCircle,
  Bell,
  Wrench,
  ChevronRight,
  Beef,
  Sparkles,
} from "lucide-react";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import { useCatalogo } from "@/context/CatalogoContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useNotifications } from "@/context/NotificationContext";
import { useTabNavigation } from "@/context/TabNavigationContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLocation } from "@/context/LocationContext";
import { useToast } from "@/context/ToastContext";
import { getBranchOpenStatus } from "@/utils/horarios";
import { API_URL } from "@/config/api";

export const SidebarDrawer = ({
  isOpen,
  onClose,
  onOpenProfileModal,
  onOpenBranchModal,
  onOpenTrackingModal,
  onOpenNotificationsModal,
}) => {
  const { productos } = useCatalogo();
  const { favorites } = useFavorites();
  const { unreadCount } = useNotifications();
  const { isHome, isCatalogo, goToHome, goToCatalogo } = useTabNavigation();
  const { user, isAuthenticated } = useAuth();
  const { activeOrderId } = useCart();
  const { selectedBranch } = useLocation();
  const { showToast } = useToast();

  const [combosCount, setCombosCount] = useState(0);

  const { handleBackdropClick, modalRef } = useModalBehavior(isOpen, onClose);

  // Obtener conteo real de combos activos desde PostgreSQL (cero datos hardcodeados)
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const loadCombosCount = async () => {
      try {
        const res = await fetch(`${API_URL}/combos`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          setCombosCount(data.length);
        }
      } catch {
        // Silencioso: si falla la red no mostramos un número falso
      }
    };

    loadCombosCount();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const hasPromos = useMemo(() => {
    if (!Array.isArray(productos)) return false;
    return productos.some(
      (p) =>
        (Array.isArray(p.promos) && p.promos.length > 0) ||
        Number(p.precio_anterior) > Number(p.precio),
    );
  }, [productos]);

  if (!isOpen) return null;

  const branchStatus = getBranchOpenStatus(selectedBranch);
  const branchCityRaw =
    selectedBranch?.ciudad || selectedBranch?.nombre || "Luis Guillón";
  const branchCityLabel = branchCityRaw.replace(
    /luis guillon/i,
    "Luis Guillón",
  );

  const userPoints = Number(user?.puntos ?? user?.puntos_club) || 0;
  const userName =
    isAuthenticated && user ? user.nombre || "Cliente Valette" : "Ingresá";

  const handleNav = (action) => {
    onClose();
    if (typeof action === "function") {
      action();
    }
  };

  const handleCategoryNav = (catId) => {
    onClose();
    if (catId === "todos") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const target = document.getElementById(`seccion-${catId}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      goToHome();
      setTimeout(() => {
        const homeTarget = document.getElementById(`seccion-${catId}`);
        if (homeTarget) {
          homeTarget.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  };

  const tiendaItems = [
    {
      id: "inicio",
      label: "Inicio",
      icon: Home,
      isActive: isHome,
      action: () => handleNav(goToHome),
    },
    {
      id: "catalogo",
      label: "Catálogo",
      icon: Beef,
      isActive: isCatalogo,
      badge: hasPromos ? "¡Hay Promos!" : null,
      badgeClass: "bg-rose-50 text-rose-600",
      action: () => handleNav(goToCatalogo),
    },
    {
      id: "parrilla",
      label: "Parrilla",
      icon: Flame,
      iconClass: "text-orange-600 group-hover:text-orange-700",
      action: () => handleCategoryNav("asado"),
    },
    {
      id: "combos",
      label: "Combos",
      icon: Package,
      badge: combosCount > 0 ? combosCount : null,
      badgeClass: "bg-emerald-50 text-emerald-700 font-num",
      action: () => handleCategoryNav("combos"),
    },
    {
      id: "favoritos",
      label: "Mis Favoritos",
      icon: Heart,
      badge: favorites.length > 0 ? favorites.length : null,
      badgeClass: "bg-slate-100 text-slate-700 font-num",
      action: () => onOpenProfileModal?.("favorites"),
    },
  ];

  const operacionItems = [
    {
      id: "pedidos",
      label: "Pedidos",
      icon: Truck,
      badge: activeOrderId ? "En curso" : "Seguir pedidos",
      badgeClass: activeOrderId
        ? "bg-emerald-50 text-emerald-700"
        : "bg-[#EEF4FA] text-[#003366]",
      action: () => onOpenTrackingModal?.(),
    },
    {
      id: "sucursal",
      label: "Sucursal",
      icon: MapPin,
      hint: branchCityLabel,
      action: () => onOpenBranchModal?.(),
    },
    {
      id: "soporte",
      label: "Soporte",
      icon: MessageCircle,
      hint: "WhatsApp",
      hintDotClass: "bg-emerald-500/80",
      action: () => onOpenProfileModal?.("support"),
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex justify-start transition-opacity duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-drawer-title"
        className="bg-white w-full max-w-77.5 sm:max-w-82.5 h-dvh shadow-2xl relative flex flex-col justify-between overflow-hidden animate-in slide-in-from-left duration-250 border-r border-slate-200/80 overscroll-contain"
      >
        {/* 1. Header Horizontal Compacto con Estado Operativo en Vivo */}
        <div className="px-4 py-4 border-b border-slate-100 flex items-start justify-between gap-2.5 shrink-0 bg-white">
          <button
            type="button"
            onClick={() => handleNav(goToHome)}
            className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer group"
          >
            <img
              src="/favicon.svg"
              alt="Abastecedora Valette"
              className="size-12 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h1
                id="sidebar-drawer-title"
                className="font-black text-[15px] text-slate-900 tracking-tight leading-tight truncate group-hover:text-[#003366] transition-colors"
              >
                Abastecedora Valette
              </h1>
              <div
                className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold leading-tight max-w-full ${
                  branchStatus.isOpen
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full shrink-0 ${
                    branchStatus.isOpen ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">
                  {branchStatus.isOpen
                    ? "Abierto ahora · Envíos hoy"
                    : branchStatus.badgeText}
                </span>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-500 hover:bg-slate-100 flex items-center justify-center shrink-0 cursor-pointer shadow-2xs transition-colors"
            title="Cerrar menú"
          >
            <X className="size-4 stroke-[2.25]" aria-hidden="true" />
          </button>
        </div>

        {/* 2. Cuerpo de Navegación Limpio con Estímulos Medidos */}
        <nav
          aria-label="Navegación lateral"
          className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 scrollbar-none overscroll-contain"
        >
          {/* Sección: TIENDA */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 px-3">
              Tienda
            </span>
            <div className="space-y-0.5">
              {tiendaItems.map((item) => {
                const Icon = item.icon;
                const active = Boolean(item.isActive);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    aria-current={active ? "page" : undefined}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl transition-colors cursor-pointer group ${
                      active
                        ? "bg-[#EFF4F9] text-[#003366]"
                        : "text-slate-800 hover:bg-slate-100/80 active:bg-slate-100"
                    }`}
                  >
                    <span className="flex items-center gap-3.5 min-w-0">
                      <Icon
                        className={`size-5 stroke-2 shrink-0 transition-colors ${
                          item.iconClass
                            ? item.iconClass
                            : active
                              ? "text-[#003366]"
                              : "text-slate-700 group-hover:text-slate-950"
                        }`}
                        aria-hidden="true"
                      />
                      <span
                        className={`text-[14px] tracking-tight truncate ${
                          active
                            ? "font-bold text-[#003366]"
                            : "font-medium text-slate-800 group-hover:text-slate-950"
                        }`}
                      >
                        {item.label}
                      </span>
                    </span>
                    {item.badge !== undefined && item.badge !== null && (
                      <span
                        className={`min-w-7 h-6 px-2.5 rounded-full font-bold text-[11px] flex items-center justify-center shrink-0 ${
                          item.badgeClass || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sección: SERVICIOS */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 px-3">
              Servicios
            </span>
            <div className="space-y-0.5">
              {operacionItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl text-slate-800 hover:bg-slate-100/80 active:bg-slate-100 transition-colors cursor-pointer group"
                  >
                    <span className="flex items-center gap-3.5 min-w-0">
                      <Icon
                        className="size-5 text-slate-700 group-hover:text-slate-950 stroke-2 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-[14px] font-medium tracking-tight text-slate-800 group-hover:text-slate-950 truncate">
                        {item.label}
                      </span>
                    </span>
                    {item.badge !== undefined && item.badge !== null ? (
                      <span
                        className={`min-w-7 h-6 px-2.5 rounded-full font-bold text-[11px] flex items-center justify-center shrink-0 ${
                          item.badgeClass || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : item.hint ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 shrink-0">
                        {item.hintDotClass && (
                          <span
                            className={`size-1.5 rounded-full shrink-0 ${item.hintDotClass}`}
                            aria-hidden="true"
                          />
                        )}
                        <span>{item.hint}</span>
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sección: CUENTA */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 px-3">
              Cuenta
            </span>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    showToast(
                      "Iniciá sesión para configurar tu perfil",
                      "info",
                    );
                    onOpenProfileModal?.("auth");
                    return;
                  }
                  onOpenProfileModal?.("edit-profile");
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl text-slate-800 hover:bg-slate-100/80 active:bg-slate-100 transition-colors cursor-pointer group"
              >
                <span className="flex items-center gap-3.5">
                  <Wrench
                    className="size-5 text-slate-700 group-hover:text-slate-950 stroke-2 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-[14px] font-medium tracking-tight text-slate-800 group-hover:text-slate-950">
                    Ajustes
                  </span>
                </span>
              </button>

              {onOpenNotificationsModal && (
                <button
                  type="button"
                  onClick={() => onOpenNotificationsModal()}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl text-slate-800 hover:bg-slate-100/80 active:bg-slate-100 transition-colors cursor-pointer group"
                >
                  <span className="flex items-center gap-3.5">
                    <Bell
                      className="size-5 text-slate-700 group-hover:text-slate-950 stroke-2 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-[14px] font-medium tracking-tight text-slate-800 group-hover:text-slate-950">
                      Avisos
                    </span>
                  </span>
                  {unreadCount > 0 && (
                    <span className="min-w-6 h-6 px-2 rounded-full bg-[#EEF4FA] text-[#003366] font-num font-bold text-xs flex items-center justify-center shrink-0">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* 3. Tarjeta Inferior Orientada a Fidelización (Club Valette) */}
        <div className="p-3.5 bg-white border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={() => onOpenProfileModal?.("main")}
            className="w-full flex items-center justify-between gap-3 text-left group cursor-pointer rounded-2xl bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/80 p-2.5 transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              {isAuthenticated && user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={userName}
                  className="size-10 rounded-full object-cover border border-slate-200/80 shrink-0 bg-slate-100"
                />
              ) : (
                <div className="size-10 rounded-full overflow-hidden bg-[#E6EEF6] border border-[#003366]/10 shrink-0 flex items-end justify-center">
                  <svg
                    viewBox="0 0 36 36"
                    fill="none"
                    aria-hidden="true"
                    className="size-full text-[#003366]"
                  >
                    <circle cx="18" cy="13.5" r="6" fill="currentColor" />
                    <path
                      d="M6.5 34C6.5 26.8203 11.6487 22 18 22C24.3513 22 29.5 26.8203 29.5 34"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              )}

              <div className="min-w-0">
                <span className="block font-extrabold text-slate-900 text-[13.5px] leading-tight truncate group-hover:text-[#003366] transition-colors">
                  {userName}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-600 font-medium leading-tight mt-0.5 truncate">
                  <span className="truncate">
                    {isAuthenticated
                      ? userPoints > 0
                        ? `${userPoints} pts · Club Valette`
                        : "Miembro Club Valette"
                      : "Y sumá puntos en Club Valette"}
                  </span>
                  <Sparkles
                    className="size-3 text-amber-500 fill-amber-500 shrink-0"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </div>

            <span
              className="size-7.5 rounded-full bg-[#003366] group-hover:bg-valette-dark text-white flex items-center justify-center shrink-0 transition-all group-hover:translate-x-0.5 shadow-2xs"
              aria-hidden="true"
            >
              <ChevronRight className="size-4 stroke-[2.5]" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
