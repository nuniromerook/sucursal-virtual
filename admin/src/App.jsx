// admin/src/App.jsx
import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { AdminProvider } from "./context/AdminContext";
import { TabNavigationProvider, useTabNavigation } from "./context/TabNavigationContext";

import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import BottomNav from "./components/layout/BottomNav";
import Toast from "./components/ui/Toast";

import CatalogoPage from "./pages/CatalogoPage";
import KdsPage from "./pages/KdsPage";
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

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#002244] text-white text-xs font-semibold">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#c53030] animate-ping"></span>
          <span>Iniciando panel Valette Admin...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Si es rol cortador y por algún motivo quedara en un tab de gestión, mostrar KDS
  const effectiveTab =
    !isManager && activeTab !== "pedidos" && activeTab !== "catalogo"
      ? "pedidos"
      : activeTab;

  return (
    <div className="min-h-screen pb-24 lg:pb-12 bg-[#F6F8FA] antialiased">
      <Navbar />

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 pt-4 flex gap-6">
        <Sidebar totalCortes={totalCortes} />

        <main className="flex-1 min-w-0">
          <div style={{ display: effectiveTab === "pedidos" ? "block" : "none" }}>
            <KdsPage />
          </div>

          <div style={{ display: effectiveTab === "catalogo" ? "block" : "none" }}>
            <CatalogoPage onProductsLoaded={(cnt) => setTotalCortes(cnt)} />
          </div>

          {isManager && (
            <>
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
