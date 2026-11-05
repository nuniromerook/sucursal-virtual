// src/App.jsx
import React, { useState, useMemo } from "react";
import { BrowserRouter, useSearchParams } from "react-router-dom";
import { ToastProvider } from "@/context/ToastContext";
import { LocationProvider } from "@/context/LocationContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { CartProvider, useCart } from "@/context/CartContext";
import { CatalogoProvider, useCatalogo } from "@/context/CatalogoContext";
import {
  NotificationProvider,
  useNotifications,
} from "@/context/NotificationContext";
import { TabNavigationProvider } from "@/context/TabNavigationContext";

// Componentes de Layout
import { Navbar } from "@/components/layout/Navbar";
import { MobileDock } from "@/components/layout/MobileDock";
import { SidebarDrawer } from "@/components/layout/SidebarDrawer";

// Página Principal Integral
import { Home } from "@/pages/Home";

// Modales Nativos
import { ProductDetailModal } from "@/components/modals/ProductDetailModal";
import { CartDrawer } from "@/components/modals/CartDrawer";
import { CheckoutModal } from "@/components/modals/CheckoutModal";
import { OrderTrackingModal } from "@/components/modals/OrderTrackingModal";
import { ProfileModal } from "@/components/modals/ProfileModal";
import { BranchSelectorModal } from "@/components/modals/BranchSelectorModal";
import { SearchFilterModal } from "@/components/modals/SearchFilterModal";
import { NotificationsModal } from "@/components/modals/NotificationsModal";

function AppContent() {
  const { isCartOpen, setIsCartOpen } = useCart();
  const { getProductBySlugOrId } = useCatalogo();
  const { isNotificationsOpen, setIsNotificationsOpen } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados de Búsqueda y Filtros
  const searchQuery = searchParams.get("q") || "";
  const [sortBy, setSortBy] = useState("destacados");
  const [onlyStock, setOnlyStock] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

  const handleSearchChange = (val) => {
    const newParams = new URLSearchParams(searchParams);
    if (!val.trim()) {
      newParams.delete("q");
    } else {
      newParams.set("q", val);
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleResetFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("q");
    setSearchParams(newParams);
    setSortBy("destacados");
    setOnlyStock(false);
  };

  // Sincronización de Producto con la URL (?producto= o ?corte=) usando la base de datos oficial
  const productParam =
    searchParams.get("producto") || searchParams.get("corte");
  const activeProduct = useMemo(() => {
    if (!productParam) return null;
    return getProductBySlugOrId(productParam);
  }, [productParam, getProductBySlugOrId]);

  const handleOpenProduct = (product) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("producto", product.slug || product.id);
    setSearchParams(newParams);
  };

  const handleCloseProductDetail = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("producto");
    newParams.delete("corte");
    setSearchParams(newParams);
  };

  // Estados de modales y drawers auxiliares
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileInitialView, setProfileInitialView] = useState("main");
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isNavbarFused, setIsNavbarFused] = useState(false);

  const handleOpenProfileModal = (view = "main") => {
    setProfileInitialView(typeof view === "string" ? view : "main");
    setIsProfileModalOpen(true);
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-12 bg-[#F6F8FA]">
      {/* 1. Header con Buscador Inteligente en Mobile/Desktop, Filtros, Carrito y Menú */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onOpenFiltersModal={() => setIsFiltersModalOpen(true)}
        hasActiveFilters={sortBy !== "destacados" || onlyStock}
        isNavbarFused={isNavbarFused}
        onOpenBranchModal={() => setIsBranchModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenNotificationsModal={() => setIsNotificationsOpen(true)}
      />

      {/* 2. Pantalla Principal Integral con Todas las Secciones y Combos */}
      <main className="relative w-full">
        <Home
          onOpenProduct={handleOpenProduct}
          onOpenCustomizer={handleOpenProduct}
          onOpenBranchModal={() => setIsBranchModalOpen(true)}
          searchQuery={searchQuery}
          sortBy={sortBy}
          onlyStock={onlyStock}
          onResetFilters={handleResetFilters}
          onStickyChange={setIsNavbarFused}
        />
      </main>

      {/* 3. Dock Inferior Mobile */}
      <MobileDock
        onOpenTrackingModal={() => setIsTrackingModalOpen(true)}
        onOpenProfileModal={handleOpenProfileModal}
      />

      {/* 4. Sidebar Drawer Estratégica (Menú Lateral) */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenProfileModal={handleOpenProfileModal}
        onOpenBranchModal={() => setIsBranchModalOpen(true)}
        onOpenTrackingModal={() => setIsTrackingModalOpen(true)}
        onOpenNotificationsModal={() => setIsNotificationsOpen(true)}
      />

      {/* 5. Modal / Bottom Sheet de Notificaciones */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onOpenTrackingModal={() => setIsTrackingModalOpen(true)}
        onOpenProfileModal={handleOpenProfileModal}
      />

      {/* 6. Modal / Bottom Sheet de Detalle de Producto Sincronizado con URL */}
      <ProductDetailModal
        key={activeProduct?.id || "product-detail-modal"}
        isOpen={!!activeProduct}
        product={activeProduct}
        onClose={handleCloseProductDetail}
      />

      {/* 7. Modales Globales y Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenCheckout={() => setIsCheckoutModalOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onOrderConfirmed={() => setIsTrackingModalOpen(true)}
      />

      <OrderTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
      />

      <ProfileModal
        key={`profile-modal-${isProfileModalOpen ? profileInitialView : "closed"}`}
        isOpen={isProfileModalOpen}
        initialView={profileInitialView}
        onClose={() => {
          setIsProfileModalOpen(false);
          setProfileInitialView("main");
        }}
        onOpenTrackingModal={() => setIsTrackingModalOpen(true)}
        onOpenBranchModal={() => setIsBranchModalOpen(true)}
        onOpenNotificationsModal={() => setIsNotificationsOpen(true)}
        onOpenProduct={handleOpenProduct}
      />

      <BranchSelectorModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
      />

      <SearchFilterModal
        isOpen={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onlyStock={onlyStock}
        setOnlyStock={setOnlyStock}
        onApply={() => setIsFiltersModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <LocationProvider>
        <FavoritesProvider>
          <CartProvider>
            <BrowserRouter>
              <CatalogoProvider>
                <NotificationProvider>
                  <TabNavigationProvider>
                    <AppContent />
                  </TabNavigationProvider>
                </NotificationProvider>
              </CatalogoProvider>
            </BrowserRouter>
          </CartProvider>
        </FavoritesProvider>
      </LocationProvider>
    </ToastProvider>
  );
}
