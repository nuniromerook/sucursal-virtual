// src/components/modals/BranchSelectorModal.jsx
import { X, Check, MapPin, Clock, Store, Truck } from "lucide-react";
import { useLocation, CASA_CENTRAL_BRANCH } from "@/context/LocationContext";
import { useToast } from "@/context/ToastContext";
import { useModalBehavior } from "@/hooks/useModalBehavior";

export const BranchSelectorModal = ({ isOpen, onClose }) => {
  const { selectedBranch, selectBranch, deliveryMode, setDeliveryMode } =
    useLocation();
  const { showToast } = useToast();
  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    onClose,
  );

  if (!isOpen) return null;

  const branch = selectedBranch || CASA_CENTRAL_BRANCH;

  const handleSelectMode = (mode) => {
    selectBranch(CASA_CENTRAL_BRANCH);
    setDeliveryMode(mode);
    showToast(
      mode === "pickup"
        ? "Modalidad activa: Retiro en Sucursal"
        : "Modalidad activa: Envío a Domicilio",
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white w-full sm:max-w-md rounded-t-4xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Barra táctil y cabecera deslizable */}
        <div {...dragHandleProps} className="touch-none select-none">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Sucursal & Modalidad de Entrega
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Tarjeta informativa de la Sucursal Única */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
          <p className="font-extrabold text-slate-900 text-sm">
            {branch.nombre}
          </p>
          <p className="text-slate-600 flex items-start gap-1.5">
            <MapPin className="size-3.5 text-[#003366] shrink-0 mt-0.5" />
            <span>
              Av. Luciano Valette 1696, Luis Guillon, Provincia de Buenos Aires
            </span>
          </p>
          <p className="text-slate-600 flex items-start gap-1.5">
            <Clock className="size-3.5 text-[#003366] shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span>
                <b>Lunes a Sábados</b> de 07:00 a 15:00hs
              </span>
              <span>
                <b>Domingos</b> de 08:00 a 13:00hs
              </span>
            </div>
          </p>
        </div>

        {/* Selector de modalidad */}
        <div className="space-y-2.5 pt-4 text-xs">
          <button
            type="button"
            onClick={() => handleSelectMode("delivery")}
            className={`w-full p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between text-left ${
              deliveryMode === "delivery"
                ? "border-[#003366] bg-[#003366]/5"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-[#003366]/10 text-[#003366] flex items-center justify-center shrink-0">
                <Truck className="size-5" />
              </div>
              <div>
                <span className="block font-black text-slate-900">
                  Envío a Domicilio
                </span>
                <span className="text-slate-500 text-[11px]">
                  Salida desde sucursal Luis Guillón
                </span>
              </div>
            </div>
            {deliveryMode === "delivery" && (
              <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1 shrink-0">
                <Check className="size-3.5" /> Activo
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSelectMode("pickup")}
            className={`w-full p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between text-left ${
              deliveryMode === "pickup"
                ? "border-[#003366] bg-[#003366]/5"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-[#003366]/10 text-[#003366] flex items-center justify-center shrink-0">
                <Store className="size-5" />
              </div>
              <div>
                <span className="block font-black text-slate-900">
                  Retiro en Mostrador (Sin Cargo)
                </span>
                <span className="text-slate-500 text-[11px]">
                  Av. Luciano Valette 1696, Luis Guillón
                </span>
              </div>
            </div>
            {deliveryMode === "pickup" && (
              <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1 shrink-0">
                <Check className="size-3.5" /> Activo
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
