// src/components/layout/SidebarDrawer.jsx
import React from "react";
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
  CircleUser,
  ChevronRight,
  MoreVertical,
  Beef,
} from "lucide-react";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import { useCatalogo } from "@/context/CatalogoContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useNotifications } from "@/context/NotificationContext";
import { useTabNavigation } from "@/context/TabNavigationContext";

const PROFILE_STORAGE_KEY = "valette_user_profile";

const DEFAULT_SIDEBAR_USER = {
  nombre: "Juan Pérez",
  email: "juan.perez@gmail.com",
};

export const SidebarDrawer = ({
  isOpen,
  onClose,
  onOpenProfileModal,
  onOpenBranchModal,
  onOpenTrackingModal,
  onOpenNotificationsModal,
}) => {
  const { categoryCounts } = useCatalogo();
  const { favorites } = useFavorites();
  const { unreadCount } = useNotifications();
  const { goToHome, goToCatalogo } = useTabNavigation();

  const { handleBackdropClick, modalRef } = useModalBehavior(isOpen, onClose);

  if (!isOpen) return null;

  let userProfile = DEFAULT_SIDEBAR_USER;
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      userProfile = {
        nombre: parsed.nombre || DEFAULT_SIDEBAR_USER.nombre,
        email: parsed.email || DEFAULT_SIDEBAR_USER.email,
      };
    }
  } catch {
    // Fallback silencioso a datos por defecto
  }

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
      action: () => handleNav(goToHome),
    },
    {
      id: "catalogo",
      label: "Catálogo",
      icon: Beef,
      badge: categoryCounts.todos || 12,
      action: () => handleNav(goToCatalogo),
    },
    {
      id: "parrilla",
      label: "Parrilla",
      icon: Flame,
      badge: categoryCounts.asado || 6,
      action: () => handleCategoryNav("asado"),
    },
    {
      id: "combos",
      label: "Combos",
      icon: Package,
      badge: 4,
      action: () => handleCategoryNav("combos"),
    },
    {
      id: "favoritos",
      label: "Favoritos",
      icon: Heart,
      badge: favorites.length > 0 ? favorites.length : null,
      action: () => handleNav(() => onOpenProfileModal?.("favorites")),
    },
  ];

  const operacionItems = [
    {
      id: "pedidos",
      label: "Pedidos",
      icon: Truck,
      badge: 1,
      action: () => handleNav(onOpenTrackingModal),
    },
    {
      id: "sucursales",
      label: "Sucursales",
      icon: MapPin,
      action: () => handleNav(onOpenBranchModal),
    },
    {
      id: "soporte",
      label: "Soporte",
      icon: MessageCircle,
      action: () => handleNav(() => onOpenProfileModal?.("support")),
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
        aria-label="Menú principal"
        className="bg-white w-full max-w-[310px] sm:max-w-[330px] h-full shadow-2xl relative flex flex-col justify-between overflow-hidden animate-in slide-in-from-left duration-250 border-r border-slate-200/80"
      >
        {/* 1. Header con Logo Oficial y Botón Cerrar (se mantiene intacto) */}
        <div className="relative p-5 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex flex-col items-center w-full">
            <img
              src="/favicon.svg"
              alt="Abastecedora Valette"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="size-30 shrink-0"
            />
            <div className="flex flex-col items-center">
              <h3 className="font-black text-slate-900 tracking-tight leading-tight">
                Abastecedora Valette
              </h3>
              <p className="text-[11px] font-semibold text-[#003366]">
                Sucursal Virtual
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="absolute top-5 right-5 size-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center font-bold cursor-pointer transition-colors"
            title="Cerrar menú"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {/* 2. Cuerpo de Navegación Minimalista con Términos Concisos */}
        <nav
          aria-label="Navegación lateral"
          className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-none"
        >
          {/* Sección: TIENDA */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-3">
              Tienda
            </span>
            <div className="space-y-0.5">
              {tiendaItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-slate-800 hover:bg-slate-100/80 active:bg-slate-100 transition-colors cursor-pointer group"
                  >
                    <span className="flex items-center gap-3.5">
                      <Icon
                        className="size-[19px] text-slate-700 group-hover:text-slate-950 stroke-[1.9] shrink-0 transition-colors"
                        aria-hidden="true"
                      />
                      <span className="text-[14px] font-medium tracking-tight text-slate-800 group-hover:text-slate-950">
                        {item.label}
                      </span>
                    </span>
                    {item.badge !== undefined && item.badge !== null && (
                      <span className="min-w-7 h-6 px-2 rounded-full bg-slate-100 text-slate-700 font-num font-bold text-xs flex items-center justify-center">
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
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-3">
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
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-slate-800 hover:bg-slate-100/80 active:bg-slate-100 transition-colors cursor-pointer group"
                  >
                    <span className="flex items-center gap-3.5">
                      <Icon
                        className="size-[19px] text-slate-700 group-hover:text-slate-950 stroke-[1.9] shrink-0 transition-colors"
                        aria-hidden="true"
                      />
                      <span className="text-[14px] font-medium tracking-tight text-slate-800 group-hover:text-slate-950">
                        {item.label}
                      </span>
                    </span>
                    {item.badge !== undefined && item.badge !== null && (
                      <span className="min-w-7 h-6 px-2 rounded-full bg-slate-100 text-slate-700 font-num font-bold text-xs flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sección: CUENTA */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-3">
              Cuenta
            </span>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleNav(() => onOpenProfileModal?.("edit-profile"))}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-slate-800 hover:bg-slate-100/80 active:bg-slate-100 transition-colors cursor-pointer group"
              >
                <span className="flex items-center gap-3.5">
                  <Wrench
                    className="size-[19px] text-slate-700 group-hover:text-slate-950 stroke-[1.9] shrink-0 transition-colors"
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
                  onClick={() => handleNav(onOpenNotificationsModal)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-slate-800 hover:bg-slate-100/80 active:bg-slate-100 transition-colors cursor-pointer group"
                >
                  <span className="flex items-center gap-3.5">
                    <Bell
                      className="size-[19px] text-slate-700 group-hover:text-slate-950 stroke-[1.9] shrink-0 transition-colors"
                      aria-hidden="true"
                    />
                    <span className="text-[14px] font-medium tracking-tight text-slate-800 group-hover:text-slate-950">
                      Avisos
                    </span>
                  </span>
                  {unreadCount > 0 && (
                    <span className="min-w-7 h-6 px-2 rounded-full bg-slate-100 text-slate-700 font-num font-bold text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* Ítem destacado estilo "Manage" de la referencia */}
              <button
                type="button"
                onClick={() => handleNav(() => onOpenProfileModal?.("main"))}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl bg-slate-100/90 hover:bg-slate-200/70 text-slate-900 transition-colors cursor-pointer group"
              >
                <span className="flex items-center gap-3.5">
                  <CircleUser
                    className="size-[20px] text-slate-800 stroke-[2] shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-[14px] font-semibold tracking-tight text-slate-900">
                    Gestionar
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-6 rounded-full bg-white text-slate-800 font-num font-bold text-xs shadow-2xs flex items-center justify-center">
                    2
                  </span>
                  <ChevronRight
                    className="size-4 text-slate-600 group-hover:translate-x-0.5 transition-transform stroke-[2.2]"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </div>
          </div>
        </nav>

        {/* 3. Sector Inferior de Perfil (Estilo minimalista con Avatar, Nombre, Email y 3 puntos) */}
        <div className="p-4 px-5 bg-white border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={() => handleNav(() => onOpenProfileModal?.("main"))}
            className="w-full flex items-center justify-between gap-3 text-left group cursor-pointer rounded-2xl py-1 transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80"
                alt={userProfile.nombre}
                className="size-11 rounded-full object-cover border border-slate-200/80 shrink-0 bg-slate-100"
              />
              <div className="min-w-0">
                <span className="block font-bold text-slate-900 text-[14px] leading-tight truncate group-hover:text-[#003366] transition-colors">
                  {userProfile.nombre}
                </span>
                <span className="block text-[12px] text-slate-500 font-normal leading-tight truncate mt-0.5">
                  {userProfile.email}
                </span>
              </div>
            </div>

            <span
              className="size-8 rounded-full flex items-center justify-center text-slate-500 group-hover:bg-slate-100 group-hover:text-slate-800 transition-colors shrink-0"
              aria-hidden="true"
            >
              <MoreVertical className="size-4.5" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
