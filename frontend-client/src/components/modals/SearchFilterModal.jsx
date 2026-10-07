import { X } from "lucide-react";
import { useModalBehavior } from "@/hooks/useModalBehavior";

export const SearchFilterModal = ({
  isOpen,
  onClose,
  sortBy,
  setSortBy,
  onlyStock,
  setOnlyStock,
  onApply,
}) => {
  const { handleBackdropClick } = useModalBehavior(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full sm:max-w-sm rounded-t-4xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Barra táctil para celulares */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden shrink-0" />
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-900">
            Filtros de Búsqueda
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
          >
            <X className="size-4" />
          </button>
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
          onClick={() => {
            onApply();
            onClose();
          }}
          className="mt-2 w-full py-3 rounded-2xl bg-[#003366] hover:bg-valette-dark text-white font-bold text-xs transition-colors cursor-pointer"
        >
          Aplicar Filtros
        </button>
      </div>
    </div>
  );
};
