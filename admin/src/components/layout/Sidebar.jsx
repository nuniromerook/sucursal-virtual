// admin/src/components/layout/Sidebar.jsx
import {
  Layers,
  ClipboardList,
  ArrowDownToLine,
  Tag,
  Image as ImageIcon,
  LayoutTemplate,
  BarChart3,
  Database,
  Users,
  BellRing,
  UserCog,
  Store,
  X,
} from "lucide-react";
import { useAdmin } from "../../context/AdminContext";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useTabNavigation } from "../../context/TabNavigationContext";

export default function Sidebar({
  totalCortes = 0,
  mobileOpen = false,
  onCloseMobile,
}) {
  const { pedidosPendientesCount, selectedSucursal } = useAdmin();
  const { isManager } = useAuth();
  const { isConnected } = useSocket();
  const { activeTab, switchTab } = useTabNavigation();

  const groups = [
    {
      title: "Operación Diaria",
      items: [
        {
          id: "pedidos",
          label: "Comandas Web (KDS)",
          icon: ClipboardList,
          badge: pedidosPendientesCount > 0 ? pedidosPendientesCount : null,
          badgeClass: "bg-red-50 text-[#c53030]",
          staffAllowed: true,
        },
        {
          id: "catalogo",
          label: "Catálogo & Precios",
          icon: Layers,
          badge: totalCortes > 0 ? totalCortes : null,
          badgeClass: "bg-slate-100 text-slate-600",
          staffAllowed: true,
        },
        {
          id: "ingresos",
          label: "Ingreso de Carne",
          icon: ArrowDownToLine,
          staffAllowed: false,
        },
      ],
    },
    {
      title: "Sucursal Virtual",
      items: [
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
      ],
    },
    {
      title: "Administración",
      items: [
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
      ],
    },
  ];

  const visibleGroups = groups
    .map((g) => ({
      ...g,
      items: isManager ? g.items : g.items.filter((it) => it.staffAllowed),
    }))
    .filter((g) => g.items.length > 0);

  const handleSelectTab = (id) => {
    switchTab(id);
    onCloseMobile?.();
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/45 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-20 h-screen w-[236px] shrink-0 bg-white border-r border-slate-200 flex flex-col select-none transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Marca Valette OS compacta */}
        <div className="h-[52px] px-4 border-b border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSelectTab("pedidos")}
            className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#002244] text-white flex items-center justify-center font-black text-xs tracking-tight shrink-0">
              AV
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-xs font-extrabold tracking-tight text-slate-900 truncate">
                VALETTE OS
              </div>
              <div className="text-[10px] font-medium text-slate-500 truncate">
                Gestión Interna
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
              v2.0
            </span>
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Cerrar menú"
              className="lg:hidden p-1 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sucursal activa */}
        <div className="px-3 py-2.5 border-b border-slate-100 shrink-0">
          <div className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Sucursal activa
              </div>
              <div className="text-xs font-bold text-slate-800 truncate">
                {selectedSucursal?.nombre || "Luis Guillón"}
              </div>
            </div>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                selectedSucursal?.activa !== false
                  ? "bg-emerald-500"
                  : "bg-rose-500"
              }`}
            />
          </div>
        </div>

        {/* Navegación agrupada */}
        <nav
          aria-label="Módulos de gestión"
          className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4"
        >
          {visibleGroups.map((group) => (
            <div key={group.title}>
              <div className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[#002244]/8 text-[#002244] font-bold"
                          : "text-slate-600 font-semibold hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4 h-4 shrink-0 stroke-[2]" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.badge !== null && item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded ${
                            isActive
                              ? "bg-[#002244] text-white"
                              : item.badgeClass
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Estado técnico discreto */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/70 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Tiempo real</span>
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                isConnected ? "text-emerald-700" : "text-rose-600"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              {isConnected ? "Conectado" : "Reconectando"}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Database className="w-3 h-3" />
              Base VPS
            </span>
            <span className="font-mono text-[10px] font-semibold text-slate-700">
              valette_db
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
