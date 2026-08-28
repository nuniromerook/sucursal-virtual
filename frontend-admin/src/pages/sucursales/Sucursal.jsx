import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { useSocket } from "../../context/SocketContext";
import { API_URL } from "../../config/api";
import { Bell, Flame } from "lucide-react";

const NavLinkTab = ({ to, text, badge, end }) => {
  return (
    <NavLink
      to={to}
      role="tab"
      end={end}
      aria-selected="true"
      className={({ isActive }) =>
        `whitespace-nowrap py-2.5 px-4 rounded-t-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-2 hover:cursor-pointer ${
          isActive
            ? "bg-neutral-100 text-neutral-900 border-x border-t border-neutral-300 shadow-2xs"
            : "text-neutral-600 border-b border-b-neutral-300 hover:bg-neutral-200/80 rounded-b-none"
        }`
      }
    >
      <span>{text}</span>
      {badge > 0 && (
        <span className="bg-main-red text-white text-[11px] font-black rounded-full px-2 py-0.2 min-w-5 text-center animate-pulse">
          {badge}
        </span>
      )}
    </NavLink>
  );
};

const Sucursal = () => {
  const { slug: sucursalSlug } = useParams();
  const { setNavbarTitle, setBreadcrumbExtra } = useAppContext();
  const { joinSucursal, leaveSucursal, ultimoPedido } = useSocket();
  const [sucursal, setSucursal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pedidosPendientes, setPedidosPendientes] = useState(0);

  // Cargar datos de la sucursal
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

        // Unirse a la sala de Socket.io de esta sucursal
        if (data.id) {
          joinSucursal(data.id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSucursal();

    return () => {
      if (sucursal?.id) {
        leaveSucursal(sucursal.id);
      }
    };
  }, [sucursalSlug, joinSucursal, leaveSucursal]);

  // Cargar cantidad de pedidos pendientes y actualizar con Socket
  useEffect(() => {
    const fetchPendientes = async () => {
      if (!sucursal?.id) return;
      try {
        const res = await fetch(
          `${API_URL}/sucursales/${sucursal.id}/metricas?rango=hoy`,
        );
        const data = await res.json();
        if (data.pedidos_pendientes !== undefined) {
          setPedidosPendientes(data.pedidos_pendientes);
        }
      } catch (err) {
        console.error("Error al cargar pedidos pendientes:", err);
      }
    };

    fetchPendientes();
  }, [sucursal?.id, ultimoPedido]);

  return (
    <div className="flex flex-col bg-white min-h-full">
      <div
        role="tablist"
        className="sticky top-17 z-20 flex max-w-screen overflow-x-auto lg:top-0 scrollbar-none"
      >
        <div className="flex bg-neutral-200 px-4 pt-3 lg:w-full gap-1">
          <NavLinkTab
            to={`/sucursal/${sucursalSlug}`}
            text="Información general"
            end={true}
          />

          <NavLinkTab
            to="pedidos"
            text="Pedidos en vivo"
            badge={pedidosPendientes}
            end={true}
          />

          <NavLinkTab to="stock" text="Stock" end={false} />

          <NavLinkTab to="equipo" text="Equipo" end={true} />

          <NavLinkTab to="ajustes" text="Ajustes" end={true} />
          <div className="flex flex-1 border-b border-b-neutral-300" />
        </div>
      </div>

      <div role="tabpanel" className="flex-1 p-4 sm:p-6 bg-neutral-100">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-sm text-neutral-500">
            Cargando sucursal...
          </div>
        ) : (
          <Outlet
            context={{ sucursal, pedidosPendientes, setPedidosPendientes }}
          />
        )}
      </div>
    </div>
  );
};

export default Sucursal;
