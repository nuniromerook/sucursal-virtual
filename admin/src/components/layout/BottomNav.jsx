// admin/src/components/layout/BottomNav.jsx
import React from "react";
import {
  Layers,
  ClipboardList,
  Tag,
  Image as ImageIcon,
  BarChart3,
} from "lucide-react";
import { useAdmin } from "../../context/AdminContext";
import { useTabNavigation } from "../../context/TabNavigationContext";

export default function BottomNav() {
  const { pedidosPendientesCount } = useAdmin();
  const { activeTab, switchTab } = useTabNavigation();

  const navItems = [
    {
      id: "catalogo",
      label: "Catálogo",
      icon: Layers,
    },
    {
      id: "pedidos",
      label: "KDS",
      icon: ClipboardList,
      badge: pedidosPendientesCount > 0 ? pedidosPendientesCount : null,
    },
    {
      id: "combos",
      label: "Combos",
      icon: Tag,
    },
    {
      id: "banners",
      label: "Banners",
      icon: ImageIcon,
    },
    {
      id: "metricas",
      label: "Cierre",
      icon: BarChart3,
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 z-40 py-2 px-3 flex items-center justify-around shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => switchTab(item.id)}
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
    </nav>
  );
}
