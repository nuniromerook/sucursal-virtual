// admin/src/components/layout/Navbar.jsx
import { useRef, useEffect } from "react";
import { Menu, Search, Volume2, Bell, LogOut } from "lucide-react";
import { useAdmin } from "../../context/AdminContext";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { useTabNavigation } from "../../context/TabNavigationContext";

const TAB_LABELS = {
  pedidos: "Comandas Web (KDS)",
  catalogo: "Catálogo & Precios",
  ingresos: "Ingreso de Carne",
  combos: "Combos & Promos",
  banners: "Banners Portada",
  contenido: "Contenido / Inicio",
  clientes: "Clientes & Club",
  notificaciones: "Difusión Push",
  metricas: "Cierre Operativo",
  equipo: "Equipo & Roles",
  ajustes: "Sucursal & Horarios",
};

export default function Navbar({ onOpenMobileMenu, onOpenCommandPalette }) {
  const { pedidosPendientesCount, selectedSucursal } = useAdmin();
  const { isConnected, reproducirSonidoComanda } = useSocket();
  const { user, logout } = useAuth();
  const { activeTab, switchTab } = useTabNavigation();
  const navbarRef = useRef(null);

  useEffect(() => {
    const updateHeight = () => {
      if (navbarRef.current) {
        document.documentElement.style.setProperty(
          "--navbar-height",
          `${navbarRef.current.offsetHeight}px`,
        );
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <header
      ref={navbarRef}
      className="h-[52px] bg-white border-b border-slate-200 sticky top-0 z-30 px-3.5 lg:px-6 flex items-center justify-between gap-3"
    >
      {/* Izquierda: menú mobile + breadcrumb activo */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Abrir navegación"
          className="lg:hidden p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-extrabold text-slate-900 tracking-tight truncate">
            {TAB_LABELS[activeTab] || "Panel"}
          </span>
          <span className="hidden sm:inline text-slate-300">/</span>
          <span className="hidden sm:inline text-xs font-medium text-slate-500 truncate">
            {selectedSucursal?.nombre || "Luis Guillón"}
          </span>
        </div>
      </div>

      {/* Centro: buscador rápido Ctrl+K */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-2">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-xs text-slate-500 cursor-pointer transition-colors"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Ir a un módulo o sección...</span>
          </span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white border border-slate-200 rounded shrink-0">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Derecha: controles operativos + perfil */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span
          className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
            isConnected
              ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
          {isConnected ? "En vivo" : "Reconectando"}
        </span>

        <button
          type="button"
          onClick={reproducirSonidoComanda}
          title="Probar sonido de comanda"
          aria-label="Probar sonido de comanda"
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <Volume2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => switchTab("pedidos")}
          title="Ver comandas activas"
          aria-label="Ver comandas activas"
          className="relative p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {pedidosPendientesCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-[#c53030] text-white text-[9px] font-black rounded-full flex items-center justify-center tabular-nums">
              {pedidosPendientesCount}
            </span>
          )}
        </button>

        <div className="h-4 w-px bg-slate-200 hidden sm:block mx-0.5" />

        <div className="flex items-center gap-2 pl-0.5">
          <div className="w-7 h-7 rounded-full bg-[#002244] text-white flex items-center justify-center text-[11px] font-bold">
            {user?.nombre ? user.nombre.slice(0, 2).toUpperCase() : "AV"}
          </div>
          <div className="hidden lg:flex flex-col leading-tight">
            <span className="text-xs font-bold text-slate-900">
              {user?.nombre || "Personal"}
            </span>
            {user?.rol && (
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                {user.rol}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-[#c53030] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
