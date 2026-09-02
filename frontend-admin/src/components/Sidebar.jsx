// src/components/Sidebar.jsx
import React, { useEffect, useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config/api";
import {
  ChevronDown,
  Home,
  List,
  Plus,
  ShoppingCart,
  Store,
  User,
  Package,
  LogOut,
  ShieldCheck,
  KeyRound,
  Lock,
  X,
  CheckCircle2,
  AlertCircle,
  Tv,
  ArrowUpRight,
} from "lucide-react";
import ButtonLoader from "./ui/ButtonLoader";

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useAppContext();
  const { user, logout, cambiarPassword } = useAuth();
  const [sucursales, setSucursales] = useState([]);
  const [modalSeguridadOpen, setModalSeguridadOpen] = useState(false);

  // Estados para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passError, setPassError] = useState(null);
  const [passSuccess, setPassSuccess] = useState(null);

  const iconStyle = "shrink-0 stroke-[1.5px] size-5 text-gray-600";

  const closeSidebar = () => {
    window.scroll({ top: 0, left: 0, behavior: "smooth" });
    setSidebarOpen(false);
  };

  useEffect(() => {
    const loadSucursales = async () => {
      try {
        const res = await fetch(`${API_URL}/sucursales`);
        const data = await res.json();

        setSucursales(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      }
    };

    loadSucursales();
  }, []);

  // Swipe to close
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    // Only apply swipe to close on mobile
    if (window.innerWidth >= 1024) return;
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    if (window.innerWidth >= 1024) return;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEndEvent = () => {
    if (window.innerWidth >= 1024) return;
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > minSwipeDistance) {
      // Swiped left
      closeSidebar();
    }
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

  const linkClassName = ({ isActive }) =>
    `block rounded-lg px-3.5 py-2 text-xs sm:text-sm font-bold transition-all flex gap-x-2.5 items-center ${
      isActive
        ? "bg-main-blue/10 text-main-blue shadow-2xs"
        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
    }`;

  return (
    <>
      {sidebarOpen && (
        <div
          aria-hidden="true"
          onClick={closeSidebar}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEndEvent}
          className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden touch-none"
        />
      )}

      <div
        id="dashboard-sidebar"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndEvent}
        className={`fixed inset-y-0 start-0 z-40 bg-white transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 overflow-hidden select-none ${
          sidebarOpen
            ? "w-64 translate-x-0 border-e border-gray-200"
            : "w-64 -translate-x-full lg:translate-x-0 lg:w-0 border-transparent"
        }`}
      >
        <div className="w-64 flex flex-col justify-between h-full overflow-y-auto">
          <div className="p-2">
            <img
              src="/favicon.svg"
              alt=""
              className="size-40 aspect-square mx-auto"
            />
          <p className="flex w-fit mx-auto text-lg">Panel de Administración</p>

          <ul className="mt-8 space-y-1">
            <li>
              <NavLink to="/" onClick={closeSidebar} className={linkClassName}>
                <Home className={iconStyle} /> Inicio
              </NavLink>
            </li>

            <li>
              <details
                open
                className="group [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900">
                  <p className="flex items-center gap-x-2 font-semibold">
                    <Store className={iconStyle} />
                    Sucursales
                  </p>
                  <ChevronDown className="shrink-0 size-4 text-neutral-600 transition duration-300 group-open:-rotate-180" />
                </summary>

                <ul className="mt-2 space-y-1.5 px-3">
                  {sucursales.map((sucursal) => (
                    <li key={sucursal.id} className="space-y-1">
                      <NavLink
                        to={`/sucursal/${sucursal.slug}`}
                        onClick={closeSidebar}
                        className={linkClassName}
                      >
                        {sucursal.nombre}
                      </NavLink>
                      <a
                        href={`/comandas/${sucursal.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg px-3 py-1 text-xs font-bold text-neutral-600 hover:bg-amber-50 hover:text-amber-900 flex items-center justify-between transition-colors ml-1 border border-neutral-100 bg-neutral-50/50"
                        title="Abrir pantalla KDS para Smart TV"
                      >
                        <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-800">
                          <Tv className="size-3.5 text-amber-600 shrink-0" />
                          <span>Comandas TV</span>
                        </span>
                        <ArrowUpRight className="size-3 text-neutral-400" />
                      </a>
                    </li>
                  ))}

                  <li className="pt-1">
                    <NavLink
                      to="/sucursales/nueva"
                      onClick={closeSidebar}
                      className={linkClassName}
                    >
                      <Plus className={iconStyle} /> Agregar Sucursal
                    </NavLink>
                  </li>
                </ul>
              </details>
            </li>

            <li>
              <details className="group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900">
                  <p className="flex items-center gap-x-2 font-semibold">
                    <List className={iconStyle} />
                    Catálogo
                  </p>
                  <ChevronDown className="shrink-0 size-4 text-neutral-600 transition duration-300 group-open:-rotate-180" />
                </summary>

                <ul className="mt-2 space-y-1 px-4">
                  <li>
                    <NavLink
                      to="/catalogo"
                      onClick={closeSidebar}
                      className={linkClassName}
                      end
                    >
                      Todos los productos
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/catalogo/nuevo-producto"
                      onClick={closeSidebar}
                      className={linkClassName}
                    >
                      <Plus className={iconStyle} /> Nuevo producto
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/catalogo/combos"
                      onClick={closeSidebar}
                      className={linkClassName}
                    >
                      <Package className={iconStyle} /> Creador de Combos
                    </NavLink>
                  </li>
                </ul>
              </details>
            </li>
          </ul>
        </div>

        <div className="sticky inset-x-0 bottom-0 border-t border-gray-100 bg-white p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-9 rounded-full bg-main-blue/10 text-main-blue font-black text-xs flex items-center justify-center border border-main-blue/20 shrink-0">
                {user?.nombre
                  ? user.nombre
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "AV"}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {user?.nombre || "Administrador"}
                </p>
                <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                  <span className="capitalize font-semibold text-main-blue">
                    {user?.rol || "Admin"}
                  </span>
                  {user?.email && (
                    <>
                      <span>·</span>
                      <span className="truncate">{user.email}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPassError(null);
                  setPassSuccess(null);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setModalSeguridadOpen(true);
                }}
                title="Cambiar contraseña"
                className="p-2 rounded-lg text-gray-400 hover:text-main-blue hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <KeyRound className="size-4" />
              </button>

              <button
                type="button"
                onClick={logout}
                title="Cerrar sesión"
                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* ─── Modal de Cambio de Contraseña para el Admin ─── */}
      {modalSeguridadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs select-none">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 bg-neutral-50/70">
              <div className="flex items-center gap-2">
                <Lock className="size-5 text-main-blue" />
                <h3 className="font-extrabold text-base text-neutral-900">
                  Seguridad de la Cuenta
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalSeguridadOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPassError(null);
                setPassSuccess(null);

                if (!currentPassword || !newPassword) {
                  setPassError("Completá la contraseña actual y la nueva.");
                  return;
                }

                if (newPassword !== confirmPassword) {
                  setPassError("Las nuevas contraseñas no coinciden.");
                  return;
                }

                if (newPassword.length < 4) {
                  setPassError(
                    "La contraseña debe tener al menos 4 caracteres.",
                  );
                  return;
                }

                setIsChangingPass(true);
                try {
                  const res = await cambiarPassword(
                    currentPassword,
                    newPassword,
                  );
                  setPassSuccess(res.message || "¡Contraseña actualizada!");
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setTimeout(() => {
                    setModalSeguridadOpen(false);
                  }, 1500);
                } catch (err) {
                  setPassError(
                    err.message || "Error al actualizar contraseña.",
                  );
                } finally {
                  setIsChangingPass(false);
                }
              }}
              className="p-5 sm:p-6 space-y-4"
            >
              {passError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                  <span>{passSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  required
                  placeholder="Tu contraseña actual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-main-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 4 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-main-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repetí la nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-main-blue focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalSeguridadOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                >
                  Cancelar
                </button>

                <ButtonLoader
                  value="Guardar Contraseña"
                  loadingValue="Actualizando..."
                  isLoading={isChangingPass}
                  classNames="px-4 py-2 bg-main-blue hover:bg-main-blue/90 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
