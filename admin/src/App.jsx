// admin/src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { AdminProvider } from "./context/AdminContext";
import {
  TabNavigationProvider,
  useTabNavigation,
} from "./context/TabNavigationContext";

import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import BottomNav from "./components/layout/BottomNav";
import CommandPalette from "./components/layout/CommandPalette";
import Toast from "./components/ui/Toast";

import CatalogoPage from "./pages/CatalogoPage";
import KdsPage from "./pages/KdsPage";
import IngresosPage from "./pages/IngresosPage";
import CombosPage from "./pages/CombosPage";
import BannersPage from "./pages/BannersPage";
import ContenidoInicioPage from "./pages/ContenidoInicioPage";
import MetricasPage from "./pages/MetricasPage";
import EquipoPage from "./pages/EquipoPage";
import NotificacionesPage from "./pages/NotificacionesPage";
import ClientesClubPage from "./pages/ClientesClubPage";
import AjustesSucursalPage from "./pages/AjustesSucursalPage";
import LoginPage from "./pages/LoginPage";

function AppContent() {
  const { isAuthenticated, isLoading, isManager } = useAuth();
  const { activeTab } = useTabNavigation();
  const [totalCortes, setTotalCortes] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Atajo global Ctrl+K / Cmd+K para saltar rápido entre módulos
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f6f8fa] text-slate-700 text-xs font-semibold">
        <div className="flex items-center gap-2.5 bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#002244] animate-pulse" />
          <span>Iniciando Valette OS...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const effectiveTab =
    !isManager && activeTab !== "pedidos" && activeTab !== "catalogo"
      ? "pedidos"
      : activeTab;

  return (
    <div className="min-h-screen flex bg-[#f6f8fa] text-slate-900 antialiased">
      <Sidebar
        totalCortes={totalCortes}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenCommandPalette={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-6 max-w-[1440px] w-full mx-auto pb-24 lg:pb-8">
          <div style={{ display: effectiveTab === "pedidos" ? "block" : "none" }}>
            <KdsPage />
          </div>

          <div style={{ display: effectiveTab === "catalogo" ? "block" : "none" }}>
            <CatalogoPage onProductsLoaded={(cnt) => setTotalCortes(cnt)} />
          </div>

          {isManager && (
            <>
              <div style={{ display: effectiveTab === "ingresos" ? "block" : "none" }}>
                <IngresosPage />
              </div>

              <div style={{ display: effectiveTab === "combos" ? "block" : "none" }}>
                <CombosPage />
              </div>

              <div style={{ display: effectiveTab === "banners" ? "block" : "none" }}>
                <BannersPage />
              </div>

              <div style={{ display: effectiveTab === "contenido" ? "block" : "none" }}>
                <ContenidoInicioPage />
              </div>

              <div style={{ display: effectiveTab === "clientes" ? "block" : "none" }}>
                <ClientesClubPage />
              </div>

              <div style={{ display: effectiveTab === "notificaciones" ? "block" : "none" }}>
                <NotificacionesPage />
              </div>

              <div style={{ display: effectiveTab === "metricas" ? "block" : "none" }}>
                <MetricasPage />
              </div>

              <div style={{ display: effectiveTab === "equipo" ? "block" : "none" }}>
                <EquipoPage />
              </div>

              <div style={{ display: effectiveTab === "ajustes" ? "block" : "none" }}>
                <AjustesSucursalPage />
              </div>
            </>
          )}
        </main>
      </div>

      <BottomNav />
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AdminProvider>
            <TabNavigationProvider>
              <AppContent />
            </TabNavigationProvider>
          </AdminProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
