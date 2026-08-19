import React, { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

const NavLinkTab = ({ to, text }) => {
  return (
    <>
      <NavLink
        to={to}
        role="tab"
        end
        aria-selected="true"
        className={({ isActive }) =>
          // Añadidos whitespace-nowrap y shrink-0 aquí
          `whitespace-nowrap py-2 px-4 rounded-t font-medium transition-colors hover:cursor-pointer ${
            isActive ? "bg-white text-neutral-800" : "text-neutral-700"
          }`
        }
      >
        {text}
      </NavLink>
    </>
  );
};

const Sucursal = ({ sucursalId }) => {
  const { setNavbarTitle } = useAppContext();

  useEffect(() => {
    setNavbarTitle("Sucursal");
  }, []);

  return (
    <>
      <div className="flex flex-col">
        <div
          role="tablist"
          className="sticky top-18 z-20 flex max-w-screen overflow-x-auto lg:top-0 bg-white scrollbar-none"
        >
          <div className="flex bg-neutral-100 px-4 pt-3 gap-3 lg:w-full">
            <NavLinkTab
              to={`/sucursal/${sucursalId}`}
              text="Información general"
            />

            <NavLinkTab to="stock" text="Stock" />

            <NavLinkTab to="empleados" text="Empleados" />

            <NavLinkTab to="informacion" text="Propiedades" />
          </div>
        </div>

        <div role="tabpanel" className="flex-1 p-4">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default Sucursal;
