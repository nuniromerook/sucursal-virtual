// frontend/src/components/Sidebar.jsx
import React, { useEffect, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
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
  Star,
  X,
  MapPin,
  Compass,
  CheckCircle2,
} from "lucide-react";
import { useLocationCoverage } from "../context/LocationContext";

const categories = [
  { nameId: "vacuno", label: "Vacuno", emoji: "🥩" },
  { nameId: "cerdo", label: "Cerdo", emoji: "🐷" },
  { nameId: "pollo", label: "Pollo", emoji: "🍗" },
  { nameId: "preparados", label: "Preparados", emoji: "🍲" },
  { nameId: "almacen", label: "Almacén", emoji: "🧂" },
];

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useAppContext();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems, openCart } = useCart();
  const { favoritesCount } = useFavorites();
  const { coords, isInCoverage, distanceKm, detectLocation, isDetecting } =
    useLocationCoverage();
  const sidebarRef = useRef(null);

  // Swipe to close
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEndEvent = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > minSwipeDistance) {
      // Swiped left
      closeSidebar();
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleNavClick = () => {
    window.scroll({ top: 0, left: 0, behavior: "smooth" });
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeSidebar();
  };

  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

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
          onClick={() => setSidebarOpen(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEndEvent}
          className="fixed inset-0 z-101 bg-neutral-900/60 backdrop-blur-xs lg:hidden touch-none"
        />
      )}

      {/* Panel lateral */}
      <div
        id="ecom-sidebar"
        ref={sidebarRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndEvent}
        className={`fixed inset-y-0 inset-s-0 z-101 flex w-72 flex-col bg-main-blue overflow-y-auto transition-transform duration-300 select-none shadow-2xl lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header del panel */}
        <div className="flex justify-between px-5 pt-5 pb-4 border-b border-white/10">
          <Link to="/" onClick={handleNavClick}>
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

        {/* Módulo de Cobertura de Envíos en Mobile (Opaco, alto contraste) */}
        <div className="px-4 pt-4 pb-2 border-b border-white/10">
          {coords && isInCoverage === false && (
            <div className="rounded-xl bg-amber-500 text-neutral-950 p-3 shadow-md border border-amber-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="size-4.5 text-neutral-950 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-tight">
                    Fuera de cobertura (10 km)
                  </p>
                  <p className="text-[11px] font-semibold text-neutral-900 mt-0.5 leading-snug">
                    Estás a {distanceKm} km. ¡Podés pedir online y retirar en sucursal!
                  </p>
                  <Link
                    to="/sucursales"
                    onClick={handleNavClick}
                    className="inline-block mt-2 px-2.5 py-1 bg-neutral-950 text-amber-300 hover:bg-neutral-800 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                  >
                    Ver sucursal y mapa
                  </Link>
                </div>
              </div>
            </div>
          )}

          {coords && isInCoverage === true && (
            <div className="rounded-xl bg-emerald-700 text-white p-3 shadow-md border border-emerald-800">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4.5 text-emerald-200 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-tight">
                    En zona de entrega
                  </p>
                  <p className="text-[11px] font-medium text-emerald-100 mt-0.5 leading-snug">
                    A {distanceKm} km de la sucursal. Envíos programados de 07:00 a 14:30 hs.
                  </p>
                  <Link
                    to="/envios"
                    onClick={handleNavClick}
                    className="inline-block mt-1 text-[10px] font-bold text-white underline hover:text-emerald-100"
                  >
                    Detalles de logística
                  </Link>
                </div>
              </div>
            </div>
          )}

          {!coords && (
            <button
              type="button"
              onClick={detectLocation}
              disabled={isDetecting}
              className="w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white p-2.5 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Compass className={`size-4 ${isDetecting ? "animate-spin" : ""}`} />
              <span>{isDetecting ? "Detectando..." : "Comprobar cobertura (10 km)"}</span>
            </button>
          )}
        </div>

        {/* Cuerpo del menú */}
        <nav className="flex-1 px-4 py-5 space-y-1">
          {/* Inicio */}
          <NavLink to="/" end onClick={handleNavClick} className={linkClass}>
            <Home className="size-5 shrink-0" />
            <span>Inicio</span>
          </NavLink>

          {/* Carrito (abre drawer) */}
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
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

          {/* Mis Favoritos */}
          <NavLink to="/favoritos" onClick={handleNavClick} className={linkClass}>
            <Star className="size-5 shrink-0 fill-amber-400 text-amber-400" />
            <span>Mis Favoritos</span>
            {favoritesCount > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5 min-w-5 text-center shadow-2xs">
                {favoritesCount}
              </span>
            )}
          </NavLink>

          {/* Separador: Tienda */}
          <div className="pt-4 pb-1">
            <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 px-3">
              Categorías
            </p>
          </div>

          {categories.map((cat) => (
            <NavLink
              key={cat.nameId}
              to={`/${cat.nameId}`}
              onClick={handleNavClick}
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

          {/* Ofertas */}
          <NavLink to="/ofertas" onClick={handleNavClick} className={linkClass}>
            <Tag className="size-5 shrink-0" />
            <span>Ofertas</span>
          </NavLink>

          <NavLink
            to="/sucursales"
            onClick={handleNavClick}
            className={linkClass}
          >
            <Store className="size-5 shrink-0" />
            <span>Sucursales</span>
          </NavLink>

          <NavLink to="/envios" onClick={handleNavClick} className={linkClass}>
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
                onClick={handleNavClick}
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
                  onClick={handleNavClick}
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
                onClick={handleNavClick}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-main-blue font-bold text-sm hover:bg-neutral-100 transition-all shadow"
              >
                <User className="size-4" />
                <span>Ingresar a mi cuenta</span>
              </Link>
              <Link
                to="/ingresar"
                onClick={handleNavClick}
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
