// src/components/modals/CheckoutModal.jsx
import { useMemo, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronDown,
  Check,
  Loader2,
  AlertCircle,
  Store,
  Truck,
  MapPin,
  Clock,
  Banknote,
  Landmark,
  CreditCard,
  User,
  ShoppingBag,
  Sparkles,
  Pencil,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLocation, CASA_CENTRAL_BRANCH } from "@/context/LocationContext";
import { useToast } from "@/context/ToastContext";
import { formatPrecio, formatUnidadMedida } from "@/utils/formatters";
import { calculateItemPrice } from "@/utils/priceCalculator";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import {
  getAvailableDeliverySlots,
  getBranchOpenStatus,
} from "@/utils/horarios";
import {
  parseAddressParts,
  composeAddress,
  buildStructuredAddress,
  hasRequiredAddress,
} from "@/utils/address";
import { API_URL } from "@/config/api";

function getInitialCustomer(authUser) {
  if (authUser && (authUser.nombre || authUser.telefono || authUser.email)) {
    return {
      nombre: authUser.nombre || "",
      telefono: authUser.telefono || "",
      email: authUser.email || "",
      usuario: authUser.usuario || "",
    };
  }
  try {
    const savedCheckout = localStorage.getItem("valette_checkout_customer");
    if (savedCheckout) {
      const parsed = JSON.parse(savedCheckout);
      return {
        nombre: parsed.nombre || "",
        telefono: parsed.telefono || "",
        email: parsed.email || "",
        usuario: "",
      };
    }
  } catch {}
  return {
    nombre: "",
    telefono: "",
    email: "",
    usuario: "",
  };
}

export const CheckoutModal = ({
  isOpen,
  onClose,
  onBack,
  onOrderConfirmed,
}) => {
  const {
    cartItems,
    totalItems,
    totalAhorro,
    totalEstimado,
    totalPuntos,
    clearCart,
    sesionId,
    setActiveOrderId,
    registerFunnelStep,
  } = useCart();
  const { user, isAuthenticated, token, refreshProfile } = useAuth();
  const {
    selectedBranch,
    customerAddress,
    updateCustomerAddress,
    deliveryMode,
    setDeliveryMode,
  } = useLocation();
  const { showToast } = useToast();

  const branch = selectedBranch || CASA_CENTRAL_BRANCH;
  const branchStatus = getBranchOpenStatus(branch);
  const availableSlots = useMemo(
    () => getAvailableDeliverySlots(branch),
    [branch],
  );

  const initialAddr = useMemo(
    () =>
      parseAddressParts(
        user?.direccion_default || customerAddress || "",
        user?.direccion_datos || null,
      ),
    [user?.direccion_default, user?.direccion_datos, customerAddress],
  );

  const [cliente, setCliente] = useState(() => getInitialCustomer(user));
  const [addressForm, setAddressForm] = useState(() => initialAddr);
  const [isEditingAddress, setIsEditingAddress] = useState(
    () => !hasRequiredAddress(initialAddr),
  );
  const [notas, setNotas] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(
    () => availableSlots[0]?.key || "Mañana 08:30 - 11:00",
  );
  const [medioPago, setMedioPago] = useState("efectivo");
  const [currentStep, setCurrentStep] = useState("checkout_datos");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleBackModal = () => {
    if (isSubmitting) return;
    if (registerFunnelStep) {
      registerFunnelStep(currentStep, `cierre_${currentStep}`);
    }
    (onBack || onClose)();
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    if (registerFunnelStep) {
      registerFunnelStep(currentStep, `cierre_${currentStep}`);
    }
    onClose();
  };

  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    handleBackModal,
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

  const activeSlotKey = availableSlots.some((s) => s.key === selectedSlot)
    ? selectedSlot
    : availableSlots[0]?.key || selectedSlot;

  const formattedAddressPreview = composeAddress(addressForm);
  const addressIsComplete = hasRequiredAddress(addressForm);
  const isPickup = deliveryMode === "pickup";

  const paymentOptions = [
    {
      id: "efectivo",
      label: "Efectivo",
      sub: isPickup ? "Al retirar en mostrador" : "Al recibir tu pedido",
      Icon: Banknote,
    },
    {
      id: "transferencia",
      label: "Transferencia",
      sub: "Alias / CBU al confirmar",
      Icon: Landmark,
    },
    {
      id: "mercadopago",
      label: "Mercado Pago",
      sub: "Dinero en cuenta o QR",
      Icon: CreditCard,
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!cliente.nombre.trim() || !cliente.telefono.trim()) {
      setSubmitError(
        "Completá tu nombre y teléfono / WhatsApp para continuar.",
      );
      return;
    }

    if (!isPickup && !hasRequiredAddress(addressForm)) {
      setIsEditingAddress(true);
      setSubmitError(
        "Completá calle, altura y localidad para coordinar el envío.",
      );
      return;
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      setSubmitError("Tu carrito está vacío.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const authToken = token || localStorage.getItem("valette_token");
      let attributedBannerId = null;
      try {
        const rawBid = sessionStorage.getItem("valette_last_banner_id");
        if (rawBid && Number.isFinite(Number(rawBid))) {
          attributedBannerId = Number(rawBid);
        }
      } catch {}

      const direccionFormateada = composeAddress(addressForm);
      const direccionEstructurada = !isPickup
        ? buildStructuredAddress(addressForm)
        : null;

      const direccionFinal = isPickup
        ? `Retiro en ${branch.direccion}`
        : direccionFormateada;

      const notasFinal = [
        `Franja: ${activeSlotKey}`,
        notas.trim() ? notas.trim() : null,
      ]
        .filter(Boolean)
        .join(" | ");

      const res = await fetch(`${API_URL}/pedidos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...(sesionId ? { "X-Sesion-Id": sesionId } : {}),
        },
        body: JSON.stringify({
          cliente: {
            nombre: cliente.nombre.trim(),
            telefono: cliente.telefono.trim(),
            email: cliente.email?.trim() || undefined,
            usuario: cliente.usuario?.trim() || undefined,
          },
          sucursal_id: branch.id || 1,
          tipo_entrega: isPickup ? "retiro_sucursal" : "envio_domicilio",
          medio_pago: medioPago,
          direccion_entrega: direccionFinal,
          direccion_datos: direccionEstructurada,
          notas: notasFinal,
          monto_total_estimado: totalEstimado,
          sesion_id: sesionId,
          banner_id: attributedBannerId,
          items: cartItems.map((it) => {
            const baseCorte = it.corte || "Corte tradicional";
            const itemNote = it.notas?.trim();
            return {
              id: it.id,
              catalogo_id: it.catalogo_id || it.id,
              es_combo: Boolean(it.es_combo),
              combo_id: it.combo_id || null,
              nombre: it.nombre || it.nombre_producto,
              precio: Number(it.precio) || 0,
              cantidad_kg: Number(it.cantidad_kg || it.cantidad || 1),
              unidad_medida: formatUnidadMedida(it.unidad_medida),
              corte: itemNote ? `${baseCorte} · Nota: ${itemNote}` : baseCorte,
              items_combo: it.items_combo || undefined,
            };
          }),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error || data.detalles || "No se pudo registrar el pedido.",
        );
      }

      try {
        sessionStorage.removeItem("valette_last_banner_id");
      } catch {}

      try {
        localStorage.setItem(
          "valette_checkout_customer",
          JSON.stringify({
            nombre: cliente.nombre.trim(),
            telefono: cliente.telefono.trim(),
            email: cliente.email?.trim() || "",
          }),
        );
      } catch {}

      if (!isPickup && direccionFormateada) {
        updateCustomerAddress(direccionFormateada);
      }

      if (data.pedido?.id) {
        setActiveOrderId(data.pedido.id);
      }

      if (isAuthenticated) {
        refreshProfile().catch(() => {});
      }

      clearCart();
      onOrderConfirmed(data.pedido);
      showToast(
        `Pedido #${String(data.pedido?.id || "").padStart(4, "0")} confirmado y enviado al mostrador`,
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-[#F6F8FA] w-full sm:max-w-lg rounded-t-4xl sm:rounded-3xl shadow-2xl max-h-[92dvh] sm:max-h-[88dvh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 overscroll-contain"
      >
        {/* Header uniforme fijo con barra táctil */}
        <div
          {...dragHandleProps}
          className="touch-none select-none shrink-0 bg-white px-5 sm:px-6 pt-3 pb-3 border-b border-slate-200/70"
        >
          <div className="w-11 h-1 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackModal}
              disabled={isSubmitting}
              aria-label="Volver al carrito"
              title="Volver"
              className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-2xs transition-colors"
            >
              <ChevronLeft
                className="size-4 stroke-[2.25]"
                aria-hidden="true"
              />
            </button>

            <h1
              id="checkout-modal-title"
              className="text-[15px] font-extrabold text-slate-900 tracking-tight leading-tight"
            >
              Confirmar Pedido
            </h1>

            <button
              type="button"
              onClick={handleCloseModal}
              disabled={isSubmitting}
              aria-label="Cerrar"
              title="Cerrar"
              className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-500 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-2xs transition-colors"
            >
              <X className="size-4 stroke-[2.25]" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Formulario scrolleable + Footer fijo de conversión */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0 text-xs"
        >
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-5 py-4 space-y-4 overscroll-contain">
            {submitError && (
              <div
                role="alert"
                className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-2 font-semibold"
              >
                <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Resumen desplegable compacto del carrito */}
            <details className="group bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <summary className="px-4 py-3 flex items-center justify-between gap-2 cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2 font-extrabold text-slate-800">
                  <ShoppingBag
                    className="size-4 text-[#003366] shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    Tu compra ({totalItems}{" "}
                    {totalItems === 1 ? "producto" : "productos"})
                  </span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  {totalPuntos > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-[10px] font-extrabold font-num">
                      <Sparkles className="size-2.5 text-amber-500" />+
                      {totalPuntos} pts
                    </span>
                  )}
                  <ChevronDown
                    className="size-4 text-slate-400 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </span>
              </summary>
              <div className="px-4 pb-3.5 pt-2 border-t border-slate-100 space-y-2">
                {cartItems.map((it) => {
                  const qty = Number(it.cantidad_kg || it.cantidad || 1);
                  const unit = formatUnidadMedida(it.unidad_medida);
                  const pricing = calculateItemPrice({
                    ...it,
                    cantidad_kg: qty,
                  });
                  return (
                    <div
                      key={it.id}
                      className="flex items-start justify-between gap-2 text-[11.5px]"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 truncate block">
                          <span className="font-num text-[#003366] mr-1">
                            {qty} {unit}
                          </span>
                          {it.nombre || it.nombre_producto}
                        </span>
                        {it.corte && (
                          <span className="text-[10.5px] text-slate-400 block truncate">
                            {it.corte}
                            {it.notas ? ` · ${it.notas}` : ""}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-900 font-num shrink-0">
                        {formatPrecio(pricing.total)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </details>

            {/* Sección 1: Datos de contacto */}
            <section
              onFocus={() => markStep("checkout_datos")}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider inline-flex items-center gap-1.5">
                  <User
                    className="size-3.5 text-[#003366]"
                    aria-hidden="true"
                  />
                  <span>1. Datos de contacto</span>
                </span>
                {isAuthenticated && user?.referral_code && (
                  <span className="text-[12px] font-bold text-[#003366] bg-[#EFF4F9] px-2 py-0.5 rounded-full font-num">
                    ID de Cliente: {user.referral_code}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label
                    htmlFor="checkout-nombre"
                    className="block text-[10.5px] font-bold text-slate-500 mb-1"
                  >
                    Nombre y apellido *
                  </label>
                  <input
                    id="checkout-nombre"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    enterKeyHint="next"
                    value={cliente.nombre}
                    onChange={(e) =>
                      setCliente((s) => ({ ...s, nombre: e.target.value }))
                    }
                    placeholder="Ej: Juan Pérez"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#003366] transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-telefono"
                    className="block text-[10.5px] font-bold text-slate-500 mb-1"
                  >
                    WhatsApp *
                  </label>
                  <input
                    id="checkout-telefono"
                    name="tel"
                    type="tel"
                    required
                    autoComplete="tel"
                    enterKeyHint="next"
                    value={cliente.telefono}
                    onChange={(e) =>
                      setCliente((s) => ({ ...s, telefono: e.target.value }))
                    }
                    placeholder="Ej: 11 3553-4033"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#003366] transition-colors font-num"
                  />
                </div>
              </div>
            </section>

            {/* Sección 2: Modalidad de Entrega, Dirección Estructurada y Franja Horaria */}
            <section
              onFocus={() => markStep("checkout_entrega")}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3.5"
            >
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider inline-flex items-center gap-1.5">
                <MapPin
                  className="size-3.5 text-[#003366]"
                  aria-hidden="true"
                />
                <span>2. Entrega y horario</span>
              </span>

              {/* Selector Envío vs Retiro */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMode("delivery");
                    markStep("checkout_entrega");
                  }}
                  className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    !isPickup
                      ? "border-[#003366] bg-[#EFF4F9] text-[#003366]"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                  }`}
                >
                  <Truck className="size-4 shrink-0" aria-hidden="true" />
                  <span>Envío a domicilio</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMode("pickup");
                    markStep("checkout_entrega");
                  }}
                  className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isPickup
                      ? "border-[#003366] bg-[#EFF4F9] text-[#003366]"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                  }`}
                >
                  <Store className="size-4 shrink-0" aria-hidden="true" />
                  <span>Retiro en sucursal</span>
                </button>
              </div>

              {/* Sucursal de retiro O Dirección estructurada de envío */}
              {isPickup ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-900">
                      Sucursal {branch.nombre}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        branchStatus.isOpen
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-200/70 text-slate-600"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          branchStatus.isOpen
                            ? "bg-emerald-500"
                            : "bg-slate-400"
                        }`}
                      />
                      {branchStatus.shortText}
                    </span>
                  </div>
                  <p className="text-[11.5px] font-semibold text-slate-600">
                    {branch.direccion}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {branch.horario_atencion || branch.horario}
                  </p>
                </div>
              ) : addressIsComplete && !isEditingAddress ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Dirección de envío
                    </span>
                    <p className="text-xs font-bold text-slate-900 leading-snug">
                      {formattedAddressPreview}
                    </p>
                    <span className="text-[10.5px] text-slate-400 block">
                      Buenos Aires, Argentina
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-[#003366] font-bold text-[11px] inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                  >
                    <Pencil className="size-3" aria-hidden="true" />
                    <span>Editar</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500">
                      Dirección de envío
                    </span>
                    {addressIsComplete && (
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="text-[11px] font-bold text-[#003366] hover:underline cursor-pointer"
                      >
                        Listo
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label
                        htmlFor="checkout-calle"
                        className="block text-[10px] font-bold text-slate-500 mb-1"
                      >
                        Calle *
                      </label>
                      <input
                        id="checkout-calle"
                        name="address-line1"
                        type="text"
                        required={!isPickup}
                        autoComplete="shipping address-line1"
                        enterKeyHint="next"
                        value={addressForm.calle}
                        onChange={(e) =>
                          setAddressForm((s) => ({
                            ...s,
                            calle: e.target.value,
                          }))
                        }
                        placeholder="Ej: Av. Luciano Valette"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-[#003366]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="checkout-altura"
                        className="block text-[10px] font-bold text-slate-500 mb-1"
                      >
                        Altura / N° *
                      </label>
                      <input
                        id="checkout-altura"
                        name="street-number"
                        type="text"
                        required={!isPickup}
                        inputMode="numeric"
                        enterKeyHint="next"
                        value={addressForm.altura}
                        onChange={(e) =>
                          setAddressForm((s) => ({
                            ...s,
                            altura: e.target.value,
                          }))
                        }
                        placeholder="Ej: 1696"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-[#003366] font-num"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="checkout-piso"
                        className="block text-[10px] font-bold text-slate-500 mb-1"
                      >
                        Piso (opc.)
                      </label>
                      <input
                        id="checkout-piso"
                        name="floor"
                        type="text"
                        enterKeyHint="next"
                        value={addressForm.piso}
                        onChange={(e) =>
                          setAddressForm((s) => ({
                            ...s,
                            piso: e.target.value,
                          }))
                        }
                        placeholder="Ej: 2 / PB"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-[#003366]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="checkout-depto"
                        className="block text-[10px] font-bold text-slate-500 mb-1"
                      >
                        Depto / Timbre (opc.)
                      </label>
                      <input
                        id="checkout-depto"
                        name="address-line2"
                        type="text"
                        autoComplete="shipping address-line2"
                        enterKeyHint="next"
                        value={addressForm.depto}
                        onChange={(e) =>
                          setAddressForm((s) => ({
                            ...s,
                            depto: e.target.value,
                          }))
                        }
                        placeholder="Ej: B / Casa 4"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-[#003366]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label
                        htmlFor="checkout-localidad"
                        className="block text-[10px] font-bold text-slate-500 mb-1"
                      >
                        Localidad *
                      </label>
                      <input
                        id="checkout-localidad"
                        name="address-level2"
                        type="text"
                        required={!isPickup}
                        autoComplete="shipping address-level2"
                        enterKeyHint="next"
                        value={addressForm.localidad}
                        onChange={(e) =>
                          setAddressForm((s) => ({
                            ...s,
                            localidad: e.target.value,
                          }))
                        }
                        placeholder="Ej: Luis Guillón, Monte Grande..."
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-[#003366]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="checkout-cp"
                        className="block text-[10px] font-bold text-slate-500 mb-1"
                      >
                        Cód. Postal
                      </label>
                      <input
                        id="checkout-cp"
                        name="postal-code"
                        type="text"
                        inputMode="numeric"
                        maxLength={8}
                        autoComplete="shipping postal-code"
                        autoCorrect="off"
                        spellCheck={false}
                        enterKeyHint="next"
                        value={addressForm.codigo_postal}
                        onChange={(e) =>
                          setAddressForm((s) => ({
                            ...s,
                            codigo_postal: e.target.value,
                          }))
                        }
                        placeholder="Ej: 1838"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-[#003366] font-num uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-ref"
                      className="block text-[10px] font-bold text-slate-500 mb-1"
                    >
                      Entre calles o referencias (opcional)
                    </label>
                    <input
                      id="checkout-ref"
                      name="address-notes"
                      type="text"
                      enterKeyHint="next"
                      value={addressForm.referencias}
                      onChange={(e) =>
                        setAddressForm((s) => ({
                          ...s,
                          referencias: e.target.value,
                        }))
                      }
                      placeholder="Ej: Portón negro, entre Rojas y Santamarina"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-[#003366]"
                    />
                  </div>
                </div>
              )}

              {/* Selector dinámico de Franjas Horarias reales */}
              <div className="space-y-1.5">
                <span className="text-[10.5px] font-bold text-slate-500 inline-flex items-center gap-1">
                  <Clock className="size-3 text-slate-400" aria-hidden="true" />
                  <span>
                    {isPickup ? "Franja para retirar" : "Franja de entrega"}
                  </span>
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {availableSlots.map((slot) => {
                    const isSelected = activeSlotKey === slot.key;
                    return (
                      <button
                        key={slot.key}
                        type="button"
                        onClick={() => {
                          setSelectedSlot(slot.key);
                          markStep("checkout_entrega");
                        }}
                        className={`py-2 px-1.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#003366] bg-[#EFF4F9] text-[#003366]"
                            : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                        }`}
                      >
                        <span className="block font-extrabold text-[11.5px] leading-tight">
                          {slot.dia}
                        </span>
                        <span className="block text-[10px] font-semibold font-num opacity-80 mt-0.5">
                          {slot.horario}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nota general para el pedido */}
              <div>
                <label
                  htmlFor="checkout-notas"
                  className="block text-[10.5px] font-bold text-slate-500 mb-1"
                >
                  Indicaciones del pedido{" "}
                  <span className="font-medium text-slate-400">(opcional)</span>
                </label>
                <input
                  id="checkout-notas"
                  name="order-notes"
                  type="text"
                  enterKeyHint="done"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej: tocar timbre 2B, separar en bolsas..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 outline-none focus:bg-white focus:border-[#003366] transition-colors"
                />
              </div>
            </section>

            {/* Sección 3: Medio de Pago (sin emojis) */}
            <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2.5">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider inline-flex items-center gap-1.5">
                <CreditCard
                  className="size-3.5 text-[#003366]"
                  aria-hidden="true"
                />
                <span>3. Medio de pago</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {paymentOptions.map((opt) => {
                  const PayIcon = opt.Icon;
                  const isSelected = medioPago === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setMedioPago(opt.id);
                        markStep("checkout_pago");
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex sm:flex-col items-center sm:items-start gap-2.5 sm:gap-1.5 ${
                        isSelected
                          ? "border-[#003366] bg-[#EFF4F9] text-[#003366]"
                          : "border-slate-200 text-slate-700 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between w-auto sm:w-full">
                        <span
                          className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-[#003366] text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <PayIcon
                            className="size-4 stroke-[2.2]"
                            aria-hidden="true"
                          />
                        </span>
                        {isSelected && (
                          <Check
                            className="hidden sm:block size-4 text-[#003366] stroke-[2.75]"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block font-extrabold text-xs leading-tight">
                          {opt.label}
                        </span>
                        <span className="block text-[10.5px] font-medium text-slate-500 mt-0.5 leading-snug">
                          {opt.sub}
                        </span>
                      </div>
                      {isSelected && (
                        <Check
                          className="sm:hidden size-4 text-[#003366] stroke-[2.75] shrink-0"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Footer fijo orientado a conversión */}
          <div className="border-t border-slate-200/80 bg-white px-5 sm:px-6 py-3.5 shrink-0 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                Total estimado
              </span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xl font-black text-slate-900 font-num leading-tight">
                  {formatPrecio(totalEstimado)}
                </span>
                {totalAhorro > 0 && (
                  <span className="text-[11px] font-bold text-emerald-700 font-num">
                    Ahorrás {formatPrecio(totalAhorro)}
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3.5 px-5 sm:px-6 rounded-2xl bg-[#003366] hover:bg-valette-dark disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <span>Confirmar Pedido</span>
                  <Check className="size-4 stroke-[2.5]" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
