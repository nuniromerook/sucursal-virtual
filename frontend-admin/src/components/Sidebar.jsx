// src/components/Sidebar.jsx
import React, { useEffect, useState } from "react";
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
  LogOut,
  ShieldCheck,
} from "lucide-react";

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useAppContext();
  const { user, logout } = useAuth();
  const [sucursales, setSucursales] = useState([]);
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
          className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden"
        />
      )}

      <div
        id="dashboard-sidebar"
        className={`fixed inset-y-0 start-0 z-40 flex w-64 flex-col justify-between overflow-y-auto border-e border-gray-200 bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 select-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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
              <details className="group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900">
                  <p className="flex items-center gap-x-2 font-semibold">
                    <Store className={iconStyle} />
                    Sucursales
                  </p>
                  <ChevronDown className="shrink-0 size-4 text-neutral-600 transition duration-300 group-open:-rotate-180" />
                </summary>

                <ul className="mt-2 space-y-1 px-4">
                  {sucursales.map((sucursal) => (
                    <li key={sucursal.id}>
                      <NavLink
                        to={`/sucursal/${sucursal.slug}`}
                        onClick={closeSidebar}
                        className={linkClassName}
                      >
                        {sucursal.nombre}
                      </NavLink>
                    </li>
                  ))}

                  <li>
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

            <button
              type="button"
              onClick={logout}
              title="Cerrar sesión"
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
