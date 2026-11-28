// admin/src/components/layout/Sidebar.jsx
import {
  Layers,
  ClipboardList,
  Tag,
  Image as ImageIcon,
  LayoutTemplate,
  BarChart3,
  Database,
  Users,
  BellRing,
  UserCog,
  Store,
} from "lucide-react";
import { useAdmin } from "../../context/AdminContext";
import { useAuth } from "../../context/AuthContext";
import { useTabNavigation } from "../../context/TabNavigationContext";

export default function Sidebar({ totalCortes = 0 }) {
  const { pedidosPendientesCount } = useAdmin();
  const { isManager } = useAuth();
  const { activeTab, switchTab } = useTabNavigation();

  const allNavItems = [
    {
      id: "pedidos",
      label: "Mesa de Corte (KDS)",
      icon: ClipboardList,
      badge: pedidosPendientesCount > 0 ? pedidosPendientesCount : null,
      badgeClass: "bg-red-100 text-red-700",
      staffAllowed: true,
    },
    {
      id: "catalogo",
      label: "Catálogo & Cortes",
      icon: Layers,
      badge: totalCortes > 0 ? totalCortes : null,
      badgeClass: "bg-slate-100 text-slate-700",
      staffAllowed: true,
    },
    {
      id: "combos",
      label: "Combos & Promos",
      icon: Tag,
      staffAllowed: false,
    },
    {
      id: "banners",
      label: "Banners Portada",
      icon: ImageIcon,
      staffAllowed: false,
    },
    {
      id: "contenido",
      label: "Contenido / Inicio",
      icon: LayoutTemplate,
      staffAllowed: false,
    },
    {
      id: "clientes",
      label: "Clientes & Club",
      icon: Users,
      staffAllowed: false,
    },
    {
      id: "notificaciones",
      label: "Difusión Push",
      icon: BellRing,
      staffAllowed: false,
    },
    {
      id: "metricas",
      label: "Cierre Operativo",
      icon: BarChart3,
      staffAllowed: false,
    },
    {
      id: "equipo",
      label: "Equipo & Roles",
      icon: UserCog,
      staffAllowed: false,
    },
    {
      id: "ajustes",
      label: "Sucursal & Horarios",
      icon: Store,
      staffAllowed: false,
    },
  ];

  const navItems = isManager
    ? allNavItems
    : allNavItems.filter((item) => item.staffAllowed);

  return (
    <aside className="hidden lg:flex sticky top-24 left-0 w-60 shrink-0 flex-col space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
          Módulos de Gestión
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => switchTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#c53030] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0 stroke-[2.2]" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                    isActive ? "bg-white/20 text-white" : item.badgeClass
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sync Status Info */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 text-[11px] space-y-1.5 shadow-xs">
        <div className="flex items-center justify-between text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Database className="w-3.5 h-3.5" />
            PostgreSQL VPS:
          </span>
          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
            valette_db
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500 font-medium">
          <span>Estado Sync:</span>
          <span className="text-emerald-600 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Al día
          </span>
        </div>
      </div>
    </aside>
  );
}
