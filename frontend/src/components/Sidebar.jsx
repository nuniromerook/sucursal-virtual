// src/components/Sidebar.jsx
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { API_URL } from "../config/api";
import {
  ChevronDown,
  Home,
  List,
  Plus,
  ShoppingCart,
  Store,
  User,
} from "lucide-react";

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useAppContext();
  const [sucursales, setSucursales] = useState([]);
  const iconStyle = "shrink-0 stroke-[1.5px] size-5 text-gray-50";

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
    `block rounded-lg px-4 py-2 text-sm font-medium transition-colors flex gap-x-2 items-center ${
      isActive
        ? "bg-gray-100 text-gray-900 text-gray-700"
        : "hover:bg-gray-100 hover:text-gray-900 text-gray-50"
    }`;

  return (
    <>
      {sidebarOpen && (
        <div
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden"
        />
      )}

      <div
        id="dashboard-sidebar"
        className={`fixed inset-y-0 start-0 z-40 flex w-64 flex-col justify-between overflow-y-auto border-e border-main-blue/30 bg-main-blue transition-transform duration-300 select-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-2">
          <img
            src="/favicon.svg"
            alt=""
            className="size-50 drop-shadow-lg drop-shadow-black/20 aspect-square mx-auto"
          />

          <ul className="mt-8 space-y-1">
            <li>
              <NavLink to="/" onClick={closeSidebar} className={linkClassName}>
                <Home
                  className={`${iconStyle} ${
                    linkClassName({
                      isActive: true,
                    })
                      ? "text-neutral-700"
                      : "text-neutral-50"
                  }`}
                />{" "}
                Inicio
              </NavLink>
            </li>

            <li>
              <details className="group [&_summary::-webkit-details-marker]:hidden text-gray-50">
                <summary className="flex items-center justify-between rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900">
                  <p className="flex items-center gap-x-2">
                    <Store className={iconStyle} />
                    Sucursales
                  </p>
                  <ChevronDown className="shrink-0 size-4 transition duration-300 group-open:-rotate-180" />
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
                <summary className="flex items-center justify-between rounded-lg px-4 py-2 text-sm font-medium text-gray-50 transition-colors hover:bg-gray-100 hover:text-gray-900">
                  <p className="flex items-center gap-x-2">
                    <List className={iconStyle} />
                    Catálogo
                  </p>
                  <ChevronDown className="shrink-0 size-4 transition duration-300 group-open:-rotate-180" />
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

            <li>
              <details className="group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between rounded-lg px-4 py-2 text-sm font-medium text-gray-50 transition-colors hover:bg-gray-100 hover:text-gray-900">
                  <p className="flex items-center gap-x-2">
                    <ShoppingCart className={iconStyle} />
                    Pedidos
                  </p>
                  <ChevronDown className="shrink-0 size-4 transition duration-300 group-open:-rotate-180" />
                </summary>

                <ul className="mt-2 space-y-1 px-4">
                  <li>
                    <NavLink
                      to="/nuevo-pedido"
                      onClick={closeSidebar}
                      className={linkClassName}
                    >
                      <Plus className={iconStyle} />
                      Nuevo pedido
                    </NavLink>
                  </li>

                  <li>
                    <NavLink
                      to="/historial-pedidos"
                      onClick={closeSidebar}
                      className={linkClassName}
                    >
                      Historial de Pedidos
                    </NavLink>
                  </li>
                </ul>
              </details>
            </li>

            <li>
              <NavLink
                to="/gestionar-usuarios"
                onClick={closeSidebar}
                className={linkClassName}
              >
                <User className={iconStyle} />
                Gestionar Usuarios
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="sticky inset-x-0 bottom-0 border-t border-gray-100">
          <NavLink
            to="/"
            onClick={closeSidebar}
            className="flex items-center gap-2 bg-white p-4 hover:bg-gray-50 hover:transition-colors"
          >
            <img
              alt=""
              src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40?auto=format&fit=crop&q=80&w=1160"
              className="size-10 rounded-full object-cover"
            />

            <p className="text-xs text-gray-900">
              <strong className="block font-medium">Eric Frusciante</strong>

              <span> eric@frusciante.com </span>
            </p>
          </NavLink>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
