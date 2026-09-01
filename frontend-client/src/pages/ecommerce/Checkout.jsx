// frontend/src/pages/ecommerce/Checkout.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  Store,
  Truck,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Sparkles,
  MapPin,
  Info,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useCart, calculateItemPrice } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../config/api";
import {
  formatPrecio,
  formatCantidad,
  formatPrecioPorUnidad,
} from "../../utils/formatters";
import TimeSlotSelector from "../../components/TimeSlotSelector";

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    subtotal,
    totalAhorro,
    totalEstimado,
    totalKg,
    totalItems,
    totalPuntos,
    clearCart,
  } = useCart();

  // Estados de datos
  const [sucursales, setSucursales] = useState([]);
  const [loadingSucursales, setLoadingSucursales] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const inputLabel = "block text-sm font-semibold text-neutral-700 mb-1";
  const inputClassnames =
    "w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-base focus:outline-none focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue";
  const selectClassnames =
    "w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-base bg-white focus:outline-none focus:ring-2 focus:ring-main-blue/30";

  // Paso 1: Datos del Comprador (Pre-cargados si el usuario está logueado)
  const [cliente, setCliente] = useState({
    nombre: user?.nombre || "",
    telefono: user?.telefono || "",
    email: user?.email || "",
    usuario: user?.usuario || "",
  });

  useEffect(() => {
    if (user) {
      setCliente((prev) => ({
        nombre: prev.nombre || user.nombre || "",
        telefono: prev.telefono || user.telefono || "",
        email: prev.email || user.email || "",
        usuario: prev.usuario || user.usuario || "",
      }));
    }
  }, [user]);

  // Paso 2: Tipo de Entrega
  const [tipoEntrega, setTipoEntrega] = useState("retiro_sucursal"); // "retiro_sucursal" | "pedidosya" | "logistica_propia"
  const [sucursalId, setSucursalId] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Dirección formal estructurada para detección exacta en Maps
  const [direccionForm, setDireccionForm] = useState({
    calleNumero: "", // Ej: "J. Tarulli 1474"
    pisoDepto: "", // Ej: "Piso 2 Depto B"
    localidad: "Luis Guillón",
    partido: "Esteban Echeverría",
    provincia: "Provincia de Buenos Aires",
    notas: "", // Ej: "Timbre blanco, portón negro"
  });

  // Costo de envío
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [calculandoEnvio, setCalculandoEnvio] = useState(false);

  // Paso 3: Medio de Pago
  const [medioPago, setMedioPago] = useState("efectivo");

  // Cargar sucursales activas
  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const res = await fetch(`${API_URL}/sucursales`);
        if (res.ok) {
          const data = await res.json();
          const activas = Array.isArray(data)
            ? data.filter((s) => s.activa !== false)
            : [];
          setSucursales(activas);
          if (activas.length > 0) {
            setSucursalId(activas[0].id.toString());
          }
        }
      } catch (err) {
        console.error("Error al cargar sucursales:", err);
      } finally {
        setLoadingSucursales(false);
      }
    };
    fetchSucursales();
  }, []);

  // Dirección formal completa normalizada para Maps y BD
  const direccionFormalCompleta = `${direccionForm.calleNumero.trim()}${
    direccionForm.pisoDepto ? `, ${direccionForm.pisoDepto.trim()}` : ""
  }, ${direccionForm.localidad.trim()}, ${direccionForm.partido.trim()}, ${direccionForm.provincia.trim()}`;

  // Ajustar costo y medio de pago según tipo de entrega
  useEffect(() => {
    if (tipoEntrega === "retiro_sucursal") {
      setCostoEnvio(0);
    } else if (tipoEntrega === "pedidosya") {
      setCostoEnvio(1800); // Tarifa estimada PedidosYa Envíos
      // PedidosYa requiere pago previo asegurado
      if (medioPago === "transferencia" || medioPago === "posnet_entrega") {
        setMedioPago("mercadopago");
      }
    } else if (tipoEntrega === "logistica_propia") {
      setCostoEnvio(1200); // Logística propia Valette
    }
  }, [tipoEntrega]);

  // Si el carrito está vacío, sugerir volver
  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="size-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-400">
          <ShoppingBag className="size-10 stroke-1" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          No hay productos en tu carrito
        </h2>
        <p className="text-neutral-500 mb-6">
          Agregá cortes de carne y aprovechá nuestras promociones antes de
          finalizar tu pedido.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-main-blue text-white font-bold text-sm shadow hover:bg-main-blue/90 transition-all"
        >
          <ArrowLeft className="size-4" />
          <span>Ir a la tienda</span>
        </Link>
      </div>
    );
  }

  const sucursalSeleccionada = sucursales.find(
    (s) => s.id.toString() === sucursalId,
  );

  const granTotal = totalEstimado + costoEnvio;

  const handleSubmitPedido = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!cliente.nombre.trim()) {
      setErrorMsg("Por favor, ingresá tu nombre y apellido.");
      return;
    }
    if (!cliente.telefono.trim()) {
      setErrorMsg(
        "Por favor, ingresá tu número de teléfono / WhatsApp de contacto.",
      );
      return;
    }

    if (
      tipoEntrega !== "retiro_sucursal" &&
      !direccionForm.calleNumero.trim()
    ) {
      setErrorMsg(
        "Por favor, ingresá la calle y altura para el envío a domicilio.",
      );
      return;
    }

    if (!sucursalId) {
      setErrorMsg(
        "Por favor, seleccioná la sucursal de origen para preparar tu pedido.",
      );
      return;
    }

    if (!selectedDate || !selectedSlot) {
      setErrorMsg(
        "Por favor, seleccioná el día y el horario para recibir/retirar tu pedido.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        cliente: {
          nombre: cliente.nombre.trim().replace(/\s*\(@[^)]+\)/g, ""),
          usuario: cliente.usuario
            ? cliente.usuario.trim().replace(/^@/, "")
            : null,
          telefono: cliente.telefono.trim(),
          email: cliente.email ? cliente.email.trim() : null,
          direccion:
            tipoEntrega !== "retiro_sucursal" ? direccionFormalCompleta : null,
        },
        sucursal_id: Number(sucursalId),
        tipo_entrega: tipoEntrega,
        fecha_entrega_programada: new Date(
          selectedDate.toDateString() + " " + selectedSlot.split(" - ")[0],
        ).toISOString(),
        medio_pago: medioPago,
        direccion_entrega:
          tipoEntrega !== "retiro_sucursal" ? direccionFormalCompleta : null,
        notas: direccionForm.notas ? direccionForm.notas.trim() : null,
        monto_total_estimado: granTotal,
        items: cartItems.map((item) => {
          const calc = calculateItemPrice(item);
          return {
            catalogo_id: item.id,
            cantidad_kg: item.cantidad_kg,
            precio_por_kg_congelado: item.precio,
            precio_estimado: calc.total,
          };
        }),
      };

      const res = await fetch(`${VITE_API_URL}/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || data.detalles || "Error al crear el pedido",
        );
      }

      // Vaciar carrito
      clearCart();

      // Redirigir a página de confirmación
      navigate(`/pedido/${data.pedido.id}/confirmacion`);
    } catch (err) {
      console.error("Error al procesar el pedido:", err);
      setErrorMsg(
        err.message ||
          "Ocurrió un error al procesar tu pedido. Intentá nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-neutral-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header y botón volver */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/"
            className="p-2 rounded-lg bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 transition-colors shadow-2xs"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              Finalizar Compra
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500">
              Completá los datos para coordinar el fraccionado y la entrega de
              tus cortes
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm">
            <AlertCircle className="size-5 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmitPedido}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* COLUMNA IZQUIERDA: Formulario */}
          <div className="lg:col-span-7 space-y-6">
            {/* SECCIÓN 1: DATOS DE CONTACTO */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <div className="size-7 rounded-full bg-main-blue/10 flex items-center justify-center text-main-blue font-bold text-xs">
                  1
                </div>
                <h2 className="text-base font-bold text-neutral-900">
                  Datos de Contacto
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={inputLabel}>
                    Nombre y Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={cliente.nombre}
                    onChange={(e) =>
                      setCliente({ ...cliente, nombre: e.target.value })
                    }
                    className={inputClassnames}
                  />
                </div>

                <div>
                  <label className={inputLabel}>
                    WhatsApp / Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 11 2345-6789"
                    value={cliente.telefono}
                    onChange={(e) =>
                      setCliente({ ...cliente, telefono: e.target.value })
                    }
                    className={inputClassnames}
                  />
                  <p className="text-xs text-neutral-400 mt-1">
                    Te escribiremos para confirmar cuando el corte esté pesado.
                  </p>
                </div>

                <div>
                  <label className={inputLabel}>Email (Opcional)</label>
                  <input
                    type="email"
                    placeholder="juan@email.com"
                    value={cliente.email}
                    onChange={(e) =>
                      setCliente({ ...cliente, email: e.target.value })
                    }
                    className={inputClassnames}
                  />
                </div>

                <div>
                  <label className={inputLabel}>
                    Usuario / Redes (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="@usuario_instagram"
                    value={cliente.usuario}
                    onChange={(e) =>
                      setCliente({ ...cliente, usuario: e.target.value })
                    }
                    className={inputClassnames}
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: TIPO DE ENTREGA */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <div className="size-7 rounded-full bg-main-blue/10 flex items-center justify-center text-main-blue font-bold text-xs">
                  2
                </div>
                <h2 className="text-base font-bold text-neutral-900">
                  Forma de Entrega
                </h2>
              </div>

              {/* Selector de opciones */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTipoEntrega("retiro_sucursal")}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    tipoEntrega === "retiro_sucursal"
                      ? "border-main-blue bg-blue-50/50 ring-1 ring-main-blue text-main-blue"
                      : "border-neutral-200 hover:border-neutral-300 text-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <Store className="size-5" />
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      GRATIS
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold">Retiro en Sucursal</p>
                    <p className="text-[11px] opacity-75">Sin costo de envío</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoEntrega("pedidosya")}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    tipoEntrega === "pedidosya"
                      ? "border-main-blue bg-blue-50/50 ring-1 ring-main-blue text-main-blue"
                      : "border-neutral-200 hover:border-neutral-300 text-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <Truck className="size-5 text-red-500" />
                    <span className="text-[11px] font-bold text-neutral-600">
                      Express
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold">PedidosYa Envíos</p>
                    <p className="text-[11px] opacity-75">
                      Entrega rápida (30-45 min)
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoEntrega("logistica_propia")}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    tipoEntrega === "logistica_propia"
                      ? "border-main-blue bg-blue-50/50 ring-1 ring-main-blue text-main-blue"
                      : "border-neutral-200 hover:border-neutral-300 text-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <Truck className="size-5 text-main-blue" />
                    <span className="text-[11px] font-bold text-neutral-600">
                      Refrigerado
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold">Logística Propia</p>
                    <p className="text-[11px] opacity-75">
                      Furgón refrigerado Valette
                    </p>
                  </div>
                </button>
              </div>

              {/* Detalle según selección */}
              {tipoEntrega === "retiro_sucursal" ? (
                <div className="pt-3 border-t border-neutral-100">
                  <label className="block text-xs font-semibold text-neutral-700 mb-2">
                    Seleccioná la sucursal de retiro:
                  </label>
                  {loadingSucursales ? (
                    <p className="text-xs text-neutral-400">
                      Cargando sucursales...
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sucursales.map((sucursal) => (
                        <label
                          key={sucursal.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            sucursalId === sucursal.id.toString()
                              ? "border-main-blue bg-blue-50/30"
                              : "border-neutral-200 hover:bg-neutral-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="sucursal"
                            value={sucursal.id}
                            checked={sucursalId === sucursal.id.toString()}
                            onChange={(e) => setSucursalId(e.target.value)}
                            className="mt-1 text-main-blue focus:ring-main-blue"
                          />
                          <div className="text-xs">
                            <p className="font-bold text-neutral-900">
                              {sucursal.nombre} ({sucursal.ciudad})
                            </p>
                            <p className="text-neutral-500">
                              {sucursal.direccion}
                            </p>
                            {sucursal.horario_atencion && (
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Horario: {sucursal.horario_atencion}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  <TimeSlotSelector
                    sucursal={sucursalSeleccionada}
                    selectedDate={selectedDate}
                    selectedSlot={selectedSlot}
                    onSelectSlot={(date, slot) => {
                      setSelectedDate(date);
                      setSelectedSlot(slot);
                    }}
                  />
                </div>
              ) : (
                <div className="pt-3 border-t border-neutral-100 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-blue-900 bg-blue-50 p-2.5 rounded-lg border border-blue-200">
                    <MapPin className="size-4 shrink-0 text-main-blue" />
                    <span>
                      Ingresá tu dirección con formato formal para
                      geolocalización precisa.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className={inputLabel}>
                        Calle y Número <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. J. Tarulli 1474"
                        value={direccionForm.calleNumero}
                        onChange={(e) =>
                          setDireccionForm({
                            ...direccionForm,
                            calleNumero: e.target.value,
                          })
                        }
                        className={inputClassnames}
                      />
                    </div>

                    <div>
                      <label className={inputLabel}>Piso / Depto</label>
                      <input
                        type="text"
                        placeholder="Ej. Piso 2B"
                        value={direccionForm.pisoDepto}
                        onChange={(e) =>
                          setDireccionForm({
                            ...direccionForm,
                            pisoDepto: e.target.value,
                          })
                        }
                        className={inputClassnames}
                      />
                    </div>

                    <div>
                      <label className={inputLabel}>Localidad / Barrio</label>
                      <input
                        type="text"
                        placeholder="Luis Guillón"
                        value={direccionForm.localidad}
                        onChange={(e) =>
                          setDireccionForm({
                            ...direccionForm,
                            localidad: e.target.value,
                          })
                        }
                        className={inputClassnames}
                      />
                    </div>

                    <div>
                      <label className={inputLabel}>Partido / Ciudad</label>
                      <input
                        type="text"
                        placeholder="Esteban Echeverría"
                        value={direccionForm.partido}
                        onChange={(e) =>
                          setDireccionForm({
                            ...direccionForm,
                            partido: e.target.value,
                          })
                        }
                        className={inputClassnames}
                      />
                    </div>

                    <div>
                      <label className={inputLabel}>Provincia</label>
                      <input
                        type="text"
                        placeholder="Provincia de Buenos Aires"
                        value={direccionForm.provincia}
                        onChange={(e) =>
                          setDireccionForm({
                            ...direccionForm,
                            provincia: e.target.value,
                          })
                        }
                        className={inputClassnames}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className={inputLabel}>
                      Aclaraciones de entrega (Opcional)
                    </label>
                    <textarea
                      placeholder="Ej. Dejar en recepción / Portón gris / Tocar timbre 2"
                      value={direccionForm.notas}
                      onChange={(e) =>
                        setDireccionForm({
                          ...direccionForm,
                          notas: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full p-2.5 rounded-lg border border-neutral-300 text-sm focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue mb-4 resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={inputLabel}>
                      Sucursal Valette que preparará tu envío:
                    </label>
                    <select
                      value={sucursalId}
                      onChange={(e) => setSucursalId(e.target.value)}
                      className={selectClassnames}
                    >
                      {sucursales.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} - {s.direccion}, {s.ciudad}
                        </option>
                      ))}
                    </select>
                  </div>

                  <TimeSlotSelector
                    sucursal={sucursalSeleccionada}
                    selectedDate={selectedDate}
                    selectedSlot={selectedSlot}
                    onSelectSlot={(date, slot) => {
                      setSelectedDate(date);
                      setSelectedSlot(slot);
                    }}
                  />

                  {calculandoEnvio && null}
                </div>
              )}
            </div>

            {/* SECCIÓN 3: MÉTODO DE PAGO */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <div className="size-7 rounded-full bg-main-blue/10 flex items-center justify-center text-main-blue font-bold text-xs">
                  3
                </div>
                <h2 className="text-base font-bold text-neutral-900">
                  Método de Pago
                </h2>
              </div>

              <div className="space-y-2.5">
                {/* Mercado Pago */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    medioPago === "mercadopago"
                      ? "border-main-blue bg-blue-50/40 ring-1 ring-main-blue"
                      : "border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="medioPago"
                    value="mercadopago"
                    checked={medioPago === "mercadopago"}
                    onChange={(e) => setMedioPago(e.target.value)}
                    className="mt-1 text-main-blue"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-2 font-bold text-neutral-900">
                      <CreditCard className="size-4 text-sky-600" />
                      <span>Mercado Pago</span>
                      <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded-full">
                        Pago Online
                      </span>
                    </div>
                    <p className="text-neutral-500 mt-0.5">
                      Tarjetas de débito, crédito o dinero en cuenta de Mercado
                      Pago.
                    </p>
                  </div>
                </label>

                {/* Efectivo */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    medioPago === "efectivo"
                      ? "border-main-blue bg-blue-50/40 ring-1 ring-main-blue"
                      : "border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="medioPago"
                    value="efectivo"
                    checked={medioPago === "efectivo"}
                    onChange={(e) => setMedioPago(e.target.value)}
                    className="mt-1 text-main-blue"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-2 font-bold text-neutral-900">
                      <Banknote className="size-4 text-emerald-600" />
                      <span>
                        {tipoEntrega === "retiro_sucursal"
                          ? "Efectivo al retirar en sucursal"
                          : "Efectivo contra entrega"}
                      </span>
                    </div>
                    <p className="text-neutral-500 mt-0.5">
                      Abonás con el importe exacto luego de corroborar el pesaje
                      en balanza.
                    </p>
                  </div>
                </label>

                {/* Transferencia (Exclusivo o prioritario para retiro en sucursal / comprobante QR) */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    medioPago === "transferencia"
                      ? "border-main-blue bg-blue-50/40 ring-1 ring-main-blue"
                      : "border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="medioPago"
                    value="transferencia"
                    checked={medioPago === "transferencia"}
                    onChange={(e) => setMedioPago(e.target.value)}
                    className="mt-1 text-main-blue"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-2 font-bold text-neutral-900">
                      <QrCode className="size-4 text-purple-600" />
                      <span>Transferencia Bancaria / QR en Sucursal</span>
                    </div>
                    <p className="text-neutral-500 mt-0.5">
                      Alias:{" "}
                      <strong className="text-neutral-800">
                        VALETTE.CARNES
                      </strong>{" "}
                      (Se verifica con comprobante al retirar).
                    </p>
                  </div>
                </label>

                {/* Posnet en local o entrega */}
                {tipoEntrega !== "pedidosya" && (
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      medioPago === "posnet_entrega"
                        ? "border-main-blue bg-blue-50/40 ring-1 ring-main-blue"
                        : "border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="medioPago"
                      value="posnet_entrega"
                      checked={medioPago === "posnet_entrega"}
                      onChange={(e) => setMedioPago(e.target.value)}
                      className="mt-1 text-main-blue"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center gap-2 font-bold text-neutral-900">
                        <CreditCard className="size-4 text-neutral-700" />
                        <span>
                          Tarjeta con Posnet (en sucursal o al recibir)
                        </span>
                      </div>
                      <p className="text-neutral-500 mt-0.5">
                        Llevamos el posnet inalámbrico o pagás directo en el
                        mostrador.
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Resumen de Compra Flotante */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm sticky top-24 space-y-4">
              <h2 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-3">
                Resumen del Pedido ({totalItems}{" "}
                {totalItems === 1 ? "corte" : "cortes"})
              </h2>

              {/* Lista de productos */}
              <div className="max-h-60 overflow-y-auto divide-y divide-neutral-100 pr-1">
                {cartItems.map((item) => {
                  const calc = calculateItemPrice(item);
                  return (
                    <div
                      key={item.id}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-neutral-800 truncate">
                          {item.nombre_producto}
                        </p>
                        <p className="text-neutral-500">
                          {formatCantidad(
                            item.cantidad_kg,
                            item.unidad_medida || "kg",
                          )}{" "}
                          •{" "}
                          {formatPrecioPorUnidad(
                            item.precio,
                            item.unidad_medida || "kg",
                          )}
                        </p>
                        {calc.hasPromo && (
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            Promo: -{formatPrecio(calc.ahorro)}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-neutral-900 shrink-0">
                        {formatPrecio(calc.total)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Puntos acumulables */}
              {totalPuntos > 0 && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="size-4 text-amber-600" />
                    <span>Puntos que acumulás:</span>
                  </div>
                  <span className="text-amber-800 font-bold">
                    +{totalPuntos} pts
                  </span>
                </div>
              )}

              {/* Totales */}
              <div className="space-y-1.5 text-xs text-neutral-600 border-t border-neutral-100 pt-3">
                <div className="flex justify-between">
                  <span>Subtotal productos</span>
                  <span>{formatPrecio(subtotal)}</span>
                </div>

                {totalAhorro > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Ahorro por promociones</span>
                    <span>-{formatPrecio(totalAhorro)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Costo de entrega</span>
                  <span>
                    {costoEnvio === 0 ? (
                      <span className="text-emerald-700 font-bold">GRATIS</span>
                    ) : (
                      formatPrecio(costoEnvio)
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-base font-extrabold text-neutral-900 pt-2 border-t border-neutral-200">
                  <span>Total Estimado</span>
                  <span className="text-xl text-main-blue">
                    {formatPrecio(granTotal)}
                  </span>
                </div>
              </div>

              {/* Advertencia de fraccionamiento */}
              <div className="p-3 bg-neutral-50 rounded-lg text-[11px] text-neutral-500 leading-relaxed flex items-start gap-2 border border-neutral-200/60">
                <Info className="size-4 text-main-blue shrink-0 mt-0.5" />
                <span>
                  Los cortes vacunos, de cerdo y pollo se fraccionan
                  artesanalmente en sucursal. El importe exacto final puede
                  variar levemente según el pesaje de balanza.
                </span>
              </div>

              {/* Botón de Confirmación */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-main-blue hover:bg-main-blue/95 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="size-5" />
                <span>
                  {isSubmitting
                    ? "Procesando pedido..."
                    : "Confirmar y Realizar Pedido"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
