// frontend/src/components/Sidebar.jsx
import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  Home,
  Tag,
  Store,
  ShoppingBag,
  ShoppingCart,
  Package,
  User,
  LogOut,
  Sparkles,
  ChevronRight,
  Truck,
  X,
} from "lucide-react";

const categories = [
  { nameId: "vacuno", label: "Vacuno", emoji: "🐄" },
  { nameId: "cerdo", label: "Cerdo", emoji: "🐷" },
  { nameId: "pollo", label: "Pollo", emoji: "🐔" },
  { nameId: "embutidos", label: "Embutidos", emoji: "🌭" },
  { nameId: "preparados", label: "Preparados", emoji: "🍽️" },
  { nameId: "almacen", label: "Almacén", emoji: "🛒" },
];

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useAppContext();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems, openCart } = useCart();

  const closeSidebar = () => {
    window.scroll({ top: 0, left: 0, behavior: "smooth" });
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeSidebar();
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
      isActive
        ? "bg-white/15 text-white"
        : "text-white/80 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <>
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          aria-hidden="true"
          onClick={closeSidebar}
          className="fixed inset-0 z-30 bg-neutral-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Panel lateral */}
      <div
        id="ecom-sidebar"
        className={`fixed inset-y-0 start-0 z-40 flex w-72 flex-col bg-main-blue overflow-y-auto transition-transform duration-300 select-none shadow-2xl lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header del panel */}
        <div className="flex justify-between px-5 pt-5 pb-4 border-b border-white/10">
          <Link to="/" onClick={closeSidebar}>
            <img
              src="/favicon.svg"
              alt="Abastecedora Valette"
              className="h-30 w-auto drop-shadow"
            />
          </Link>
          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Cerrar menú"
            className="size-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white bg-white/10 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Cuerpo del menú */}
        <nav className="flex-1 px-4 py-5 space-y-1">
          {/* Inicio */}
          <NavLink to="/" end onClick={closeSidebar} className={linkClass}>
            <Home className="size-5 shrink-0" />
            <span>Inicio</span>
          </NavLink>

          {/* Carrito (abre drawer) */}
          <button
            type="button"
            onClick={() => {
              closeSidebar();
              openCart();
            }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          >
            <ShoppingCart className="size-5 shrink-0" />
            <span>Mi Carrito</span>
            {totalItems > 0 && (
              <span className="ml-auto bg-main-red text-white text-[10px] font-bold rounded-full px-2 py-0.5 min-w-5 text-center">
                {totalItems}
              </span>
            )}
          </button>

          {/* Separador: Tienda */}
          <div className="pt-4 pb-1">
            <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 px-3">
              Categorías
            </p>
          </div>

          {categories.map((cat) => (
            <NavLink
              key={cat.nameId}
              to={`/categoria/${cat.nameId}`}
              onClick={closeSidebar}
              className={linkClass}
            >
              <span className="text-base leading-none">{cat.emoji}</span>
              <span>{cat.label}</span>
              <ChevronRight className="size-4 ml-auto text-white/30" />
            </NavLink>
          ))}

          {/* Separador: Más */}
          <div className="pt-4 pb-1">
            <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 px-3">
              Información
            </p>
          </div>

          <NavLink to="/ofertas" onClick={closeSidebar} className={linkClass}>
            <Tag className="size-5 shrink-0" />
            <span>Ofertas</span>
          </NavLink>

          <NavLink
            to="/sucursales"
            onClick={closeSidebar}
            className={linkClass}
          >
            <Store className="size-5 shrink-0" />
            <span>Sucursales</span>
          </NavLink>

          <NavLink to="/envios" onClick={closeSidebar} className={linkClass}>
            <Truck className="size-5 shrink-0" />
            <span>Envíos</span>
          </NavLink>
        </nav>

        {/* Footer: sección de usuario */}
        <div className="sticky bottom-0 inset-x-0 bg-main-blue border-t border-white/10 p-4">
          {isAuthenticated && user ? (
            <>
              {/* Tarjeta de puntos (si tiene) */}
              {Number(user.puntos_acumulados) > 0 && (
                <div className="mb-3 flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-xl px-3 py-2">
                  <Sparkles className="size-4 text-amber-300 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-amber-200 font-semibold uppercase tracking-wider">
                      Puntos Valette
                    </p>
                    <p className="text-base font-extrabold text-amber-100 leading-tight">
                      {user.puntos_acumulados}{" "}
                      <span className="text-xs font-medium text-amber-300">
                        pts
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Datos del usuario */}
              <Link
                to="/perfil"
                onClick={closeSidebar}
                className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/10 transition-colors"
              >
                <div className="size-10 rounded-full bg-white text-main-blue font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.nombre}
                      className="size-full object-cover"
                    />
                  ) : (
                    user.nombre?.substring(0, 2).toUpperCase() || "AV"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">
                    {user.nombre}
                  </p>
                  {user.usuario ? (
                    <p className="text-xs text-white/60 truncate">
                      @{user.usuario}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-300 truncate">
                      Completá tu perfil → +50 pts
                    </p>
                  )}
                </div>
                <ChevronRight className="size-4 text-white/40 shrink-0" />
              </Link>

              {/* Mis Pedidos + Cerrar sesión */}
              <div className="mt-2 flex gap-2">
                <Link
                  to="/perfil"
                  onClick={closeSidebar}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all"
                >
                  <Package className="size-3.5" />
                  <span>Mis Pedidos</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-red-500/30 text-white hover:text-red-200 text-xs font-semibold transition-all cursor-pointer"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="size-3.5" />
                </button>
              </div>
            </>
          ) : (
            /* Usuario no autenticado */
            <div className="space-y-2">
              <p className="text-xs text-white/50 text-center mb-3">
                Ingresá para ver tus pedidos y puntos
              </p>
              <Link
                to="/ingresar"
                onClick={closeSidebar}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-main-blue font-bold text-sm hover:bg-neutral-100 transition-all shadow"
              >
                <User className="size-4" />
                <span>Ingresar a mi cuenta</span>
              </Link>
              <Link
                to="/ingresar"
                onClick={closeSidebar}
                state={{ defaultTab: "register" }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs font-semibold transition-all"
              >
                Crear cuenta y ganar puntos
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
