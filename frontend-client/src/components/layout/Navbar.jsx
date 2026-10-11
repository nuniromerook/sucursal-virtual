// src/components/layout/Navbar.jsx
import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useLocation } from "@/context/LocationContext";
import { useCatalogo } from "@/context/CatalogoContext";
import { useNotifications } from "@/context/NotificationContext";
import {
  Bell,
  Menu,
  ShoppingCart,
  ChevronDown,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

export const CATEGORIES = [
  { id: "combos", label: "Combos Ahorro", special: true },
  { id: "asado", label: "Especial Asado 🔥" },
  { id: "vacuno", label: "Vacuno" },
  { id: "cerdo", label: "Cerdo" },
  { id: "pollo", label: "Granja & Pollo" },
  { id: "embutidos", label: "Embutidos" },
  { id: "preparados", label: "Preparados" },
  { id: "achuras", label: "Achuras" },
  { id: "almacen", label: "Almacén" },
];

export const Navbar = ({
  searchQuery = "",
  onSearchChange,
  onOpenFiltersModal,
  hasActiveFilters = false,
  isNavbarFused = false,
  onOpenBranchModal,
  onOpenProfileModal,
  onOpenSidebar,
  onOpenNotificationsModal,
}) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { deliveryMode, selectedBranch, customerAddress } = useLocation();
  const { categoryCounts } = useCatalogo();
  const { unreadCount } = useNotifications();
  const navbarRef = useRef(null);

  // Medir dinámicamente el alto exacto de la navbar para alinear la barra sticky al píxel
  useEffect(() => {
    const updateNavbarHeight = () => {
      if (navbarRef.current) {
        const height = navbarRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          "--navbar-height",
          `${height}px`,
        );
      }
    };

    updateNavbarHeight();
    window.addEventListener("resize", updateNavbarHeight);
    return () => window.removeEventListener("resize", updateNavbarHeight);
  }, []);

  const handleCategoryClick = (cat) => {
    const target = document.getElementById(`seccion-${cat.id}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header
      ref={navbarRef}
      className={`flex flex-col w-full h-fit bg-white sticky top-0 z-40 transition-all duration-150 ${
        isNavbarFused
          ? "border-b border-transparent shadow-none md:border-b md:border-slate-200/80 md:shadow-xs"
          : "border-b border-slate-200/80 shadow-xs"
      }`}
    >
      {/* 1. Mobile Section: 2 filas compactas con Buscador y Filtro funcional */}
      <div className="flex md:hidden flex-col w-full">
        {/* Fila 1: Menú hamburguesa, Logo central y Carrito/Notificaciones */}
        <div className="flex items-center justify-between w-full px-4 pt-2.5 pb-2">
          {/* Botón de Menú Mobile (Abre Sidebar Estratégica) */}
          <button
            type="button"
            onClick={onOpenSidebar}
            className="relative p-2 rounded-full bg-slate-100 text-slate-700 active:scale-95 transition-transform cursor-pointer"
            title="Menú y Categorías"
          >
            <Menu className="size-5 stroke-[2.2]" />
            <span className="absolute -top-1 -right-1 size-5 rounded-full bg-valette-red text-white text-[10px] font-black flex items-center justify-center shadow-xs">
              {categoryCounts.todos || 12}
            </span>
          </button>

          {/* Acciones: Carrito y Notificaciones */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full bg-slate-100 text-slate-700 active:scale-95 transition-transform cursor-pointer"
              title="Ver Carrito"
            >
              <ShoppingCart className="size-5 stroke-[2.2]" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 size-4.5 rounded-full bg-valette-red text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenNotificationsModal}
              className="relative p-2 rounded-full bg-slate-100 text-slate-700 active:scale-95 transition-transform cursor-pointer"
              title="Notificaciones"
            >
              <Bell className="size-5 stroke-[2.2]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 size-4.5 rounded-full bg-valette-red text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Fila 2: Barra Buscadora Mobile con Botón de Filtros Funcional */}
        <div className="flex items-center gap-2 px-4 pb-2.5">
          <div className="relative flex-1 flex items-center">
            <div className="absolute left-3 text-slate-400 pointer-events-none">
              <Search className="size-4 stroke-[2.5]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Buscar vacío, asado, pollo, bondiola..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#F1F4F8] border border-slate-200/60 text-xs font-medium placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#003366]/20 transition-all outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange?.("")}
                className="absolute right-2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="size-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenFiltersModal}
            className={`p-2 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 relative ${
              hasActiveFilters
                ? "bg-[#003366] text-white border-[#003366] shadow-xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Filtros de búsqueda"
          >
            <SlidersHorizontal className="size-4 stroke-[2.2]" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Desktop Section */}
      <div className="hidden md:flex w-full">
        <div className="flex w-full max-w-6xl mx-auto gap-4 px-4 sm:px-6 items-center">
          {/* Logo clickeable hacia "/" */}
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="shrink-0 flex items-center gap-2 group py-2"
          >
            <img
              src="/favicon.svg"
              alt="Abastecedora Valette"
              className="size-24 object-contain"
            />
          </Link>

          <div className="flex flex-col w-full justify-center gap-2 py-2">
            {/* Buscador, Puntos, Notificaciones, Carrito y Perfil */}
            <div className="flex items-center gap-3 transition-all whitespace-nowrap">
              {/* Input Buscador Desktop */}
              <div className="relative flex w-full items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                  <Search className="size-4 stroke-[2.5]" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder="Buscar vacío, asado, milanesas, pechuga, matambre, combos..."
                  className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-[#F1F4F8] border border-slate-200/60 text-xs sm:text-sm font-medium placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#003366]/20 transition-all outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange?.("")}
                    className="absolute right-24 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X className="size-4 stroke-[2.5]" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenFiltersModal}
                  className={`absolute right-2 px-3 py-1.5 rounded-xl border font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                    hasActiveFilters
                      ? "bg-[#003366] text-white border-[#003366]"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <SlidersHorizontal
                    className={`size-3 stroke-[2.5] ${hasActiveFilters ? "text-white" : "text-slate-500"}`}
                  />
                  <span>Filtros</span>
                  {hasActiveFilters && (
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              </div>

              {/* Botón Rápido de Puntos Valette Club */}
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100/80 transition-colors cursor-pointer"
              >
                <span className="text-amber-500">⭐</span>
                <span>140 pts</span>
              </button>

              {/* Botón de Notificaciones Desktop con Badge */}
              <button
                type="button"
                onClick={onOpenNotificationsModal}
                className="relative p-2.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-transform cursor-pointer"
                title="Notificaciones"
              >
                <Bell className="size-5 stroke-[2.2]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-5 rounded-full bg-valette-red text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Botón de Carrito Desktop con Badge */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-transform cursor-pointer"
                title="Ver Carrito"
              >
                <ShoppingCart className="size-5 stroke-[2.2]" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 size-5 rounded-full bg-valette-red text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Avatar Usuario Nativo */}
              <button
                type="button"
                onClick={onOpenProfileModal}
                title="Mi Cuenta & Puntos"
                className="flex items-center gap-2 p-1 pl-2.5 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-200/80 transition-colors cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-700 hidden sm:inline">
                  Juan P.
                </span>
                <div className="size-7 rounded-full bg-[#003366] text-white flex items-center justify-center text-xs font-extrabold shadow-2xs">
                  JP
                </div>
              </button>
            </div>

            {/* Enviar a & Categorías Desktop */}
            <div className="flex w-full gap-8 items-center justify-between">
              {/* Enviar a / Selector de Sucursal */}
              <button
                type="button"
                onClick={onOpenBranchModal}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate max-w-[200px]">
                  {deliveryMode === "delivery"
                    ? `Envío: ${customerAddress}`
                    : `Retiro: ${selectedBranch?.nombre || "Luis Guillón"}`}
                </span>
                <ChevronDown className="size-3 text-slate-400 shrink-0 stroke-[2.5]" />
              </button>

              {/* Links de Categorías en Desktop */}
              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className="text-[13px] hover:text-[#003366] hover:border-b-2 hover:border-[#003366] py-1 font-semibold text-slate-600 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <span>{cat.label}</span>
                    {cat.special && (
                      <span className="text-[10px] font-bold bg-red-100 text-valette-red px-1.5 py-0.2 rounded-full">
                        Promo
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
