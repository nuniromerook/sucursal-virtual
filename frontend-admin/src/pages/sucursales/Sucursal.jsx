import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { API_URL } from "../../config/api";

const NavLinkTab = ({ to, text, end }) => {
  return (
    <>
      <NavLink
        to={to}
        role="tab"
        end={end}
        aria-selected="true"
        className={({ isActive }) =>
          // Añadidos whitespace-nowrap y shrink-0 aquí
          `whitespace-nowrap py-2 px-4 rounded-t font-medium transition-colors hover:cursor-pointer ${
            isActive
              ? "bg-white text-neutral-800 border-x border-t border-neutral-300"
              : "text-neutral-700 border-b border-b-neutral-300"
          }`
        }
      >
        {text}
      </NavLink>
    </>
  );
};

const Sucursal = () => {
  // El segmento :id de la ruta "/sucursal/:id" en realidad contiene el
  // slug (ej: "luis-guillon"), igual que ya hacíamos con productos.
  const { slug: sucursalSlug } = useParams();
  const { setNavbarTitle, setBreadcrumbExtra } = useAppContext();
  const [sucursal, setSucursal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSucursal = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/sucursales/${sucursalSlug}`);
        const data = await res.json();

        if (data.error) {
          setNavbarTitle("Sucursal no encontrada");
          return;
        }

        setSucursal(data);
        setNavbarTitle(data.nombre);
        setBreadcrumbExtra({
          sucursalName: data.nombre,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSucursal();
    // Se re-ejecuta si cambiás de sucursal sin desmontar el componente
    // (ej: navegando de "Luis Guillón" a "Moreno" desde la Sidebar).
  }, [sucursalSlug]);

  return (
    <>
      <div className="flex flex-col bg-white h-full">
        <div
          role="tablist"
          className="sticky top-17 z-20 flex max-w-screen overflow-x-auto lg:top-0 scrollbar-none"
        >
          <div className="flex bg-neutral-100 px-4 pt-3 lg:w-full">
            <NavLinkTab
              to={`/sucursal/${sucursalSlug}`}
              text="Información general"
              end={true}
            />

            <NavLinkTab to="stock" text="Stock" end={false} />

            <NavLinkTab to="empleados" text="Empleados" end={true} />

            <NavLinkTab to="ajustes" text="Ajustes" end={true} />
            <div className="flex w-full border-b border-b-neutral-300" />
          </div>
        </div>

        <div role="tabpanel" className="flex-1 p-4">
          {isLoading ? (
            <p className="text-sm text-gray-500">Cargando sucursal...</p>
          ) : (
            // Le pasamos la sucursal ya cargada a las sub-páginas (Overview,
            // Stock, Info, Empleados) sin que cada una tenga que volver a
            // pedirla — la leen con useOutletContext().
            <Outlet context={{ sucursal }} />
          )}
        </div>
      </div>
    </>
  );
};

export default Sucursal;
