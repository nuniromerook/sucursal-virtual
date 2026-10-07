// src/components/home/CombosSection.jsx
import React from "react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { formatPrecio } from "@/utils/formatters";

const COMBOS = [
  {
    id: 101,
    nombre: "Combo Asado Familiar (5 kg)",
    slug: "combo-asado-familiar",
    ahorro: 5200,
    puntos: 45,
    descripcion:
      "Incluye: 2kg Asado Centro + 2kg Vacío + 1kg Chorizo puro cerdo.",
    precio: 38900,
    precioAnterior: 44100,
    kilos: 5,
    imagenUrl:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400",
  },
  {
    id: 102,
    nombre: "Combo Cocina Diaria (4 kg)",
    slug: "combo-cocina-diaria",
    ahorro: 3800,
    puntos: 35,
    descripcion:
      "Incluye: 2kg Milanesas Nalga + 1kg Carne Picada Especial + 1kg Pechuga.",
    precio: 29500,
    precioAnterior: 33300,
    kilos: 4,
    imagenUrl:
      "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?q=80&w=400",
  },
];

export const CombosSection = ({ onSelectCategory }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleAddCombo = (combo) => {
    addToCart(combo, combo.kilos, {
      corte: "Cortes armados del combo",
      envasado: "Envasado tradicional",
    });
    showToast(`Sumaste ${combo.nombre} al pedido`);
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col w-full">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Combos destacados
          </h2>
          <p className="text-xs text-slate-500">
            Paquetes pensados para cada gusto y necesidad.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COMBOS.map((combo) => (
          <div
            key={combo.id}
            className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-native flex flex-col gap-4 items-center hover:border-slate-300 transition-all"
          >
            <div className="grid grid-cols-3 w-full items-center rounded-xl overflow-hidden divide-x divide-slate-300 border border-slate-300">
              <img
                src={combo.imagenUrl}
                alt={combo.nombre}
                className="size-full object-cover aspect-square"
              />
              <img
                src={combo.imagenUrl}
                alt={combo.nombre}
                className="size-full object-cover aspect-square"
              />
              <div className="flex relative w-full">
                <img
                  src={combo.imagenUrl}
                  alt={combo.nombre}
                  className="object-cover aspect-square"
                />
                <div className="absolute inset-0 bg-black/50 text-center flex items-center justify-center text-2xl text-white">
                  + 5
                </div>
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-red-100 text-[#c53030] text-[10px] font-black uppercase">
                  Ahorrá {formatPrecio(combo.ahorro)}
                </span>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
                  +{combo.puntos} pts Club Valette
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-1">
                {combo.nombre}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {combo.descripcion}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  <span className="text-xl font-black  text-slate-900">
                    {formatPrecio(combo.precio)}
                  </span>
                  <span className="text-xs text-slate-400 line-through block">
                    {formatPrecio(combo.precioAnterior)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddCombo(combo)}
                  className="px-4 py-2 rounded-xl bg-[#003366] hover:bg-valette-dark text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer active:scale-95"
                >
                  <span>Agregar al carrito</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
