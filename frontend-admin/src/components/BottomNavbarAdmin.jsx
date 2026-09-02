import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Tv, Store } from "lucide-react";

export default function BottomNavbarAdmin() {
  const location = useLocation();
  const currentPath = location.pathname;

  const handleLinkClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  };

  const isDashboard = currentPath === "/";
  const isCatalog = currentPath.startsWith("/catalogo");
  const isOrders = currentPath.includes("/pedidos");
  const isBranch = currentPath.startsWith("/sucursal") && !isOrders;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-neutral-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1 transition-all">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Dashboard */}
        <Link
          to="/"
          onClick={handleLinkClick}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            isDashboard
              ? "text-main-blue font-bold"
              : "text-neutral-500 hover:text-neutral-900 font-medium"
          }`}
        >
          <LayoutDashboard className={`size-5 transition-transform ${isDashboard ? "scale-110" : ""}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">Dashboard</span>
          <span className={`w-4 h-0.5 rounded-full mt-0.5 transition-all ${isDashboard ? "bg-main-blue" : "bg-transparent"}`} />
        </Link>

        {/* 2. Catálogo */}
        <Link
          to="/catalogo"
          onClick={handleLinkClick}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            isCatalog
              ? "text-main-blue font-bold"
              : "text-neutral-500 hover:text-neutral-900 font-medium"
          }`}
        >
          <Package className={`size-5 transition-transform ${isCatalog ? "scale-110" : ""}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">Catálogo</span>
          <span className={`w-4 h-0.5 rounded-full mt-0.5 transition-all ${isCatalog ? "bg-main-blue" : "bg-transparent"}`} />
        </Link>

        {/* 3. Pedidos (Central destacado) */}
        <Link
          to="/sucursal/luis-guillon/pedidos"
          onClick={handleLinkClick}
          className="flex flex-col items-center justify-center flex-1 py-1 text-neutral-700 hover:text-main-blue transition-all relative"
        >
          <div className="relative">
            <div className={`size-10 -mt-4 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform ${
              isOrders
                ? "bg-main-blue text-white shadow-main-blue/30"
                : "bg-neutral-900 text-white shadow-neutral-900/20"
            }`}>
              <ShoppingCart className="size-5" />
            </div>
          </div>
          <span className={`text-[11px] mt-0.5 ${isOrders ? "font-bold text-main-blue" : "font-semibold text-neutral-800"}`}>
            Pedidos
          </span>
          <span className="w-4 h-0.5 bg-transparent mt-0.5" />
        </Link>

        {/* 4. Comandas KDS TV */}
        <Link
          to="/comandas/luis-guillon"
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center flex-1 py-1 text-neutral-500 hover:text-neutral-900 font-medium transition-all"
        >
          <Tv className="size-5" />
          <span className="text-[11px] mt-0.5 tracking-tight">KDS TV</span>
          <span className="w-4 h-0.5 bg-transparent mt-0.5" />
        </Link>

        {/* 5. Sucursal */}
        <Link
          to="/sucursal/luis-guillon"
          onClick={handleLinkClick}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            isBranch
              ? "text-main-blue font-bold"
              : "text-neutral-500 hover:text-neutral-900 font-medium"
          }`}
        >
          <Store className={`size-5 transition-transform ${isBranch ? "scale-110" : ""}`} />
          <span className="text-[11px] mt-0.5 tracking-tight">Sucursal</span>
          <span className={`w-4 h-0.5 rounded-full mt-0.5 transition-all ${isBranch ? "bg-main-blue" : "bg-transparent"}`} />
        </Link>
      </div>
    </div>
  );
}
