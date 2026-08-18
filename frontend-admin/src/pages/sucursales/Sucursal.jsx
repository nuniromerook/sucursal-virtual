import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const Sucursal = ({ sucursalId }) => {
  return (
    <>
      <div role="tablist" className="flex gap-2">
        <NavLink
          to={`/sucursal/${sucursalId}`}
          role="tab"
          end
          aria-selected="true"
          className={({ isActive }) =>
            `border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-colors hover:text-gray-700 ${
              isActive ? "border-b-blue-600 text-blue-600" : "text-gray-600"
            }`
          }
        >
          Overview
        </NavLink>

        <NavLink
          to="stock"
          role="tab"
          aria-selected="false"
          className={({ isActive }) =>
            `border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-colors hover:text-gray-700 ${
              isActive ? "border-b-blue-600 text-blue-600" : "text-gray-600"
            }`
          }
        >
          Stock
        </NavLink>

        <NavLink
          to="empleados"
          role="tab"
          aria-selected="false"
          className={({ isActive }) =>
            `border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-colors hover:text-gray-700 ${
              isActive ? "border-b-blue-600 text-blue-600" : "text-gray-600"
            }`
          }
        >
          Empleados
        </NavLink>

        <NavLink
          to="informacion"
          role="tab"
          aria-selected="false"
          className={({ isActive }) =>
            `border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-colors hover:text-gray-700 ${
              isActive ? "border-b-blue-600 text-blue-600" : "text-gray-600"
            }`
          }
        >
          Información
        </NavLink>
      </div>

      <div role="tabpanel" className="mt-4">
        <Outlet />
      </div>
    </>
  );
};

export default Sucursal;
