// src/components/modals/BranchSelectorModal.jsx
import { X, ChevronLeft, Check, MapPin, Clock, Store, Truck } from "lucide-react";
import { useLocation, CASA_CENTRAL_BRANCH } from "@/context/LocationContext";
import { useToast } from "@/context/ToastContext";
import { useModalBehavior } from "@/hooks/useModalBehavior";

export const BranchSelectorModal = ({ isOpen, onClose, onBack }) => {
  const { selectedBranch, selectBranch, deliveryMode, setDeliveryMode } =
    useLocation();
  const { showToast } = useToast();
  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    onBack || onClose,
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
    (onBack || onClose)();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white w-full sm:max-w-md rounded-t-4xl sm:rounded-3xl p-6 pt-3.5 shadow-2xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Barra táctil y cabecera deslizable */}
        <div {...dragHandleProps} className="touch-none select-none">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
            <button
              type="button"
              onClick={onBack || onClose}
              className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer shadow-2xs transition-colors"
              aria-label="Volver"
              title="Volver"
            >
              <ChevronLeft className="size-4 stroke-[2.25]" />
            </button>
            <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight">
              Sucursal y Entrega
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-500 hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer shadow-2xs transition-colors"
              aria-label="Cerrar"
              title="Cerrar"
            >
              <X className="size-4 stroke-[2.25]" />
            </button>
          </div>
        </div>

        {/* Tarjeta informativa de la Sucursal Única */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
          <p className="font-extrabold text-slate-900 text-sm">
            Sucursal {branch.nombre}
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
                <br />
                <b>Domingos</b> de 08:00 a 13:00hs
                <br />
                <b>Feriados</b> de 07:00 a 13:00hs
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
                <span className="flex text-slate-900 font-bold items-center">
                  Retiro en Mostrador{" "}
                  <span className="text-[11px] w-fit bg-green-600 text-white rounded-full px-2 py-0.5 ml-2">
                    Sin Cargo
                  </span>
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
