// src/components/modals/CutCustomizerModal.jsx
import { useState } from "react";
import { X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { formatPrecio } from "@/utils/formatters";
import { useModalBehavior } from "@/hooks/useModalBehavior";

export const CutCustomizerModal = ({
  isOpen,
  onClose,
  product,
  initialPrice,
}) => {
  const [espesor, setEspesor] = useState("Medio (2 cm)");
  const [notas, setNotas] = useState("");

  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { handleBackdropClick } = useModalBehavior(isOpen, onClose);

  if (!isOpen || !product) return null;

  const handleSave = () => {
    addToCart(product, 1, {
      corte: espesor,
      notas,
    });
    showToast("Corte personalizado guardado en tu carrito");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-4xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Manija táctil mobile */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-4">
          <h3 className="text-lg font-black text-slate-900 leading-tight">
            Personalizar: <span className="font-normal">{product.nombre}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5 py-4 text-xs">
          {/* Espesor de corte */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">
              Espesor del corte en tabla:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Milanesa", sub: "Cortes finos" },
                { label: "Churrasco", sub: "Cortes medios" },
                { label: "Marcado", sub: "Cortes superf." },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setEspesor(opt.label)}
                  className={`py-2.5 px-2 rounded-xl border font-bold text-center transition-all cursor-pointer text-[14px] leading-3.5 ${
                    espesor === opt.label
                      ? "border-[#003366] bg-[#003366]/5 text-[#003366]"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  {opt.label}
                  <br />
                  <span className="text-[10px] font-normal text-slate-500">
                    {opt.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Indicaciones especiales */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Notas especiales para el cortador:
            </label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: cortar en 4 tiras parejos, separar en dos bolsitas..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:ring-2 focus:ring-[#003366]/20 outline-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-10">
          <div>
            <span className="text-xs text-slate-400 block">Total Estimado</span>
            <span className="text-xl font-black  text-slate-900">
              {formatPrecio(initialPrice || product.precio)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 px-5 rounded-2xl bg-[#003366] text-white font-bold text-xs hover:bg-valette-dark shadow-sm active:scale-98 transition-all cursor-pointer"
          >
            Guardar y Sumar al Carrito
          </button>
        </div>
      </div>
    </div>
  );
};
