// src/App.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { BrowserRouter, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { trackPageView, trackEvent } from "@/utils/analytics";
import { ToastProvider } from "@/context/ToastContext";
import { LocationProvider } from "@/context/LocationContext";
import { AuthProvider } from "@/context/AuthContext";
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
import { CookieBanner } from "@/components/layout/CookieBanner";

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
  const location = useLocation();
  const navigate = useNavigate();

  // Detectar enlace de recuperación de contraseña (?token=... o /restablecer-password?token=...)
  const resetTokenParam = searchParams.get("token") || "";
  const isResetRoute =
    Boolean(resetTokenParam) &&
    (location.pathname.includes("restablecer") || Boolean(resetTokenParam));

  const clearResetTokenUrl = useCallback(() => {
    if (!resetTokenParam && !location.pathname.includes("restablecer")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("token");
    const qs = next.toString();
    navigate(qs ? `/?${qs}` : "/", { replace: true });
  }, [resetTokenParam, location.pathname, searchParams, navigate]);

  // Estados de Búsqueda y Filtros
  const searchQuery = searchParams.get("q") || "";
  const [sortBy, setSortBy] = useState("destacados");
  const [onlyStock, setOnlyStock] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

  // Estados de modales y drawers (se apilan en vivo sin cerrar el modal inferior)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileInitialView, setProfileInitialView] = useState("main");
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isNavbarFused, setIsNavbarFused] = useState(false);

  // Registro automático de vista de página en PostgreSQL (metricas_visitas)
  useEffect(() => {
    const rutaActual = `${location.pathname}${location.search || ""}`;
    trackPageView(rutaActual || "/");
  }, [location.pathname, location.search]);

  // Registro debounced de búsquedas en el catálogo (metricas_eventos)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) return;
    const timer = setTimeout(() => {
      trackEvent("buscar_catalogo", q, { query: q });
    }, 800);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const openProductInUrl = useCallback(
    (product) => {
      trackEvent("ver_producto", product.id, {
        nombre: product.nombre || product.nombre_producto,
        slug: product.slug,
        categoria: product.categoria || product.especie,
      });
      const newParams = new URLSearchParams(searchParams);
      newParams.set("producto", product.slug || product.id);
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const closeProductInUrl = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("producto");
    newParams.delete("corte");
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Cierra absolutamente todos los modales apilados (acción del botón X)
  const closeAllModals = useCallback(() => {
    setIsSidebarOpen(false);
    setIsNotificationsOpen(false);
    setIsCartOpen(false);
    setIsCheckoutModalOpen(false);
    setIsTrackingModalOpen(false);
    setTrackingOrderId(null);
    setIsProfileModalOpen(false);
    setProfileInitialView("main");
    setIsBranchModalOpen(false);
    setIsFiltersModalOpen(false);
    closeProductInUrl();
    clearResetTokenUrl();
  }, [setIsNotificationsOpen, setIsCartOpen, closeProductInUrl, clearResetTokenUrl]);

  const handleOpenProfile = (view = "main") => {
    const targetView = typeof view === "string" ? view : "main";
    setProfileInitialView(targetView);
    setIsProfileModalOpen(true);
  };

  const handleOpenTracking = useCallback((orderId = null) => {
    const numericId =
      typeof orderId === "number" ||
      (typeof orderId === "string" && /^\d+$/.test(orderId))
        ? Number(orderId)
        : null;
    setTrackingOrderId(numericId);
    setIsTrackingModalOpen(true);
  }, []);

  const effectiveProfileOpen = isProfileModalOpen || isResetRoute;
  const effectiveProfileView = isResetRoute
    ? "reset-password"
    : profileInitialView;

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
        onOpenProfileModal={() => handleOpenProfile("main")}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenNotificationsModal={() => setIsNotificationsOpen(true)}
      />

      {/* 2. Pantalla Principal Integral con Todas las Secciones y Combos */}
      <main className="relative w-full">
        <Home
          onOpenProduct={openProductInUrl}
          onOpenCustomizer={openProductInUrl}
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
        onOpenTrackingModal={() => handleOpenTracking(null)}
        onOpenProfileModal={handleOpenProfile}
      />

      {/* 3b. Aviso flotante no intrusivo de Cookies */}
      <CookieBanner />

      {/* 4. Sidebar Drawer Estratégica (Menú Lateral — permanece debajo si abre otro modal) */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenProfileModal={handleOpenProfile}
        onOpenBranchModal={() => setIsBranchModalOpen(true)}
        onOpenTrackingModal={() => handleOpenTracking(null)}
        onOpenNotificationsModal={() => setIsNotificationsOpen(true)}
      />

      {/* 5. Modal / Bottom Sheet de Notificaciones */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onBack={() => setIsNotificationsOpen(false)}
        onClose={closeAllModals}
        onOpenTrackingModal={() => handleOpenTracking(null)}
        onOpenProfileModal={(view = "points") => {
          handleOpenProfile(view);
          if (isProfileModalOpen) {
            setIsNotificationsOpen(false);
          }
        }}
      />

      {/* 6. Modal / Bottom Sheet de Detalle de Producto Sincronizado con URL */}
      <ProductDetailModal
        key={activeProduct?.id || "product-detail-modal"}
        isOpen={!!activeProduct}
        product={activeProduct}
        onBack={closeProductInUrl}
        onClose={closeAllModals}
      />

      {/* 7. Modales Globales y Drawers Apilables */}
      <CartDrawer
        isOpen={isCartOpen}
        onBack={() => setIsCartOpen(false)}
        onClose={closeAllModals}
        onOpenCheckout={() => setIsCheckoutModalOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onBack={() => setIsCheckoutModalOpen(false)}
        onClose={closeAllModals}
        onOrderConfirmed={() => {
          setIsCartOpen(false);
          setIsCheckoutModalOpen(false);
          handleOpenTracking(null);
        }}
      />

      <OrderTrackingModal
        key={isTrackingModalOpen ? `track-${trackingOrderId || "live"}` : "track-closed"}
        isOpen={isTrackingModalOpen}
        orderId={trackingOrderId}
        onBack={() => {
          setIsTrackingModalOpen(false);
          setTrackingOrderId(null);
        }}
        onClose={closeAllModals}
      />

      <ProfileModal
        key={`profile-modal-${effectiveProfileOpen ? effectiveProfileView : "closed"}`}
        isOpen={effectiveProfileOpen}
        initialView={effectiveProfileView}
        originView={effectiveProfileView}
        resetToken={resetTokenParam}
        onClearResetToken={clearResetTokenUrl}
        onBack={() => {
          setIsProfileModalOpen(false);
          setProfileInitialView("main");
          clearResetTokenUrl();
        }}
        onClose={closeAllModals}
        onOpenTrackingModal={handleOpenTracking}
        onOpenBranchModal={() => setIsBranchModalOpen(true)}
        onOpenNotificationsModal={() => {
          if (isNotificationsOpen) {
            setIsProfileModalOpen(false);
          } else {
            setIsNotificationsOpen(true);
          }
        }}
        onOpenProduct={openProductInUrl}
      />

      <BranchSelectorModal
        isOpen={isBranchModalOpen}
        onBack={() => setIsBranchModalOpen(false)}
        onClose={closeAllModals}
      />

      <SearchFilterModal
        isOpen={isFiltersModalOpen}
        onBack={() => setIsFiltersModalOpen(false)}
        onClose={closeAllModals}
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
        <AuthProvider>
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
        </AuthProvider>
      </LocationProvider>
    </ToastProvider>
  );
}
