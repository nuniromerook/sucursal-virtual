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
  ChevronDown,
  MapPin,
} from "lucide-react";
import EnvioNavbar from "@/components/EnvioNavbar";
import { useAppContext } from "../context/AppContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useFavorites } from "../context/FavoritesContext";
import { useLocationCoverage } from "../context/LocationContext";

const CATEGORIAS_MENU = [
  { nameId: "vacuno", label: "Carne Vacuna", emoji: "🥩", desc: "Novillo y ternera seleccionada" },
  { nameId: "cerdo", label: "Cortes de Cerdo", emoji: "🐷", desc: "Bondiola, pechito, matambrito" },
  { nameId: "pollo", label: "Pollo & Granja", emoji: "🍗", desc: "Supremas, pata muslo, alitas" },
  { nameId: "embutidos", label: "Embutidos & Achuras", emoji: "🌭", desc: "Chorizos artesanales, morcillas" },
  { nameId: "preparados", label: "Preparados & Milanesas", emoji: "🍲", desc: "Milanesas caseras, elaborados" },
  { nameId: "combos", label: "Combos de Ahorro", emoji: "📦", desc: "Packs parrilleros familiares" },
  { nameId: "almacen", label: "Almacén & Carbón", emoji: "🧂", desc: "Especias, sales, acompañamientos" },
  { nameId: "ofertas", label: "Ofertas Especiales", emoji: "🔥", desc: "Precios promocionales del día" },
];

const Navbar = () => {
  const { sidebarOpen, setSidebarOpen } = useAppContext();
  const { openCart, totalItems } = useCart();
  const { openNotifications, unreadCount } = useNotifications();
  const { favoritesCount } = useFavorites();
  const { user, isAuthenticated, logout } = useAuth();
  const { coords, isInCoverage, distanceKm } = useLocationCoverage();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categoriasMenuOpen, setCategoriasMenuOpen] = useState(false);

  return (
    <header className="flex flex-col sticky top-0 left-0 w-full bg-main-blue z-100 shadow-xs">
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
              className="hidden lg:flex w-fit ml-auto gap-5 items-center text-white font-semibold text-sm"
            >
              {/* Dropdown de Categorías */}
              <div
                className="relative"
                onMouseEnter={() => setCategoriasMenuOpen(true)}
                onMouseLeave={() => setCategoriasMenuOpen(false)}
              >
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={categoriasMenuOpen}
                  onClick={() => setCategoriasMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 hover:text-blue-100 transition-colors cursor-pointer py-1.5"
                >
                  <span>Categorías</span>
                  <ChevronDown
                    className={`size-3.5 transition-transform duration-200 ${
                      categoriasMenuOpen ? "rotate-180 text-blue-200" : "text-white/70"
                    }`}
                  />
                </button>

                {categoriasMenuOpen && (
                  <div
                    onClick={() => setCategoriasMenuOpen(false)}
                    className="absolute left-0 top-full mt-1.5 w-72 rounded-2xl bg-white shadow-2xl border border-neutral-200/90 p-2 text-neutral-800 z-110 animate-in fade-in zoom-in-95"
                  >
                    <div className="px-3 py-1.5 border-b border-neutral-100 mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                        Categorías de Carnicería
                      </span>
                      <Link
                        to="/productos"
                        className="text-[11px] font-bold text-main-blue hover:underline"
                      >
                        Ver todo
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-0.5">
                      {CATEGORIAS_MENU.map((cat) => (
                        <Link
                          key={cat.nameId}
                          to={`/${cat.nameId}`}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-colors group"
                        >
                          <span className="text-xl shrink-0 p-1.5 bg-neutral-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                            {cat.emoji}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-neutral-900 group-hover:text-main-blue transition-colors">
                              {cat.label}
                            </p>
                            <p className="text-[10px] text-neutral-400 truncate">
                              {cat.desc}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/productos"
                aria-label="Productos"
                className="hover:text-blue-100 transition-colors"
              >
                Productos
              </Link>
              <Link
                to="/ofertas"
                aria-label="Ofertas"
                className="hover:text-blue-100 transition-colors flex items-center gap-1 text-amber-300"
              >
                <span>Ofertas</span>
              </Link>
              <Link
                to="/sucursales"
                aria-label="Sucursales"
                className="hover:text-blue-100 transition-colors"
              >
                Sucursales
              </Link>
              <Link
                to="/envios"
                aria-label="Envíos"
                className="hover:text-blue-100 transition-colors"
              >
                Envíos
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* ─── Aviso de Cobertura en Desktop (Sub-barra elegante que no deforma la Navbar) ─── */}
      {coords && isInCoverage === false && (
        <div className="hidden lg:block w-full bg-amber-500 text-neutral-950 border-t border-amber-600/30 py-1.5 px-4 shadow-inner animate-in fade-in duration-200">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-neutral-950" />
              <span>
                Estás a {distanceKm} km (fuera del área de 10 km para envíos a domicilio). ¡Pero podés comprar online y retirar por nuestra sucursal de Luis Guillón! 🥩
              </span>
            </div>
            <Link
              to="/sucursales"
              className="bg-neutral-950 hover:bg-neutral-800 text-amber-300 px-3 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider transition-colors shrink-0 ml-4 shadow-2xs"
            >
              Ver sucursal y mapa
            </Link>
          </div>
        </div>
      )}

      {coords && isInCoverage === true && (
        <div className="hidden lg:block w-full bg-emerald-700 text-white border-t border-emerald-800/40 py-1 px-4 animate-in fade-in duration-200">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-[11px] font-bold">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-300 animate-pulse shrink-0" />
              <span>
                Dentro del área de entrega (a {distanceKm} km de sucursal Luis Guillón). Envíos programados de 07:00 a 14:30 hs.
              </span>
            </div>
            <Link
              to="/envios"
              className="underline hover:text-emerald-100 text-[11px] shrink-0 ml-4 font-extrabold"
            >
              Detalles de logística
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
