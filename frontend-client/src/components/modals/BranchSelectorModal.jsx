// src/components/modals/BranchSelectorModal.jsx
import { X, Check } from "lucide-react";
import { useLocation } from "@/context/LocationContext";
import { useToast } from "@/context/ToastContext";
import { useModalBehavior } from "@/hooks/useModalBehavior";

export const BranchSelectorModal = ({ isOpen, onClose }) => {
  const { sucursales, selectedBranch, selectBranch, setDeliveryMode } =
    useLocation();
  const { showToast } = useToast();
  const { handleBackdropClick } = useModalBehavior(isOpen, onClose);

  if (!isOpen) return null;

  const handleSelect = (branch) => {
    selectBranch(branch);
    setDeliveryMode("pickup");
    showToast(`Sucursal activa: ${branch.nombre}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-4xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Barra táctil para celulares */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden shrink-0" />
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-900">
            Elegir Sucursal para tu Pedido
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 py-4 text-xs">
          {sucursales.map((branch) => {
            const isSelected = selectedBranch?.id === branch.id;
            return (
              <div
                key={branch.id}
                onClick={() => handleSelect(branch)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "border-[#003366] bg-[#003366]/5"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <span
                    className={`block font-black ${
                      isSelected ? "text-[#003366]" : "text-slate-900"
                    }`}
                  >
                    Sucursal {branch.nombre}{" "}
                    {branch.id === 1 ? "(Predeterminada)" : ""}
                  </span>
                  <span className="text-slate-600">
                    {branch.direccion} • {branch.horario}
                  </span>
                </div>
                {isSelected ? (
                  <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                    <Check className="size-3.5" /> Activa
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">
                    Seleccionar
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
