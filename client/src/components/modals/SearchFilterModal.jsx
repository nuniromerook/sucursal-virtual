import { X, ChevronLeft } from "lucide-react";
import { useModalBehavior } from "@/hooks/useModalBehavior";

export const SearchFilterModal = ({
  isOpen,
  onClose,
  onBack,
  sortBy,
  setSortBy,
  onlyStock,
  setOnlyStock,
  onApply,
}) => {
  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    onBack || onClose,
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white w-full sm:max-w-sm rounded-t-4xl sm:rounded-3xl p-6 pt-3.5 shadow-2xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Barra táctil y cabecera deslizable */}
        <div {...dragHandleProps} className="touch-none select-none">
          {/* Barra táctil para celulares */}
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
            <button
              type="button"
              onClick={onBack || onClose}
              aria-label="Volver"
              title="Volver"
              className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer shadow-2xs transition-colors"
            >
              <ChevronLeft className="size-4 stroke-[2.25]" />
            </button>
            <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight">
              Filtros de Búsqueda
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              title="Cerrar"
              className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-500 hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer shadow-2xs transition-colors"
            >
              <X className="size-4 stroke-[2.25]" />
            </button>
          </div>
        </div>

        <div className="space-y-4 py-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-2">
              Ordenar por:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "destacados", label: "Destacados" },
                { id: "precio-menor", label: "Menor Precio" },
                { id: "precio-mayor", label: "Mayor Precio" },
                { id: "alfabetico", label: "A - Z" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSortBy(opt.id)}
                  className={`py-2 px-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    sortBy === opt.id
                      ? "border-[#003366] bg-[#003366]/5 text-[#003366]"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-bold text-slate-800">
                Solo cortes con stock disponible
              </span>
              <input
                type="checkbox"
                checked={onlyStock}
                onChange={(e) => setOnlyStock(e.target.checked)}
                className="accent-[#003366] size-4 cursor-pointer"
              />
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={onApply}
          className="mt-2 w-full py-3.5 rounded-2xl bg-[#003366] hover:bg-valette-dark text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
        >
          Aplicar Filtros
        </button>
      </div>
    </div>
  );
};
