// src/components/layout/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useLocation } from "@/context/LocationContext";
import { useTabNavigation } from "@/context/TabNavigationContext";
import { useCatalogo } from "@/context/CatalogoContext";
import { useNotifications } from "@/context/NotificationContext";
import {
  Bell,
  Menu,
  ShoppingCart,
  ChevronDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";

const CATEGORIES = [
  { id: "todos", label: "Todos los productos", path: "/productos" },
  { id: "asado", label: "Especial Asado 🔥" },
  { id: "vacuno", label: "Vacuno" },
  { id: "cerdo", label: "Cerdo" },
  { id: "pollo", label: "Granja & Pollo" },
  { id: "preparados", label: "Preparados" },
  { id: "embutidos", label: "Embutidos" },
  { id: "achuras", label: "Achuras" },
  { id: "combos", label: "Combos Ahorro", special: true },
];

export const Navbar = ({
  onOpenBranchModal,
  onOpenProfileModal,
  onOpenSidebar,
  onOpenNotificationsModal,
}) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { deliveryMode, selectedBranch, customerAddress } = useLocation();
  const { isHome, goToHome, goToCatalogo } = useTabNavigation();
  const { categoryCounts } = useCatalogo();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleCategoryClick = (cat) => {
    if (cat.id === "todos") {
      goToCatalogo();
    } else {
      navigate(`/productos?categoria=${cat.id}`);
    }
  };

  return (
    <div className="flex flex-col w-full h-fit bg-white sticky top-0 z-40 border-b border-slate-200/80">
      {/* Mobile section */}
      <div className="flex md:hidden items-center justify-between w-full px-4 py-3">
        {/* Botón de Menu Mobile (Abre Sidebar Estratégica) */}
        <button
          type="button"
          onClick={onOpenSidebar}
          className="relative p-2.5 rounded-full bg-slate-100 text-slate-700 active:scale-95 transition-transform cursor-pointer"
          title="Menú y Categorías"
        >
          <Menu className="size-5 stroke-[2.2]" />
          <span className="absolute -top-1 -right-1 size-5 rounded-full bg-[#c53030] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
            {categoryCounts.todos || 12}
          </span>
        </button>

        <div className="flex items-center gap-2">
          {/* Botón de Carrito Mobile con Badge */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-full bg-slate-100 text-slate-700 active:scale-95 transition-transform cursor-pointer"
            title="Ver Carrito"
          >
            <ShoppingCart className="size-5 stroke-[2.2]" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 size-5 rounded-full bg-[#c53030] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                {totalItems}
              </span>
            )}
          </button>

          {/* Botón de Notificaciones Mobile con Badge */}
          <button
            type="button"
            onClick={onOpenNotificationsModal}
            className="relative p-2.5 rounded-full bg-slate-100 text-slate-700 active:scale-95 transition-transform cursor-pointer"
            title="Notificaciones"
          >
            <Bell className="size-5 stroke-[2.2]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 size-5 rounded-full bg-[#c53030] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Desktop section */}
      <div className="hidden md:flex w-full">
        <div className="flex w-full max-w-6xl mx-auto gap-4 px-4 sm:px-6 items-center">
          {/* Logo clickeable hacia "/" */}
          <Link
            to="/"
            onClick={(e) => {
              if (isHome) {
                e.preventDefault();
                goToHome();
              }
            }}
            className="shrink-0 flex items-center gap-2 group"
          >
            <img src="/favicon.svg" alt="Abastecedora Valette" className="size-28" />
          </Link>

          <div className="flex flex-col w-full justify-center gap-2">
            {/* Buscador, Puntos, Notificaciones, Carrito y Perfil */}
            <div className="flex items-center gap-3 transition-all whitespace-nowrap">
              {/* Input Buscador */}
              <div className="relative flex w-full items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                  <Search className="size-4 stroke-[2.5]" />
                </div>
                <input
                  type="text"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      navigate(
                        `/productos?q=${encodeURIComponent(e.target.value)}`,
                      );
                    }
                  }}
                  placeholder="Buscar vacío, asado, milanesas, pechuga, matambre..."
                  className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-[#F1F4F8] border-none text-xs sm:text-sm font-medium placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#003366]/20 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={goToCatalogo}
                  className="absolute right-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal className="size-3 text-slate-500 stroke-[2.5]" />
                  <span>Filtros</span>
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
                  <span className="absolute -top-1 -right-1 size-5 rounded-full bg-[#c53030] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
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
                  <span className="absolute -top-1 -right-1 size-5 rounded-full bg-[#c53030] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
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

            {/* Enviar a & Categorías */}
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

              {/* Links de Categorías */}
              <div className="flex items-center gap-5 overflow-x-auto no-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className="text-[13px] hover:text-[#003366] hover:border-b-2 hover:border-[#003366] py-1 font-semibold text-slate-600 transition-colors cursor-pointer shrink-0"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
