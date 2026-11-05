// src/components/layout/SidebarDrawer.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Home,
  Flame,
  Package,
  Star,
  MapPin,
  Truck,
  Phone,
  MessageCircle,
  Clock,
  ChevronRight,
  LogOut,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Beef,
} from "lucide-react";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import { useLocation } from "@/context/LocationContext";
import { useCatalogo } from "@/context/CatalogoContext";
import { useTabNavigation } from "@/context/TabNavigationContext";

export const SidebarDrawer = ({
  isOpen,
  onClose,
  onOpenProfileModal,
  onOpenBranchModal,
  onOpenTrackingModal,
}) => {
  const navigate = useNavigate();
  const { selectedBranch } = useLocation();
  const { categoryCounts } = useCatalogo();
  const { goToHome, goToCatalogo } = useTabNavigation();

  const { handleBackdropClick, modalRef } = useModalBehavior(isOpen, onClose);

  if (!isOpen) return null;

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
    }
  };

  const whatsappPhone = selectedBranch?.telefono || "1135534033";
  const whatsappUrl = `https://wa.me/54${whatsappPhone}?text=${encodeURIComponent(
    "¡Hola Abastecedora Valette! Quiero consultar por un pedido desde la Sucursal Virtual.",
  )}`;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex justify-start transition-opacity duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white w-full max-w-[320px] sm:max-w-sm h-full shadow-2xl relative flex flex-col justify-between overflow-hidden animate-in slide-in-from-left duration-250 border-r border-slate-200/80"
      >
        {/* 1. Header con Logo Oficial y Botón Cerrar */}
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
            className="absolute top-5 right-5 size-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center font-bold cursor-pointer transition-colors"
            title="Cerrar menú"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 2. Cuerpo Desplazable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-none text-xs">
          {/* Banner de Pedido Activo si existe */}
          <div
            onClick={() => handleNav(onOpenTrackingModal)}
            className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between cursor-pointer hover:bg-emerald-100/70 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="size-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Package className="size-3.5" />
              </span>
              <div>
                <span className="block font-bold text-emerald-950 text-xs">
                  Pedido activo #VAL-0259
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  En preparación en mostrador
                </span>
              </div>
            </div>
            <span className="text-[10px] font-black text-emerald-800 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">
              Seguir
            </span>
          </div>

          {/* Sección 1: Navegación Principal */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
              Tienda y Catálogo
            </span>
            <div className="space-y-1 font-semibold text-slate-700">
              <button
                type="button"
                onClick={() => handleNav(goToHome)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Home className="size-4 text-[#003366]" />
                  <span>Inicio</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleNav(goToCatalogo)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Beef className="size-4 text-[#003366]" />
                  <span>Catálogo de Carnicería</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[10px]">
                  {categoryCounts.todos || 12} cortes
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryNav("asado")}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-red-50 text-slate-800 hover:text-valette-red transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Flame className="size-4 text-valette-red" />
                  <span className="font-bold">Especial Asado & Parrilla</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-valette-red text-[10px] font-black">
                  🔥 Top
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryNav("combos")}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Package className="size-4 text-emerald-700" />
                  <span>Combos Ahorro Familiar</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Freezer
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleNav(onOpenProfileModal)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Star className="size-4 text-amber-500" />
                  <span>Club Valette (Puntos y Canjes)</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        <div
          onClick={() => handleNav(onOpenProfileModal)}
          className="p-3.5 bg-linear-to-br from-amber-100/10 to-amber-500/10 border border-amber-700/10 hover:border-[#003366]/30 transition-all cursor-pointer flex items-center justify-between group sticky bottom-0 inset-x-0"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              JP
            </div>
            <div>
              <span className="block font-black text-slate-900 text-xs group-hover:text-[#003366] transition-colors">
                Juan Pérez
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                <Star className="size-3 fill-amber-500 text-amber-500" />
                <span>140 pts Club Valette</span>
              </span>
            </div>
          </div>
          <ChevronRight className="size-4 text-slate-400 group-hover:text-[#003366] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </div>
  );
};
