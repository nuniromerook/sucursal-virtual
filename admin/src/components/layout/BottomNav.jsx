// admin/src/components/layout/BottomNav.jsx
import { useState } from "react";
import {
  Layers,
  ClipboardList,
  Tag,
  Image as ImageIcon,
  BarChart3,
  Users,
  BellRing,
  UserCog,
  Store,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useAdmin } from "../../context/AdminContext";
import { useAuth } from "../../context/AuthContext";
import { useTabNavigation } from "../../context/TabNavigationContext";

export default function BottomNav() {
  const { pedidosPendientesCount } = useAdmin();
  const { isManager } = useAuth();
  const { activeTab, switchTab } = useTabNavigation();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryItems = isManager
    ? [
        {
          id: "pedidos",
          label: "KDS",
          icon: ClipboardList,
          badge: pedidosPendientesCount > 0 ? pedidosPendientesCount : null,
        },
        { id: "catalogo", label: "Catálogo", icon: Layers },
        { id: "clientes", label: "Club", icon: Users },
        { id: "metricas", label: "Cierre", icon: BarChart3 },
      ]
    : [
        {
          id: "pedidos",
          label: "Mesa KDS",
          icon: ClipboardList,
          badge: pedidosPendientesCount > 0 ? pedidosPendientesCount : null,
        },
        { id: "catalogo", label: "Stock & Catálogo", icon: Layers },
      ];

  const extraItems = [
    { id: "combos", label: "Combos & Promos", icon: Tag },
    { id: "banners", label: "Banners Portada", icon: ImageIcon },
    { id: "notificaciones", label: "Difusión Push", icon: BellRing },
    { id: "equipo", label: "Equipo & Roles", icon: UserCog },
    { id: "ajustes", label: "Sucursal & Horarios", icon: Store },
  ];

  const isExtraActive = extraItems.some((item) => item.id === activeTab);

  return (
    <>
      {moreOpen && isManager && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/50 z-40 flex items-end"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="bg-white w-full rounded-t-3xl p-5 pb-20 space-y-2 shadow-2xl border-t border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Más Módulos
              </span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {extraItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      switchTab(item.id);
                      setMoreOpen(false);
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 text-xs font-bold cursor-pointer ${
                      isActive
                        ? "bg-[#c53030] border-[#c53030] text-white"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 z-40 py-2 px-3 flex items-center justify-around shadow-lg">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setMoreOpen(false);
                switchTab(item.id);
              }}
              className={`flex flex-col items-center gap-1 relative cursor-pointer transition-colors active:scale-95 ${
                isActive
                  ? "text-[#c53030] font-black"
                  : "text-slate-400 hover:text-[#002244] font-semibold"
              }`}
            >
              <Icon className="w-5 h-5 stroke-[2.2]" />
              <span className="text-[10px] leading-none">{item.label}</span>
              {item.badge && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#c53030] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {isManager && (
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={`flex flex-col items-center gap-1 relative cursor-pointer transition-colors active:scale-95 ${
              moreOpen || isExtraActive
                ? "text-[#c53030] font-black"
                : "text-slate-400 hover:text-[#002244] font-semibold"
            }`}
          >
            <MoreHorizontal className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] leading-none">Más</span>
          </button>
        )}
      </nav>
    </>
  );
}
