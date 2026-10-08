// src/components/modals/OrderTrackingModal.jsx
import React from "react";
import { RotateCw, Check, ChevronLeft, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useModalBehavior } from "@/hooks/useModalBehavior";

export const OrderTrackingModal = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    onClose,
  );

  if (!isOpen) return null;

  const handleRefresh = () => {
    showToast("Comanda actualizada en tiempo real", "info");
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white w-full sm:max-w-md rounded-t-4xl sm:rounded-3xl pb-6 shadow-2xl h-[80vh] sm:max-h-[88vh] overflow-y-auto scrollbar-none animate-in fade-in slide-in-from-bottom-4 duration-200 flex flex-col"
      >
        {/* Header con soporte de arrastre */}
        <div
          {...dragHandleProps}
          className="flex flex-col w-full bg-white sticky top-0 z-10 touch-none select-none shrink-0"
        >
          {/* Barra táctil para celulares */}
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-4 mb-0 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />

          {/* Titular */}
          <div className="flex items-center justify-between pb-3 pt-6 border-b border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="size-8 ml-6 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
              title="Volver"
            >
              <ChevronLeft className="size-4 stroke-[2.5]" />
            </button>
            <span className="font-extrabold text-sm text-slate-800 pl-8">
              Seguimiento #0259
            </span>
            <div className="flex items-center gap-1 mr-6">
              <button
                type="button"
                onClick={handleRefresh}
                className="size-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
                title="Actualizar estado"
              >
                <RotateCw className="size-3.5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="size-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
                title="Cerrar"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tarjeta 3D de Estado */}
        <div className="flex items-center gap-4 p-6 border-b border-slate-100">
          <div className="size-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-3xl shrink-0 shadow-2xs">
            📦
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              ¡Tu pedido está en camino!
            </h3>
            <p className="flex flex-col text-xs text-slate-500">
              <span>
                <b>Dirección:</b> J. Tarulli 1474, Luis Guillón
              </span>
              <span>
                <b>Nota:</b> Toldo rojo de porch con lamparitas
              </span>
            </p>
          </div>
        </div>

        {/* Stepper en Tiempo Real con Checks Verdes */}
        <div className="py-4 space-y-4 px-6 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Estado de preparación y despacho
          </span>

          <div className="flex items-center gap-3">
            <div className="size-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check className="size-3.5 stroke-[3]" />
            </div>
            <div className="flex-1 flex justify-between">
              <span className="font-bold text-slate-800">
                1. Solicitud de pedido aceptada
              </span>
              <span className="text-slate-400 text-[11px]">11:20 hs</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="size-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check className="size-3.5 stroke-[3]" />
            </div>
            <div className="flex-1 flex justify-between">
              <span className="font-bold text-slate-800">
                2. En preparación en balanza
              </span>
              <span className="text-slate-400 text-[11px]">12:45 hs</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="size-6 relative rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <div className="size-5 aspect-square bg-emerald-400/40 rounded-full animate-ping" />
              <Check className="absolute inset-0 justify-self-center self-center size-3.5 stroke-[3]" />
            </div>
            <div className="flex-1 flex justify-between">
              <span className="font-bold text-emerald-600">
                3. En camino hacia tu domicilio
              </span>
              <span className="text-emerald-700 text-[11px] font-bold">
                Ahora
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 opacity-40">
            <div className="size-6 rounded-full border-2 border-slate-300 shrink-0" />
            <div className="flex-1 flex justify-between">
              <span className="text-slate-500">4. Entregado</span>
              <span className="text-slate-400 text-[11px]">Pendiente</span>
            </div>
          </div>
        </div>

        {/* Resumen de Pesaje Real en Balanza */}
        <div className="p-6 text-xs space-y-2">
          <span className="font-extrabold text-[11px] text-slate-800 block">
            Ticket de Pesaje en Balanza:
          </span>
          <div className="space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <p className="flex items-center gap-2">
                <span className="font-bold px-1.5 py-0.5 border border-slate-300 bg-white rounded text-[11px]">
                  1 kg
                </span>{" "}
                Vacío Novillito
              </p>
              <span className="font-bold text-[13px] text-slate-900">
                $17.200
              </span>
            </div>
            <div className="flex justify-between">
              <p className="flex items-center gap-2">
                <span className="font-bold px-1.5 py-0.5 border border-slate-300 bg-white rounded text-[11px]">
                  1 kg
                </span>{" "}
                Asado Criollo
              </p>
              <span className="font-bold text-[13px] text-slate-900">
                $13.900
              </span>
            </div>
            <div className="flex justify-between">
              <p className="flex items-center gap-2">
                <span className="font-bold px-1.5 py-0.5 border border-slate-300 bg-white rounded text-[11px]">
                  1 kg
                </span>{" "}
                Asado Criollo
              </p>
              <span className="font-bold text-[13px] text-slate-900">
                $13.900
              </span>
            </div>
            <div className="flex justify-between">
              <p className="flex items-center gap-2">
                <span className="font-bold px-1.5 py-0.5 border border-slate-300 bg-white rounded text-[11px]">
                  1 kg
                </span>{" "}
                Asado Criollo
              </p>
              <span className="font-bold text-[13px] text-slate-900">
                $13.900
              </span>
            </div>
            <div className="flex justify-between">
              <p className="flex items-center gap-2">
                <span className="font-bold px-1.5 py-0.5 border border-slate-300 bg-white rounded text-[11px]">
                  1 kg
                </span>{" "}
                Asado Criollo
              </p>
              <span className="font-bold text-[13px] text-slate-900">
                $13.900
              </span>
            </div>
            <div className="flex justify-between">
              <p className="flex items-center gap-2">
                <span className="font-bold px-1.5 py-0.5 border border-slate-300 bg-white rounded text-[11px]">
                  1 kg
                </span>{" "}
                Asado Criollo
              </p>
              <span className="font-bold text-[13px] text-slate-900">
                $13.900
              </span>
            </div>
            <div className="flex justify-between">
              <p className="flex items-center gap-2">
                <span className="font-bold px-1.5 py-0.5 border border-slate-300 bg-white rounded text-[11px]">
                  1 kg
                </span>{" "}
                Asado Criollo
              </p>
              <span className="font-bold text-[13px] text-slate-900">
                $13.900
              </span>
            </div>
            <div className="flex justify-between">
              <p className="flex items-center gap-2">
                <span className="font-bold px-1.5 py-0.5 border border-slate-300 bg-white rounded text-[11px]">
                  1 kg
                </span>{" "}
                Asado Criollo
              </p>
              <span className="font-bold text-[13px] text-slate-900">
                $13.900
              </span>
            </div>
            <div className="flex justify-between">
              <p className="flex items-center gap-2">
                <span className="font-bold px-1.5 py-0.5 border border-slate-300 bg-white rounded text-[11px]">
                  1 kg
                </span>{" "}
                Asado Criollo
              </p>
              <span className="font-bold text-[13px] text-slate-900">
                $13.900
              </span>
            </div>
            <div className="flex justify-between">
              <p className="flex items-center gap-2">
                <span className="font-bold px-1.5 py-0.5 border border-slate-300 bg-white rounded text-[11px]">
                  1 kg
                </span>{" "}
                Asado Criollo
              </p>
              <span className="font-bold text-[13px] text-slate-900">
                $13.900
              </span>
            </div>
            <div className="flex justify-between font-extrabold text-sm text-[#003366] pt-2 border-t border-slate-200">
              <span>Total Final Cobrado:</span>
              <span>$31.100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingModal;
