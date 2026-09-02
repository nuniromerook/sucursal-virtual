import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, ShoppingBag, Bell, User } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";

export default function BottomNavbar() {
  const location = useLocation();
  const { totalItems = 0, openCart } = useCart();
  const { unreadCount = 0, openNotifications } = useNotifications();
  const { usuario } = useAuth();

  const currentPath = location.pathname;

  const isHome = currentPath === "/";
  const isCatalog = currentPath.startsWith("/productos") || 
                    currentPath === "/vacuno" || 
                    currentPath === "/cerdo" || 
                    currentPath === "/pollo" || 
                    currentPath === "/preparados" || 
                    currentPath === "/almacen";
  const isProfile = currentPath.startsWith("/perfil") || currentPath.startsWith("/ingresar");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-neutral-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 transition-all">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Inicio */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            isHome
              ? "text-main-blue font-bold"
              : "text-neutral-500 hover:text-neutral-900 font-medium"
          }`}
        >
          <div className="relative">
            <Home className={`size-5 transition-transform ${isHome ? "scale-110" : ""}`} />
            {isHome && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-main-blue rounded-full" />
            )}
          </div>
          <span className="text-[11px] mt-1 tracking-tight">Inicio</span>
        </Link>

        {/* 2. Catálogo */}
        <Link
          to="/productos"
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            isCatalog
              ? "text-main-blue font-bold"
              : "text-neutral-500 hover:text-neutral-900 font-medium"
          }`}
        >
          <div className="relative">
            <LayoutGrid className={`size-5 transition-transform ${isCatalog ? "scale-110" : ""}`} />
            {isCatalog && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-main-blue rounded-full" />
            )}
          </div>
          <span className="text-[11px] mt-1 tracking-tight">Catálogo</span>
        </Link>

        {/* 3. Carrito (Central con botón flotante / destacado) */}
        <button
          type="button"
          onClick={openCart}
          className="flex flex-col items-center justify-center flex-1 py-1 text-neutral-700 hover:text-main-blue transition-all cursor-pointer relative"
          aria-label="Abrir carrito de compras"
        >
          <div className="relative">
            <div className="size-10 -mt-3.5 rounded-full bg-main-blue text-white flex items-center justify-center shadow-md shadow-main-blue/30 active:scale-95 transition-transform">
              <ShoppingBag className="size-5" />
            </div>
            {totalItems > 0 && (
              <span className="absolute -top-3.5 -right-1 bg-main-red text-white text-[10px] font-extrabold size-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </div>
          <span className="text-[11px] font-semibold text-neutral-800 mt-0.5">Carrito</span>
        </button>

        {/* 4. Notificaciones / Avisos */}
        <button
          type="button"
          onClick={openNotifications}
          className="flex flex-col items-center justify-center flex-1 py-1 text-neutral-500 hover:text-neutral-900 font-medium transition-all cursor-pointer relative"
          aria-label="Abrir notificaciones"
        >
          <div className="relative">
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-main-red text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1 tracking-tight">Avisos</span>
        </button>

        {/* 5. Cuenta / Perfil */}
        <Link
          to={usuario ? "/perfil" : "/ingresar"}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            isProfile
              ? "text-main-blue font-bold"
              : "text-neutral-500 hover:text-neutral-900 font-medium"
          }`}
        >
          <div className="relative">
            <User className={`size-5 transition-transform ${isProfile ? "scale-110" : ""}`} />
            {isProfile && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-main-blue rounded-full" />
            )}
          </div>
          <span className="text-[11px] mt-1 tracking-tight">
            {usuario ? "Mi Perfil" : "Ingresar"}
          </span>
        </Link>
      </div>
    </div>
  );
}
