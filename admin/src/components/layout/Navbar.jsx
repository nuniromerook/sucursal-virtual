// admin/src/components/layout/Navbar.jsx
import { useRef, useEffect } from "react";
import { Volume2, Bell, LogOut } from "lucide-react";
import { useAdmin } from "../../context/AdminContext";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { useTabNavigation } from "../../context/TabNavigationContext";

export default function Navbar() {
  const { pedidosPendientesCount } = useAdmin();
  const { isConnected, reproducirSonidoComanda } = useSocket();
  const { user, logout } = useAuth();
  const { switchTab } = useTabNavigation();
  const navbarRef = useRef(null);

  // Sincronizar altura de navbar en CSS variable
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
      className="bg-[#002244] border-b border-brand-dark text-white sticky top-0 z-40 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 h-18 flex items-center justify-between gap-3">
        {/* Logo Oficial Valette + Indicador de Sucursal Única */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <button
            type="button"
            onClick={() => switchTab("catalogo")}
            className="flex items-center gap-2 group text-left cursor-pointer"
          >
            <img
              src="/favicon.svg"
              alt="Abastecedora Valette"
              className="h-13 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <div className="leading-tight hidden sm:block">
              <div className="font-extrabold text-xs sm:text-sm tracking-wide flex items-center gap-1.5">
                ABASTECEDORA VALETTE
                <span className="text-[9px] uppercase font-bold bg-white/15 px-1.5 py-0.5 rounded text-slate-200">
                  ADMIN
                </span>
              </div>
              <div className="text-[10px] text-slate-300 hidden sm:block font-medium">
                Sucursal Virtual - Panel de administración
              </div>
            </div>
          </button>
        </div>

        {/* Indicadores en vivo & Controles de Mostrador */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Indicador KDS online en escritorio */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/30 rounded text-[11px] text-emerald-300 font-medium">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
              }`}
            ></span>
            <span>{isConnected ? "Conectado" : "Reconectando..."}</span>
          </div>

          {/* Test de sonido de comanda */}
          <button
            type="button"
            onClick={reproducirSonidoComanda}
            title="Probar sonido de comanda"
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Acceso directo a KDS con badge */}
          <button
            type="button"
            onClick={() => switchTab("pedidos")}
            className="relative p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Ver pedidos de corte"
          >
            <Bell className="w-4 h-4" />
            {pedidosPendientesCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#c53030] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#002244]">
                {pedidosPendientesCount}
              </span>
            )}
          </button>

          <div className="h-4 w-px bg-white/20 hidden sm:block"></div>

          {/* Perfil & Logout */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold border border-white/20">
              {user?.nombre ? user.nombre.slice(0, 2).toUpperCase() : "AV"}
            </div>
            <div className="hidden lg:flex flex-col leading-tight">
              <span className="text-xs font-semibold text-slate-100">
                {user?.nombre || "Personal"}
              </span>
              {user?.rol && (
                <span className="text-[9px] uppercase font-extrabold tracking-wider text-amber-300">
                  {user.rol}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={logout}
              title="Cerrar sesión"
              className="p-1.5 rounded hover:bg-red-500/20 text-slate-300 hover:text-red-300 transition-colors ml-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
