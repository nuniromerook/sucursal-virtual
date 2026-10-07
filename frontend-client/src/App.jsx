// src/App.jsx
import React, { useState, useMemo } from "react";
import { BrowserRouter, Routes, Route, useSearchParams } from "react-router-dom";
import { ToastProvider } from "@/context/ToastContext";
import { LocationProvider } from "@/context/LocationContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { CartProvider, useCart } from "@/context/CartContext";

// Componentes de Layout
import { Navbar } from "@/components/layout/Navbar";
import { MobileDock } from "@/components/layout/MobileDock";

// Páginas
import { Home } from "@/pages/Home";
import { Catalogo } from "@/pages/Catalogo";

// Modales Nativos
import { ProductDetailModal } from "@/components/modals/ProductDetailModal";
import { CartDrawer } from "@/components/modals/CartDrawer";
import { CheckoutModal } from "@/components/modals/CheckoutModal";
import { OrderTrackingModal } from "@/components/modals/OrderTrackingModal";
import { ProfileModal } from "@/components/modals/ProfileModal";
import { BranchSelectorModal } from "@/components/modals/BranchSelectorModal";
import { SearchFilterModal } from "@/components/modals/SearchFilterModal";

// Datos para sincronización de URL
import { CORTES_MOCK } from "@/services/catalogo.service";

function AppContent() {
  const { isCartOpen, setIsCartOpen } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sincronización de Producto con la URL (?producto= o ?corte=)
  const productParam = searchParams.get("producto") || searchParams.get("corte");
  const activeProduct = useMemo(() => {
    if (!productParam) return null;
    return (
      CORTES_MOCK.find(
        (p) => p.slug === productParam || String(p.id) === String(productParam)
      ) || null
    );
  }, [productParam]);

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

  // Estados de modales auxiliares
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState("destacados");
  const [onlyStock, setOnlyStock] = useState(false);

  return (
    <div className="min-h-screen pb-24 lg:pb-12 bg-[#F6F8FA]">
      {/* 1. Header con Buscador Inteligente, Carrito, Sucursal y Categorías */}
      <Navbar
        onOpenBranchModal={() => setIsBranchModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* 2. Rutas Principales */}
      <Routes>
        <Route
          path="/"
          element={
            <Home
              onOpenProduct={handleOpenProduct}
              onOpenCustomizer={handleOpenProduct}
            />
          }
        />
        <Route
          path="/productos"
          element={
            <Catalogo
              onOpenProduct={handleOpenProduct}
              onOpenCustomizer={handleOpenProduct}
            />
          }
        />
      </Routes>

      {/* 3. Dock Inferior Mobile */}
      <MobileDock
        onOpenTrackingModal={() => setIsTrackingModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* 4. Modal / Bottom Sheet de Detalle de Producto Sincronizado con URL */}
      <ProductDetailModal
        key={activeProduct?.id || "product-detail-modal"}
        isOpen={!!activeProduct}
        product={activeProduct}
        onClose={handleCloseProductDetail}
      />

      {/* 5. Modales Globales y Drawers */}
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
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenTrackingModal={() => setIsTrackingModalOpen(true)}
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
              <AppContent />
            </BrowserRouter>
          </CartProvider>
        </FavoritesProvider>
      </LocationProvider>
    </ToastProvider>
  );
}
