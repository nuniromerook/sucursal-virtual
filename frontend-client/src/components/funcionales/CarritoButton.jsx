import React from "react";
import { useCart } from "@/context/CartContext";
import { ShoppingCart } from "lucide-react";
import { formatPrecio } from "@/utils/formatters";

const CarritoButton = () => {
  const { totalItems, totalEstimado, setIsCartOpen } = useCart();
  return (
    <button
      type="button"
      onClick={() => setIsCartOpen(true)}
      className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#003366] text-white hover:bg-valette-dark shadow-sm transition-all active:scale-98 cursor-pointer"
    >
      <div className="relative">
        <ShoppingCart className="size-5 stroke-[2.2]" />
        {totalItems > 0 && (
          <span className="absolute -top-1.5 -right-2 size-4 rounded-full bg-[#c53030] text-white text-[9px] font-black flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </div>
      <div className="text-left text-xs">
        <span className="text-slate-300 block text-[10px] uppercase font-bold leading-none">
          Mi Pedido
        </span>
        <span className="font-extrabold text-sm  leading-tight">
          {formatPrecio(totalEstimado)}
        </span>
      </div>
    </button>
  );
};

export default CarritoButton;
