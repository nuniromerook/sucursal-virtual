// src/components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useAppContext();

  const closeSidebar = () => setSidebarOpen(false);

  const linkClassName = ({ isActive }) =>
    `block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "bg-gray-100 text-gray-900"
        : "hover:bg-gray-100 hover:text-gray-900"
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
        className={`fixed inset-y-0 start-0 z-40 flex w-64 flex-col justify-between overflow-y-auto border-e border-gray-200 bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 py-2">
          <img
            src="/favicon.svg"
            alt=""
            className="size-40 aspect-square mx-auto"
          />
          <p className="flex w-fit mx-auto text-lg">Panel de Administración</p>

          <ul className="mt-8 space-y-1">
            <li>
              <NavLink to="/" onClick={closeSidebar} className={linkClassName}>
                Inicio
              </NavLink>
            </li>

            <li>
              <details className="group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900">
                  Sucursales
                  <span className="shrink-0 transition duration-300 group-open:-rotate-180">
                    <svg
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </summary>

                <ul className="mt-2 space-y-1 px-4">
                  <li>
                    <NavLink
                      to="/sucursal/luis-guillon"
                      onClick={closeSidebar}
                      className={linkClassName}
                    >
                      Luis Guillon
                    </NavLink>
                  </li>

                  <li>
                    <NavLink
                      to="/"
                      onClick={closeSidebar}
                      className={linkClassName}
                    >
                      + Agregar Sucursal
                    </NavLink>
                  </li>
                </ul>
              </details>
            </li>

            <li>
              <details className="group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900">
                  Catálogo de productos
                  <span className="shrink-0 transition duration-300 group-open:-rotate-180">
                    <svg
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
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
                      + Nuevo producto
                    </NavLink>
                  </li>
                </ul>
              </details>
            </li>

            <li>
              <details className="group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900">
                  Pedidos
                  <span className="shrink-0 transition duration-300 group-open:-rotate-180">
                    <svg
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </summary>

                <ul className="mt-2 space-y-1 px-4">
                  <li>
                    <NavLink
                      to="/nuevo-pedido"
                      onClick={closeSidebar}
                      className={linkClassName}
                    >
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
