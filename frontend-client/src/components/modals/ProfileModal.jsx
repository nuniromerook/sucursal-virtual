// src/components/modals/ProfileModal.jsx
import { useState } from "react";
import {
  X,
  ChevronRight,
  Package,
  Star,
  Gift,
  LogOut,
  Check,
  BadgeCheck,
  Camera,
  ChevronLeft,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useModalBehavior } from "@/hooks/useModalBehavior";

export const ProfileModal = ({ isOpen, onClose, onOpenTrackingModal }) => {
  const { showToast } = useToast();
  const { handleBackdropClick } = useModalBehavior(isOpen, onClose);
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);

  if (!isOpen) return null;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText("VALETTE-JUAN42").then(() => {
      showToast("¡Código VALETTE-JUAN42 copiado al portapapeles! 🎁");
    });
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-4xl sm:rounded-3xl shadow-2xl h-[80vh] sm:max-h-[88vh] overflow-hidden flex flex-col p-0 transition-all animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Barra táctil para celulares */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-4 mb-0 sm:hidden shrink-0" />
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 p-6 sticky top-0 bg-white z-10">
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
          <h3 className="text-base font-extrabold text-slate-900">Mi Cuenta</h3>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col px-6 w-full h-full overflow-y-auto scrollbar-none">
          {/* Avatar Card */}
          <div className="flex items-center py-4 mb-4">
            <div className="relative aspect-square size-20 rounded-full bg-[#003366] text-white flex items-center justify-center font-black text-xl shadow-xs">
              <img src="/favicon.svg" alt="" className="rounded-full" />
              <div className="absolute bottom-0 right-0 size-7 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                <Camera className="size-4 text-emerald-700" />
              </div>
            </div>
            <div className="flex flex-col h-full py-1 pl-4">
              <h4 className="flex flex-col font-black text-slate-900 leading-5">
                Juan Pérez del carmen
                <p className="font-normal text-xs text-slate-500">
                  @nuniromerook
                </p>
              </h4>
            </div>
          </div>

          {/* Secciones Agrupadas estilo iOS Settings */}
          <div className="space-y-4 text-xs font-semibold text-slate-800">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 pl-1">
                Pendiente
              </span>
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden">
                <div
                  onClick={() => {
                    onClose();
                    onOpenTrackingModal();
                  }}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="size-6 rounded-lg bg-blue-100 text-[#003366] flex items-center justify-center font-bold">
                      <Package className="size-3.5" />
                    </span>
                    <span>Pedido Activo (#VAL-422314)</span>
                  </span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    En camino <ChevronRight className="size-3" />
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 pl-1">
                Beneficios exclusivos
              </span>
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-200/60">
                <div
                  onClick={() =>
                    showToast(
                      "Tus 140 pts equivalen a $2.800 de descuento.",
                      "info",
                    )
                  }
                  className="p-3.5 flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="size-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <Star className="size-3.5" />
                    </span>
                    <span>Puntos Club Valette (14.120 pts)</span>
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    Ver canjes <ChevronRight className="size-3" />
                  </span>
                </div>

                <div
                  onClick={handleCopyReferral}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="size-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Gift className="size-3.5" />
                    </span>
                    <span>Invitar amigos (+500 pts)</span>
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    Compartir <ChevronRight className="size-3" />
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 pl-1">
                Preferencias
              </span>
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-200/60">
                <label className="p-3.5 flex items-center justify-between cursor-pointer">
                  <span>Avisos por WhatsApp de comandas</span>
                  <input
                    type="checkbox"
                    checked={whatsappNotifications}
                    onChange={(e) => setWhatsappNotifications(e.target.checked)}
                    className="accent-[#003366] size-4 cursor-pointer"
                  />
                </label>
                <div
                  onClick={() =>
                    showToast(
                      "Podés modificar tu dirección en el checkout",
                      "info",
                    )
                  }
                  className="p-3.5 flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span>Dirección habitual: J. Tarulli 1474</span>
                  <span className="text-slate-400 flex items-center gap-1">
                    Editar <ChevronRight className="size-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              showToast("Sesión cerrada correctamente", "info");
            }}
            className="flex items-center justify-center gap-2 mt-6 mb-20 w-full py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Cerrar Sesión <LogOut className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
