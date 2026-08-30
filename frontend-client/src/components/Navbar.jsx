import React, { useState } from "react";
import SearchInput from "@/components/SearchInput";
import { Link } from "react-router-dom";
import {
  Bell,
  Menu,
  ShoppingCart,
  User,
  Sparkles,
  LogOut,
  Package,
  Star,
} from "lucide-react";
import EnvioNavbar from "@/components/EnvioNavbar";
import { useAppContext } from "../context/AppContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useFavorites } from "../context/FavoritesContext";

const Navbar = () => {
  const { sidebarOpen, setSidebarOpen } = useAppContext();
  const { openCart, totalItems } = useCart();
  const { openNotifications, unreadCount } = useNotifications();
  const { favoritesCount } = useFavorites();
  const { user, isAuthenticated, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="flex sticky top-0 left-0 w-full bg-main-blue z-100">
      <div className="flex w-full items-center max-w-6xl h-14 lg:h-26 gap-6 lg:mx-auto pr-6 pl-4 lg:px-0">
        {/*Logo*/}
        <Link to="/" className="hidden lg:block size-25 aspect-square">
          <img
            src="/favicon.svg"
            alt="Abastecedora Valette"
            className="aspect-square"
          />
        </Link>
        {/*Menu hamburguesa mobile*/}
        <div className="flex lg:hidden size-10 aspect-square">
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-6 stroke-1 text-white" />
          </button>
        </div>

        {/*Buscador y links desktop*/}
        <div className="flex flex-row-reverse lg:flex-col h-fit w-full items-center lg:gap-3">
          <div className="flex w-full h-fit lg:gap-6">
            <div className="hidden lg:flex w-full h-fit">
              <SearchInput />
            </div>
            {/*Carrito, Notificaciones y Cuenta*/}
            <div className="flex w-fit h-fit text-white gap-7 lg:gap-8 items-center ml-auto lg:ml-0">
              <button
                type="button"
                aria-label="Carrito de compras"
                onClick={openCart}
                className="relative mt-2 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <ShoppingCart className="size-6 stroke-1" />
                {totalItems > 0 && (
                  <p className="flex size-5 lg:size-5.5 items-center justify-center absolute -top-2 lg:-top-3 -right-2 lg:-right-3 bg-red-500 rounded-full text-xs font-bold p-1 animate-in zoom-in-50">
                    {totalItems}
                  </p>
                )}
              </button>
              {/* Favoritos */}
              <Link
                to="/favoritos"
                aria-label="Mis Favoritos"
                className="relative mt-2 cursor-pointer hover:opacity-90 transition-opacity hidden sm:block"
              >
                <Star
                  className={`size-6 stroke-1 ${
                    favoritesCount > 0 ? "fill-amber-400 text-amber-400" : "text-white"
                  }`}
                />
                {favoritesCount > 0 && (
                  <p className="flex size-5 lg:size-5.5 items-center justify-center absolute -top-2 lg:-top-3 -right-2 lg:-right-3 bg-amber-500 rounded-full text-xs font-bold p-1 text-white animate-in zoom-in-50">
                    {favoritesCount}
                  </p>
                )}
              </Link>

              {/* Notificaciones */}
              <button
                type="button"
                aria-label="Notificaciones"
                onClick={openNotifications}
                className="relative mt-2 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <Bell className="size-6 stroke-1" />
                {unreadCount > 0 && (
                  <p className="flex size-5 lg:size-5.5 items-center justify-center absolute -top-2 lg:-top-3 -right-2 lg:-right-3 bg-red-500 rounded-full text-xs font-bold p-1 animate-in zoom-in-50">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </p>
                )}
              </button>
              {/* Botón Ingresar (no autenticado, visible en mobile y desktop) */}
              {!isAuthenticated && (
                <Link
                  to="/ingresar"
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white text-white hover:text-main-blue font-bold text-xs transition-all border border-white/20 flex items-center gap-1.5 mt-2"
                >
                  <User className="size-3.5" />
                  <span>Ingresar</span>
                </Link>
              )}

              {/* Menú de usuario logueado: solo desktop (mobile lo gestiona la Sidebar) */}
              {isAuthenticated && user && (
                <div className="hidden lg:block relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex size-9 rounded-full bg-white text-main-blue font-bold text-xs items-center justify-center shadow hover:opacity-95 cursor-pointer overflow-hidden border border-white/20"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.nombre}
                        className="size-full object-cover"
                      />
                    ) : (
                      user.nombre?.substring(0, 2).toUpperCase() || "AV"
                    )}
                  </button>

                  {userMenuOpen && (
                    <div
                      onClick={() => setUserMenuOpen(false)}
                      className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-neutral-200 py-2 text-neutral-800 z-50 animate-in fade-in zoom-in-95"
                    >
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="text-xs font-bold text-neutral-900 truncate">
                          {user.nombre}
                        </p>
                        {user.usuario && (
                          <p className="text-[11px] text-main-blue font-semibold">
                            @{user.usuario}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded w-fit border border-amber-200">
                          <Sparkles className="size-3 text-amber-600" />
                          <span>{user.puntos_acumulados || 0} pts</span>
                        </div>
                      </div>

                      <Link
                        to="/perfil"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium hover:bg-neutral-50 text-neutral-700 hover:text-main-blue transition-colors"
                      >
                        <User className="size-4" />
                        <span>Mi Perfil</span>
                      </Link>

                      <Link
                        to="/favoritos"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium hover:bg-neutral-50 text-neutral-700 hover:text-amber-600 transition-colors"
                      >
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                        <span>Mis Favoritos ({favoritesCount})</span>
                      </Link>

                      <Link
                        to="/perfil"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium hover:bg-neutral-50 text-neutral-700 hover:text-main-blue transition-colors"
                      >
                        <Package className="size-4" />
                        <span>Mis Pedidos</span>
                      </Link>

                      <div className="border-t border-neutral-100 my-1" />

                      <button
                        type="button"
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium hover:bg-red-50 text-red-600 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="size-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/*Envio y links*/}
          <div className="flex w-full h-fit items-center lg:gap-6">
            {/*Envio*/}
            <div className="hidden lg:block">
              <EnvioNavbar />
            </div>
            {/*Links desktop (oculto en mobile)*/}
            <nav
              aria-label="Navegación principal"
              className="hidden lg:flex w-fit ml-auto gap-4 items-center text-white"
            >
              <Link to="/categorias" aria-label="Categorías">
                Categorías
              </Link>
              <Link to="/productos" aria-label="Productos">
                Productos
              </Link>
              <Link to="/ofertas" aria-label="Ofertas">
                Ofertas
              </Link>
              <Link to="/sucursales" aria-label="Sucursales">
                Sucursales
              </Link>
              <Link to="/envios" aria-label="Envíos">
                Envíos
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
