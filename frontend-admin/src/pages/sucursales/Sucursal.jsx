// frontend-admin/src/pages/sucursales/Sucursal.jsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { useSocket } from "../../context/SocketContext";
import { VITE_API_URL } from "../../config/api";
import {
  Info,
  Bell,
  Users,
  Settings,
  Megaphone,
  Layers,
  Tv,
  Activity,
} from "lucide-react";

const NavLinkTab = ({ to, text, icon: Icon, badge, end }) => {
  return (
    <NavLink
      to={to}
      role="tab"
      end={end}
      className={({ isActive }) =>
        `whitespace-nowrap py-2 px-3.5 rounded-md font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
          isActive
            ? "bg-main-blue text-white shadow-2xs active-tab"
            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
        }`
      }
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      <span>{text}</span>
      {badge > 0 && (
        <span className="bg-main-red text-white text-[11px] font-black rounded-full px-2 py-0.2 min-w-5 text-center animate-pulse shadow-2xs">
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
  const tabContainerRef = React.useRef(null);

  // Scroll active tab into view
  useEffect(() => {
    if (tabContainerRef.current) {
      const activeBtn = tabContainerRef.current.querySelector(".active-tab");
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  });

  // Cargar datos de la sucursal
  useEffect(() => {
    const loadSucursal = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${VITE_API_URL}/sucursales/${sucursalSlug}`);
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
          `${VITE_API_URL}/sucursales/${sucursal.id}/metricas?rango=hoy`,
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
    <div className="flex flex-col gap-5">
      {/* ─── Pestañas de Navegación de la Sucursal ─── */}
      <div
        ref={tabContainerRef}
        role="tablist"
        className="bg-white rounded-lg p-1.5 border border-neutral-200/80 shadow-2xs flex items-center gap-1.5 overflow-x-auto scrollbar-none"
      >
        <NavLinkTab
          to={`/sucursal/${sucursalSlug}`}
          text="Información general"
          icon={Info}
          end={true}
        />

        <NavLinkTab
          to="pedidos"
          text="Pedidos en vivo"
          icon={Bell}
          badge={pedidosPendientes}
          end={true}
        />

        <NavLinkTab
          to="notificaciones"
          text="Notificaciones"
          icon={Megaphone}
          end={true}
        />

        <NavLinkTab
          to="banners"
          text="Banners & Publicidad"
          icon={Layers}
          end={true}
        />

        <NavLinkTab to="equipo" text="Equipo" icon={Users} end={true} />

        <NavLinkTab
          to="rendimiento"
          text="Rendimiento"
          icon={Activity}
          end={true}
        />

        <NavLinkTab to="ajustes" text="Ajustes" icon={Settings} end={true} />
      </div>

      {/* ─── Contenido Dinámico de la Pestaña ─── */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-sm text-neutral-500 bg-white rounded-lg border border-neutral-200/80 shadow-2xs">
            Cargando datos de la sucursal...
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
