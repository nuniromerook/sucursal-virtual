// src/components/modals/CheckoutModal.jsx
import { useState } from "react";
import { X, Check, Loader2, AlertCircle, Store, Truck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLocation, CASA_CENTRAL_BRANCH } from "@/context/LocationContext";
import { useToast } from "@/context/ToastContext";
import { formatPrecio } from "@/utils/formatters";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import { API_URL } from "@/config/api";

function getInitialCustomer() {
  try {
    const savedUser = localStorage.getItem("valette_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed?.nombre || parsed?.telefono) {
        return {
          nombre: parsed.nombre || "",
          telefono: parsed.telefono || "",
          email: parsed.email || "",
        };
      }
    }
    const savedCheckout = localStorage.getItem("valette_checkout_customer");
    if (savedCheckout) {
      const parsed = JSON.parse(savedCheckout);
      return {
        nombre: parsed.nombre || "",
        telefono: parsed.telefono || "",
        email: parsed.email || "",
      };
    }
  } catch {}
  return {
    nombre: "",
    telefono: "",
    email: "",
  };
}

export const CheckoutModal = ({ isOpen, onClose, onOrderConfirmed }) => {
  const {
    cartItems,
    totalEstimado,
    clearCart,
    sesionId,
    setActiveOrderId,
    registerFunnelStep,
  } = useCart();
  const {
    customerAddress,
    updateCustomerAddress,
    deliveryMode,
    setDeliveryMode,
  } = useLocation();
  const { showToast } = useToast();

  const [cliente, setCliente] = useState(getInitialCustomer);
  const [direccion, setDireccion] = useState(
    customerAddress || "Av. Luciano Valette 1696, Luis Guillon",
  );
  const [notas, setNotas] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("Hoy 12:00 - 14:30");
  const [medioPago, setMedioPago] = useState("efectivo");
  const [currentStep, setCurrentStep] = useState("checkout_datos");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleCloseModal = () => {
    if (isSubmitting) return;
    if (registerFunnelStep) {
      registerFunnelStep(currentStep, `cierre_${currentStep}`);
    }
    onClose();
  };

  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    handleCloseModal,
  );

  if (!isOpen) return null;

  const markStep = (step) => {
    if (step !== currentStep) {
      setCurrentStep(step);
      if (registerFunnelStep) {
        registerFunnelStep(step, null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!cliente.nombre.trim() || !cliente.telefono.trim()) {
      setSubmitError(
        "Completá tu nombre y teléfono / WhatsApp para continuar.",
      );
      return;
    }

    if (deliveryMode !== "pickup" && !direccion.trim()) {
      setSubmitError("Ingresá la dirección de entrega para el envío.");
      return;
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      setSubmitError("Tu carrito está vacío.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const token = localStorage.getItem("valette_token");
      const direccionFinal =
        deliveryMode === "pickup"
          ? `Retiro en ${CASA_CENTRAL_BRANCH.direccion}`
          : direccion.trim();

      const notasFinal = [
        `Franja: ${selectedSlot}`,
        notas.trim() ? notas.trim() : null,
      ]
        .filter(Boolean)
        .join(" | ");

      const res = await fetch(`${API_URL}/pedidos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          cliente: {
            nombre: cliente.nombre.trim(),
            telefono: cliente.telefono.trim(),
            email: cliente.email || undefined,
          },
          sucursal_id: 1,
          tipo_entrega:
            deliveryMode === "pickup" ? "retiro_sucursal" : "envio_domicilio",
          medio_pago: medioPago,
          direccion_entrega: direccionFinal,
          notas: notasFinal,
          monto_total_estimado: totalEstimado,
          sesion_id: sesionId,
          items: cartItems.map((it) => ({
            id: it.id,
            catalogo_id: it.catalogo_id || it.id,
            es_combo: Boolean(it.es_combo),
            combo_id: it.combo_id || null,
            nombre: it.nombre || it.nombre_producto,
            precio: Number(it.precio) || 0,
            cantidad_kg: Number(it.cantidad_kg || it.cantidad || 1),
            corte: it.corte || "Corte tradicional",
            items_combo: it.items_combo || undefined,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error || data.detalles || "No se pudo registrar el pedido.",
        );
      }

      // Guardar datos del cliente para próximas compras
      try {
        localStorage.setItem(
          "valette_checkout_customer",
          JSON.stringify({
            nombre: cliente.nombre.trim(),
            telefono: cliente.telefono.trim(),
            email: cliente.email || "",
          }),
        );
      } catch {}

      if (deliveryMode !== "pickup" && direccion.trim()) {
        updateCustomerAddress(direccion.trim());
      }

      if (data.pedido?.id) {
        setActiveOrderId(data.pedido.id);
      }

      clearCart();
      onClose();
      onOrderConfirmed(data.pedido);
      showToast(
        `¡Pedido #${data.pedido?.id || ""} confirmado! Enviado al mostrador de corte 🥩`,
      );
    } catch (err) {
      console.error("Error al confirmar pedido:", err);
      setSubmitError(
        err.message ||
          "Error de conexión al enviar el pedido. Intentá de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pago seguro - Abastecedora Valette
              </span>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                Confirmá tu Pedido
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="size-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7 py-4 text-xs">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2 font-semibold">
              <AlertCircle className="size-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Paso 1: Datos Personales */}
          <div onFocus={() => markStep("checkout_datos")}>
            <span className="font-bold text-slate-800 uppercase text-[11px] block mb-2">
              1. Datos de cliente
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={cliente.nombre}
                onChange={(e) =>
                  setCliente({ ...cliente, nombre: e.target.value })
                }
                placeholder="Nombre y Apellido *"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#003366]/20"
              />
              <input
                type="tel"
                required
                value={cliente.telefono}
                onChange={(e) =>
                  setCliente({ ...cliente, telefono: e.target.value })
                }
                placeholder="Teléfono / WhatsApp *"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#003366]/20"
              />
            </div>
          </div>

          {/* Paso 2: Entrega & Franja Horaria */}
          <div onFocus={() => markStep("checkout_entrega")}>
            <span className="font-bold text-slate-800 uppercase text-[11px] block mb-2">
              2. Modalidad de Entrega & Franja Horaria
            </span>

            {/* Selector Envío a Domicilio vs Retiro en Casa Central */}
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              <button
                type="button"
                onClick={() => {
                  setDeliveryMode("delivery");
                  markStep("checkout_entrega");
                }}
                className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  deliveryMode !== "pickup"
                    ? "border-[#003366] bg-[#003366]/5 text-[#003366]"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <Truck className="size-3.5" />
                <span>Envío a Domicilio</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeliveryMode("pickup");
                  markStep("checkout_entrega");
                }}
                className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  deliveryMode === "pickup"
                    ? "border-[#003366] bg-[#003366]/5 text-[#003366]"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <Store className="size-3.5" />
                <span>Retiro en Sucursal</span>
              </button>
            </div>

            {deliveryMode === "pickup" ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 mb-2">
                <span className="font-extrabold text-slate-900 block">
                  📍 {CASA_CENTRAL_BRANCH.nombre}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {CASA_CENTRAL_BRANCH.direccion} ({CASA_CENTRAL_BRANCH.horario}
                  )
                </span>
              </div>
            ) : (
              <input
                type="text"
                required
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle, número y localidad (ej: Luis Guillón)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#003366]/20 mb-2"
              />
            )}

            {/* Selector de Franjas (coherente con horario Lun-Sáb 07 a 15hs / Dom 08 a 13hs) */}
            <div className="grid grid-cols-3 gap-2 text-center mb-2">
              {[
                { dia: "Hoy", horario: "10:00 - 12:30" },
                { dia: "Hoy", horario: "12:00 - 14:30" },
                { dia: "Mañana", horario: "08:30 - 12:00" },
              ].map((slot) => {
                const slotKey = `${slot.dia} ${slot.horario}`;
                const isSelected = selectedSlot === slotKey;
                return (
                  <button
                    key={slotKey}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(slotKey);
                      markStep("checkout_entrega");
                    }}
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

            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Nota opcional (timbre, entrecalles o indicación para el carnicero)"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#003366]/20"
            />
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
                  onClick={() => {
                    setMedioPago(p.id);
                    markStep("checkout_pago");
                  }}
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
                Total Estimado
              </span>
              <span className="text-xl font-black text-[#003366] font-num">
                {formatPrecio(totalEstimado)}
              </span>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold text-xs shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Enviando a Mostrador...</span>
                </>
              ) : (
                <>
                  <span>Confirmar y Enviar Pedido</span>
                  <Check className="size-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
