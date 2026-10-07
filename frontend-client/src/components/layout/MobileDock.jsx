// src/components/layout/MobileDock.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, ClipboardList, User, ShoppingCart, Beef } from "lucide-react";
import { useCart } from "@/context/CartContext";

export const MobileDock = ({ onOpenTrackingModal, onOpenProfileModal }) => {
  const { totalItems, setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";
  const isCatalogo = location.pathname.startsWith("/productos");

  const handleHomeClick = () => {
    if (isHome) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  const handleCatalogoClick = () => {
    if (isCatalogo) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/productos");
    }
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 px-6 py-2.5 flex items-center justify-between z-40 shadow-lg text-[10px] text-slate-400">
      <button
        type="button"
        onClick={handleHomeClick}
        className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
          isHome ? "text-[#003366] font-bold" : "hover:text-[#003366]"
        }`}
      >
        <Home className="size-5 stroke-[2.2]" />
        <span>Inicio</span>
      </button>

      <button
        type="button"
        onClick={handleCatalogoClick}
        className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
          isCatalogo ? "text-[#003366] font-bold" : "hover:text-[#003366]"
        }`}
      >
        <Beef className="size-5 stroke-[2]" />
        <span>Catálogo</span>
      </button>

      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className="flex flex-col items-center gap-1 relative hover:text-[#003366] transition-colors cursor-pointer"
      >
        <ShoppingCart className="size-5 stroke-[2]" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-[#c53030] text-white text-[8px] font-black flex items-center justify-center">
            {totalItems}
          </span>
        )}
        <span>Carrito</span>
      </button>

      <button
        type="button"
        onClick={onOpenTrackingModal}
        className="flex flex-col items-center gap-1 hover:text-[#003366] transition-colors cursor-pointer"
      >
        <ClipboardList className="size-5 stroke-[2]" />
        <span>Mis Compras</span>
      </button>

      <button
        type="button"
        onClick={onOpenProfileModal}
        className="flex flex-col items-center gap-1 hover:text-[#003366] transition-colors cursor-pointer"
      >
        <User className="size-5 stroke-[2]" />
        <span>Perfil</span>
      </button>
    </nav>
  );
};

export default MobileDock;
