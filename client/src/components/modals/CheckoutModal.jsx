// src/components/modals/CheckoutModal.jsx
import { useState } from "react";
import { X, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLocation } from "@/context/LocationContext";
import { useToast } from "@/context/ToastContext";
import { formatPrecio } from "@/utils/formatters";
import { useModalBehavior } from "@/hooks/useModalBehavior";

export const CheckoutModal = ({ isOpen, onClose, onOrderConfirmed }) => {
  const { totalEstimado, clearCart } = useCart();
  const { customerAddress } = useLocation();
  const { showToast } = useToast();
  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    onClose,
  );

  const [cliente, setCliente] = useState({
    nombre: "Juan Pérez",
    telefono: "11 3553-4033",
  });
  const [direccion, setDireccion] = useState(customerAddress);
  const [selectedSlot, setSelectedSlot] = useState("Hoy 14:00 - 15:30");
  const [medioPago, setMedioPago] = useState("efectivo");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    clearCart();
    onClose();
    onOrderConfirmed();
    showToast("Pedido confirmado con éxito! Enviado a mostrador de corte 🥩");
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white w-full sm:max-w-lg rounded-t-4xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Barra táctil y cabecera deslizable */}
        <div {...dragHandleProps} className="touch-none select-none">
          {/* Barra táctil para celulares */}
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Caja Segura Valette
              </span>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                Confirmar Pedido
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

        <form onSubmit={handleSubmit} className="space-y-10 py-4 text-xs">
          {/* Paso 1: Datos Personales */}
          <div>
            <span className="font-bold text-slate-800 uppercase text-[11px] block mb-2">
              1. Datos del Comprador
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={cliente.nombre}
                onChange={(e) =>
                  setCliente({ ...cliente, nombre: e.target.value })
                }
                placeholder="Nombre y Apellido"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#003366]/20"
              />
              <input
                type="text"
                required
                value={cliente.telefono}
                onChange={(e) =>
                  setCliente({ ...cliente, telefono: e.target.value })
                }
                placeholder="Teléfono / WhatsApp"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#003366]/20"
              />
            </div>
          </div>

          {/* Paso 2: Entrega & Franja Horaria */}
          <div>
            <span className="font-bold text-slate-800 uppercase text-[11px] block mb-2">
              2. Entrega & Franja Horaria
            </span>

            <input
              type="text"
              required
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Calle, número y localidad"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#003366]/20 mb-2"
            />

            {/* Selector de Franjas */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { dia: "Hoy", horario: "14:00 - 15:30" },
                { dia: "Hoy", horario: "16:00 - 18:00" },
                { dia: "Mañana", horario: "09:00 - 11:30" },
              ].map((slot) => {
                const slotKey = `${slot.dia} ${slot.horario}`;
                const isSelected = selectedSlot === slotKey;
                return (
                  <button
                    key={slotKey}
                    type="button"
                    onClick={() => setSelectedSlot(slotKey)}
                    className={`py-2 px-2 rounded-xl border font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#003366] bg-[#003366]/5 text-[#003366]"
                        : "border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    {slot.dia}
                    <br />
                    <span className="text-[10px] font-normal">
                      {slot.horario}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paso 3: Medio de Pago */}
          <div>
            <span className="font-bold text-slate-800 uppercase text-[11px] block mb-2">
              3. Medio de Pago
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "efectivo", label: "💵 Efectivo", sub: "Al recibir" },
                {
                  id: "transferencia",
                  label: "🏦 Transferencia",
                  sub: "Alias CBU",
                },
                {
                  id: "mercadopago",
                  label: "💳 Mercado Pago",
                  sub: "QR / Tarjeta",
                },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setMedioPago(p.id)}
                  className={`py-2.5 px-2 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    medioPago === p.id
                      ? "border-[#003366] bg-[#003366]/5 text-[#003366]"
                      : "border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {p.label}
                  <br />
                  <span className="text-[10px] font-normal text-slate-500">
                    {p.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-400 block">
                Total a Abonar
              </span>
              <span className="text-xl font-black  text-[#003366]">
                {formatPrecio(totalEstimado)}
              </span>
            </div>
            <button
              type="submit"
              className="flex-1 py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Confirmar y Enviar Pedido</span>
              <Check className="size-4 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
