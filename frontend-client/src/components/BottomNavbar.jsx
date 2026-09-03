import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, ShoppingCart, Bell, User } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";

export default function BottomNavbar() {
  const location = useLocation();
  const { totalItems = 0, openCart } = useCart();
  const { unreadCount = 0, openNotifications } = useNotifications();
  const { user, isAuthenticated } = useAuth();

  const isLogged = Boolean(isAuthenticated || user);
  const currentPath = location.pathname;

  const handleLinkClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  };

  const isHome = currentPath === "/";
  const isCatalog =
    currentPath.startsWith("/productos") ||
    currentPath === "/vacuno" ||
    currentPath === "/cerdo" ||
    currentPath === "/pollo" ||
    currentPath === "/preparados" ||
    currentPath === "/almacen";
  const isProfile =
    currentPath.startsWith("/perfil") || currentPath.startsWith("/ingresar");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/98 md:backdrop-blur-md border-t border-neutral-200 shadow-sm px-2 py-1 transition-all">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Inicio */}
        <Link
          to="/"
          onClick={handleLinkClick}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            isHome
              ? "text-main-blue font-bold"
              : "text-neutral-500 hover:text-neutral-900 font-medium"
          }`}
        >
          <Home
            className={`size-5 stroke-[1.6px] transition-transform ${isHome ? "scale-110" : ""}`}
          />
          <span className="text-[11px] mt-0.5 tracking-tight">Inicio</span>
          <span
            className={`w-4 h-0.5 rounded-full mt-0.5 transition-all ${isHome ? "bg-main-blue" : "bg-transparent"}`}
          />
        </Link>

        {/* 2. Catálogo */}
        <Link
          to="/productos"
          onClick={handleLinkClick}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            isCatalog
              ? "text-main-blue font-bold"
              : "text-neutral-500 hover:text-neutral-900 font-medium"
          }`}
        >
          <LayoutGrid
            className={`size-5 stroke-[1.6px] transition-transform ${isCatalog ? "scale-110" : ""}`}
          />
          <span className="text-[11px] mt-0.5 tracking-tight">Catálogo</span>
          <span
            className={`w-4 h-0.5 rounded-full mt-0.5 transition-all ${isCatalog ? "bg-main-blue" : "bg-transparent"}`}
          />
        </Link>

        {/* 3. Carrito (Central con botón flotante / destacado) */}
        <button
          type="button"
          onClick={openCart}
          className="flex flex-col items-center justify-center flex-1 py-1 text-neutral-700 hover:text-main-blue transition-all cursor-pointer relative"
          aria-label="Abrir carrito de compras"
        >
          <div className="relative">
            <div className="size-13 -mt-6 rounded-full bg-main-blue text-white flex items-center justify-center shadow-md shadow-main-blue/20 active:scale-95 transition-transform">
              <ShoppingCart className="size-6" />
            </div>
            {totalItems > 0 && (
              <span className="absolute -top-6 -right-2 bg-main-red text-white text-[10px] font-extrabold size-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </div>
          <span className="text-[11px] font-semibold text-neutral-800 mt-0.5">
            Carrito
          </span>
          <span className="w-4 h-0.5 bg-transparent mt-0.5" />
        </button>

        {/* 4. Notificaciones / Avisos */}
        <button
          type="button"
          onClick={openNotifications}
          className="flex flex-col items-center justify-center flex-1 py-1 text-neutral-500 hover:text-neutral-900 font-medium transition-all cursor-pointer relative"
          aria-label="Abrir notificaciones"
        >
          <div className="relative">
            <Bell className="size-5 stroke-[1.6px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-main-red text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight">Avisos</span>
          <span className="w-4 h-0.5 bg-transparent mt-0.5" />
        </button>

        {/* 5. Cuenta / Perfil */}
        <Link
          to={isLogged ? "/perfil" : "/ingresar"}
          onClick={handleLinkClick}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            isProfile
              ? "text-main-blue font-bold"
              : "text-neutral-500 hover:text-neutral-900 font-medium"
          }`}
        >
          <User
            className={`size-5 stroke-[1.6px] transition-transform ${isProfile ? "scale-110" : ""}`}
          />
          <span className="text-[11px] mt-0.5 tracking-tight">
            {isLogged ? "Mi Perfil" : "Ingresar"}
          </span>
          <span
            className={`w-4 h-0.5 rounded-full mt-0.5 transition-all ${isProfile ? "bg-main-blue" : "bg-transparent"}`}
          />
        </Link>
      </div>
    </div>
  );
}
