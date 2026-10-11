// admin/src/App.jsx
import React, { useState } from "react";
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
import MetricasPage from "./pages/MetricasPage";
import LoginPage from "./pages/LoginPage";

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
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

  // Si no está autenticado, mostrar pantalla de Login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-12 bg-[#F6F8FA] antialiased">
      {/* 1. Navbar Sticky con Logo Oficial y Selector */}
      <Navbar />

      {/* 2. Contenedor Principal con Layout Compartido (Sidebar Escritorio + Main Fragments) */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 pt-4 flex gap-6">
        <Sidebar totalCortes={totalCortes} />

        <main className="flex-1 min-w-0">
          <div style={{ display: activeTab === "catalogo" ? "block" : "none" }}>
            <CatalogoPage onProductsLoaded={(cnt) => setTotalCortes(cnt)} />
          </div>

          <div style={{ display: activeTab === "pedidos" ? "block" : "none" }}>
            <KdsPage />
          </div>

          <div style={{ display: activeTab === "combos" ? "block" : "none" }}>
            <CombosPage />
          </div>

          <div style={{ display: activeTab === "banners" ? "block" : "none" }}>
            <BannersPage />
          </div>

          <div style={{ display: activeTab === "metricas" ? "block" : "none" }}>
            <MetricasPage />
          </div>
        </main>
      </div>

      {/* 3. Dock Inferior Móvil Estilo App Nativa */}
      <BottomNav />

      {/* 4. Notificaciones Toast */}
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
