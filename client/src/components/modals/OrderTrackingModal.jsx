// src/components/modals/OrderTrackingModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  RotateCw,
  Check,
  ChevronLeft,
  X,
  ReceiptText,
  Store,
  Truck,
  Scale,
  PackageCheck,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  UserCheck,
  CreditCard,
} from "lucide-react";
import { getSocket } from "@/utils/socket";
import { useToast } from "@/context/ToastContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import { formatPrecio } from "@/utils/formatters";
import { API_URL } from "@/config/api";

function getStepIndex(estadoRaw) {
  const est = String(estadoRaw || "solicitado").toLowerCase();
  if (est.includes("entregado") || est.includes("completado")) return 4;
  if (est.includes("camino") || est.includes("listo") || est.includes("pesado"))
    return 3;
  if (est.includes("corte") || est.includes("preparacion")) return 2;
  return 1;
}

function getHeroStatusInfo(pedido) {
  const est = String(
    pedido?.estado_local || pedido?.estado || "solicitado",
  ).toLowerCase();
  const isPickup = pedido?.tipo_entrega === "retiro_sucursal";

  if (est.includes("cancelado") || est.includes("rechazado")) {
    return {
      Icon: XCircle,
      title: "Pedido cancelado",
      pill: "Cancelado",
      pillClass: "bg-rose-50 text-rose-700 border-rose-200/80",
      iconWrap: "bg-rose-50 text-rose-600 border-rose-200/80",
      isCancelled: true,
    };
  }
  if (est.includes("entregado") || est.includes("completado")) {
    return {
      Icon: CheckCircle2,
      title: "Pedido entregado",
      pill: "Entregado",
      pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      iconWrap: "bg-emerald-50 text-emerald-600 border-emerald-200/80",
      isCancelled: false,
    };
  }
  if (est.includes("camino")) {
    return {
      Icon: Truck,
      title: "En camino a tu domicilio",
      pill: "En camino",
      pillClass: "bg-[#EFF4F9] text-[#003366] border-[#003366]/15",
      iconWrap: "bg-[#EFF4F9] text-[#003366] border-[#003366]/15",
      isCancelled: false,
    };
  }
  if (est.includes("listo") || est.includes("pesado")) {
    return {
      Icon: PackageCheck,
      title: isPickup ? "Listo para retirar" : "Listo para despachar",
      pill: "Listo",
      pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      iconWrap: "bg-emerald-50 text-emerald-600 border-emerald-200/80",
      isCancelled: false,
    };
  }
  if (est.includes("corte") || est.includes("preparacion")) {
    return {
      Icon: Scale,
      title: "En preparación en balanza",
      pill: "En balanza",
      pillClass: "bg-amber-50 text-amber-800 border-amber-200/80",
      iconWrap: "bg-amber-50 text-amber-700 border-amber-200/80",
      isCancelled: false,
    };
  }
  return {
    Icon: ClipboardCheck,
    title: "Pedido recibido",
    pill: "Confirmado",
    pillClass: "bg-[#EFF4F9] text-[#003366] border-[#003366]/15",
    iconWrap: "bg-[#EFF4F9] text-[#003366] border-[#003366]/15",
    isCancelled: false,
  };
}

function formatPaymentLabel(raw) {
  const val = String(raw || "").toLowerCase().trim();
  if (!val) return null;
  if (val.includes("efectivo")) return "Efectivo";
  if (val.includes("transfer")) return "Transferencia";
  if (val.includes("mercado") || val.includes("mp")) return "Mercado Pago";
  if (val.includes("tarjeta") || val.includes("debito") || val.includes("credito"))
    return "Tarjeta";
  return raw;
}

export const OrderTrackingModal = ({
  isOpen,
  orderId = null,
  onClose,
  onBack,
}) => {
  const { showToast } = useToast();
  const { activeOrderId, setActiveOrderId, sesionId } = useCart();
  const { pedidosHistorial, token } = useAuth();
  const isInspectingSpecificOrder = Boolean(orderId);
  const activeFromHistory = pedidosHistorial?.find((p) => {
    const est = String(p?.estado_local || p?.estado || "").toLowerCase();
    return (
      !est.includes("entregado") &&
      !est.includes("completado") &&
      !est.includes("cancelado") &&
      !est.includes("rechazado")
    );
  });
  const targetOrderId =
    orderId || activeOrderId || activeFromHistory?.id || null;

  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    onBack || onClose,
  );

  const [pedido, setPedido] = useState(null);
  const [isLoading, setIsLoading] = useState(() =>
    Boolean(isOpen && targetOrderId),
  );

  const buildOrderHeaders = useCallback(() => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (sesionId) headers["X-Sesion-Id"] = sesionId;
    return headers;
  }, [token, sesionId]);

  const fetchPedido = useCallback(
    async (idToFetch, showNotification = false) => {
      if (!idToFetch) return;
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/pedidos/${idToFetch}`, {
          headers: buildOrderHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setPedido(data);
          if (showNotification) {
            showToast(
              `Pedido #${String(data.id).padStart(4, "0")} actualizado`,
              "info",
            );
          }
        } else if (showNotification) {
          showToast(`No se encontró el pedido #${idToFetch}`, "error");
        }
      } catch {
        if (showNotification) {
          showToast("No se pudo conectar con el mostrador", "error");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [showToast, buildOrderHeaders],
  );

  // Cargar pedido al abrir el modal y suscribir en tiempo real vía Socket singleton
  useEffect(() => {
    if (!isOpen || !targetOrderId) return;

    let isMounted = true;
    const loadOrder = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/pedidos/${targetOrderId}`, {
          headers: buildOrderHeaders(),
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setPedido(data);
          if (!isInspectingSpecificOrder) {
            const est = String(
              data?.estado_local || data?.estado || "",
            ).toLowerCase();
            if (
              est.includes("entregado") ||
              est.includes("completado") ||
              est.includes("cancelado") ||
              est.includes("rechazado")
            ) {
              setActiveOrderId(null);
            }
          }
        } else if ((res.status === 403 || res.status === 404) && isMounted) {
          setPedido(null);
          if (!isInspectingSpecificOrder) {
            setActiveOrderId(null);
          }
        }
      } catch {
        // Silencioso
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadOrder();

    const socket = getSocket();

    const handleJoin = () => {
      socket.emit("join_pedido", targetOrderId);
    };
    if (socket.connected) {
      handleJoin();
    }

    const handleUpdated = (updated) => {
      if (
        isMounted &&
        updated &&
        Number(updated.id) === Number(targetOrderId)
      ) {
        setPedido(updated);
        showToast(
          `Tu pedido #${String(updated.id).padStart(4, "0")} actualizó su estado`,
          "info",
        );
      }
    };

    socket.on("connect", handleJoin);
    socket.on("pedido_actualizado", handleUpdated);

    return () => {
      isMounted = false;
      socket.off("connect", handleJoin);
      socket.off("pedido_actualizado", handleUpdated);
    };
  }, [
    isOpen,
    targetOrderId,
    isInspectingSpecificOrder,
    showToast,
    buildOrderHeaders,
    setActiveOrderId,
  ]);

  if (!isOpen) return null;

  const displayedPedido =
    pedido &&
    (isInspectingSpecificOrder ||
      !targetOrderId ||
      Number(pedido.id) === Number(targetOrderId))
      ? pedido
      : null;

  const handleRefresh = () => {
    if (targetOrderId) {
      fetchPedido(targetOrderId, true);
    }
  };

  const currentStep = getStepIndex(
    displayedPedido?.estado_local || displayedPedido?.estado,
  );
  const hero = getHeroStatusInfo(displayedPedido);
  const HeroIcon = hero.Icon;
  const items = Array.isArray(displayedPedido?.items)
    ? displayedPedido.items
    : [];
  const isPickup = displayedPedido?.tipo_entrega === "retiro_sucursal";
  const hasRealWeight =
    Number(
      displayedPedido?.monto_total_final || displayedPedido?.monto_final_real,
    ) > 0 || items.some((it) => Number(it.peso_real) > 0);
  const totalMostrar =
    Number(
      displayedPedido?.monto_total_final || displayedPedido?.monto_final_real,
    ) ||
    Number(displayedPedido?.monto_total_estimado) ||
    0;
  const costoEnvio = Number(displayedPedido?.costo_envio) || 0;
  const descuento = Number(displayedPedido?.descuento) || 0;
  const paymentLabel = formatPaymentLabel(
    displayedPedido?.medio_pago || displayedPedido?.metodo_pago,
  );

  const formattedOrderCode = displayedPedido?.id
    ? String(displayedPedido.id).padStart(4, "0")
    : targetOrderId
      ? String(targetOrderId).padStart(4, "0")
      : null;

  const fechaTicket = displayedPedido?.creado_en
    ? new Date(displayedPedido.creado_en).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const horaCreacion = displayedPedido?.creado_en
    ? new Date(displayedPedido.creado_en).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recibido";

  const horaActualizacion = displayedPedido?.actualizado_en
    ? new Date(displayedPedido.actualizado_en).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "En curso";

  const steps = [
    {
      num: 1,
      label: "Pedido aceptado",
      time: currentStep >= 1 ? horaCreacion : "Pendiente",
    },
    {
      num: 2,
      label: "Preparación en balanza",
      time:
        currentStep > 2
          ? horaActualizacion
          : currentStep === 2
            ? "Ahora"
            : "Pendiente",
    },
    {
      num: 3,
      label: isPickup ? "Listo para retirar" : "En camino a domicilio",
      time:
        currentStep > 3
          ? horaActualizacion
          : currentStep === 3
            ? "Ahora"
            : "Pendiente",
    },
    {
      num: 4,
      label: "Entregado",
      time: currentStep === 4 ? horaActualizacion : "Pendiente",
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-tracking-title"
    >
      <div
        ref={modalRef}
        className="bg-[#F6F8FA] w-full sm:max-w-md rounded-t-4xl sm:rounded-3xl shadow-2xl max-h-[90dvh] sm:max-h-[88dvh] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 flex flex-col overscroll-contain"
      >
        {/* Barra de título uniforme del modal (con soporte de arrastre) */}
        <div
          {...dragHandleProps}
          className="touch-none select-none shrink-0 bg-white px-5 sm:px-6 pt-3 pb-3 border-b border-slate-200/70"
        >
          <div className="w-11 h-1 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack || onClose}
              className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-2xs transition-colors"
              aria-label="Volver"
              title="Volver"
            >
              <ChevronLeft className="size-4 stroke-[2.25]" aria-hidden="true" />
            </button>

            <h1
              id="order-tracking-title"
              className="text-[15px] font-extrabold text-slate-900 tracking-tight font-num"
            >
              {formattedOrderCode
                ? `${isInspectingSpecificOrder ? "Pedido" : "Seguimiento"} #${formattedOrderCode}`
                : "Seguimiento en Vivo"}
            </h1>

            <div className="flex items-center gap-1.5">
              {targetOrderId && (
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-500 hover:bg-slate-100 hover:text-[#003366] flex items-center justify-center cursor-pointer shadow-2xs transition-colors"
                  aria-label="Actualizar estado"
                  title="Actualizar estado"
                >
                  <RotateCw
                    className={`size-3.5 stroke-[2.25] ${
                      isLoading ? "motion-safe:animate-spin" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-500 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-2xs transition-colors"
                aria-label="Cerrar"
                title="Cerrar"
              >
                <X className="size-4 stroke-[2.25]" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Cuerpo scrolleable con Ticket Digital de Compra */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 overscroll-contain">
          {isLoading && !displayedPedido ? (
            /* Skeleton limpio con forma de ticket */
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-native p-5 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-slate-200/80" />
                <div className="h-5 w-20 rounded-full bg-slate-100" />
              </div>
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-slate-200/80 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-44 rounded bg-slate-200/80" />
                  <div className="h-3 w-28 rounded bg-slate-100" />
                </div>
              </div>
              <div className="border-t border-dashed border-slate-200 pt-4 space-y-2.5">
                <div className="h-3.5 w-full rounded bg-slate-100" />
                <div className="h-3.5 w-5/6 rounded bg-slate-100" />
                <div className="h-6 w-1/2 rounded bg-slate-200/80 ml-auto mt-3" />
              </div>
            </div>
          ) : !displayedPedido ? (
            /* Estado vacío sobrio sin emojis */
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-8 text-center space-y-3 my-6">
              <div className="size-13 rounded-2xl bg-[#EFF4F9] text-[#003366] flex items-center justify-center mx-auto">
                <ReceiptText className="size-6 stroke-[1.9]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  Todavía no tenés un pedido en curso
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Cuando confirmes tu compra vas a ver acá el ticket digital y el
                  estado en tiempo real.
                </p>
              </div>
            </div>
          ) : (
            /* TICKET DIGITAL DE COMPRA */
            <article className="bg-white rounded-3xl border border-slate-200/90 shadow-native overflow-hidden">
              {/* 1. Cabecera del Ticket: Marca, Fecha y Comprobante */}
              <div className="px-5 pt-4 pb-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src="/favicon.svg"
                    alt="Abastecedora Valette"
                    className="size-7 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="block text-xs font-black text-slate-900 tracking-tight leading-tight truncate">
                      Abastecedora Valette
                    </span>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Ticket digital
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 font-num">
                  {fechaTicket && (
                    <span className="block text-[11px] font-bold text-slate-700 leading-tight">
                      {fechaTicket}
                    </span>
                  )}
                  <span className="block text-[10px] font-semibold text-slate-400">
                    {horaCreacion} hs
                  </span>
                </div>
              </div>

              {/* 2. Estado Principal + Metadatos Operativos (sin emojis ni dirección privada) */}
              <div className="px-5 py-4 space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-11 rounded-2xl border flex items-center justify-center shrink-0 ${hero.iconWrap}`}
                      aria-hidden="true"
                    >
                      <HeroIcon className="size-5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-black text-slate-900 tracking-tight leading-snug">
                        {hero.title}
                      </h2>
                      <p className="text-[11px] font-semibold text-slate-500 mt-0.5 font-num">
                        Comanda #{formattedOrderCode}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${hero.pillClass}`}
                  >
                    {hero.pill}
                  </span>
                </div>

                {/* Chips compactos de modalidad, pago y cortador */}
                <div className="grid grid-cols-1 gap-2 bg-slate-50/90 border border-slate-200/70 rounded-2xl p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                      {isPickup ? (
                        <Store
                          className="size-3.5 text-[#003366] shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <Truck
                          className="size-3.5 text-[#003366] shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span>Entrega</span>
                    </span>
                    <span className="font-bold text-slate-800 text-right truncate">
                      {isPickup
                        ? "Retiro · Sucursal Luis Guillón"
                        : "Envío a domicilio"}
                    </span>
                  </div>

                  {isPickup && (
                    <div className="text-[11px] text-slate-400 text-right -mt-1">
                      Av. Luciano Valette 1696, Luis Guillón
                    </div>
                  )}

                  {paymentLabel && (
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/60">
                      <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                        <CreditCard
                          className="size-3.5 text-slate-400 shrink-0"
                          aria-hidden="true"
                        />
                        <span>Pago</span>
                      </span>
                      <span className="font-bold text-slate-800">
                        {paymentLabel}
                      </span>
                    </div>
                  )}

                  {displayedPedido?.cortador_nombre && (
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/60">
                      <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                        <UserCheck
                          className="size-3.5 text-[#003366] shrink-0"
                          aria-hidden="true"
                        />
                        <span>Preparado por</span>
                      </span>
                      <span className="font-bold text-[#003366]">
                        {displayedPedido.cortador_apodo ||
                          displayedPedido.cortador_nombre}
                      </span>
                    </div>
                  )}

                  {displayedPedido?.notas && (
                    <div className="pt-1.5 border-t border-slate-200/60 text-[11px] text-slate-600 leading-relaxed">
                      <span className="font-bold text-slate-700">Nota: </span>
                      {displayedPedido.notas}
                    </div>
                  )}
                </div>

                {/* 3. Línea de Progreso Compacta (oculta si el pedido fue cancelado) */}
                {!hero.isCancelled && (
                  <div className="pt-1 space-y-2.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                      Progreso del pedido
                    </span>

                    <ol className="space-y-2.5 text-xs">
                      {steps.map((step) => {
                        const isCompleted =
                          currentStep > step.num || currentStep === 4;
                        const isCurrent =
                          currentStep === step.num && currentStep !== 4;
                        const isPending = currentStep < step.num;

                        return (
                          <li
                            key={step.num}
                            className={`flex items-center gap-3 ${
                              isPending ? "opacity-45" : ""
                            }`}
                          >
                            {isCompleted ? (
                              <span className="size-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <Check
                                  className="size-3 stroke-[3]"
                                  aria-hidden="true"
                                />
                              </span>
                            ) : isCurrent ? (
                              <span className="size-5 rounded-full bg-[#003366] text-white ring-4 ring-[#003366]/15 flex items-center justify-center shrink-0">
                                <span className="size-1.5 rounded-full bg-white" />
                              </span>
                            ) : (
                              <span className="size-5 rounded-full border-2 border-slate-300 bg-white shrink-0" />
                            )}

                            <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                              <span
                                className={
                                  isCurrent
                                    ? "font-extrabold text-[#003366]"
                                    : isCompleted
                                      ? "font-bold text-slate-800"
                                      : "font-medium text-slate-500"
                                }
                              >
                                {step.label}
                              </span>
                              <span
                                className={`text-[11px] font-num shrink-0 ${
                                  isCurrent
                                    ? "font-extrabold text-[#003366]"
                                    : "font-semibold text-slate-400"
                                }`}
                              >
                                {step.time}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </div>

              {/* 4. Troquelado clásico de Ticket (con muescas laterales limpias) */}
              <div className="relative flex items-center my-1" aria-hidden="true">
                <span className="size-5 rounded-full bg-[#F6F8FA] border border-slate-200/90 -ml-2.5 shrink-0" />
                <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-1" />
                <span className="size-5 rounded-full bg-[#F6F8FA] border border-slate-200/90 -mr-2.5 shrink-0" />
              </div>

              {/* 5. Detalle de Compra (Ítems + Pesaje + Totales) */}
              <div className="px-5 pt-3 pb-5 space-y-3">
                <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  <span>Detalle de compra</span>
                  <span>Importe</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {items.map((item, idx) => {
                    const pesoReal = Number(item.peso_real);
                    const cantSolicitada = Number(
                      item.cantidad_kg_solicitada || item.cantidad_kg || 1,
                    );
                    const unidad = item.unidad_medida || "kg";
                    const pesoMostrar =
                      pesoReal > 0 ? pesoReal : cantSolicitada;
                    const precioItem =
                      Number(item.precio_final) > 0
                        ? Number(item.precio_final)
                        : Number(item.precio_estimado) ||
                          Math.round(
                            pesoMostrar *
                              Number(
                                item.precio_por_kg_congelado ||
                                  item.precio_al_agregar ||
                                  0,
                              ),
                          );

                    return (
                      <div
                        key={item.id || idx}
                        className="flex justify-between items-start gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] font-num shrink-0">
                              {pesoMostrar} {unidad}
                            </span>
                            <span className="font-bold text-slate-800 truncate">
                              {item.nombre_producto || item.nombre}
                            </span>
                          </div>
                          {(item.opciones_corte_seleccionada ||
                            pesoReal > 0) && (
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5 pl-1 text-[10.5px] text-slate-400">
                              {item.opciones_corte_seleccionada && (
                                <span>{item.opciones_corte_seleccionada}</span>
                              )}
                              {pesoReal > 0 && (
                                <span className="text-emerald-700 font-semibold">
                                  {item.opciones_corte_seleccionada ? "· " : ""}
                                  Pesado en balanza
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <span className="font-bold text-[13px] text-slate-900 font-num shrink-0">
                          {formatPrecio(precioItem)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotales y Total del Ticket */}
                <div className="pt-3 border-t border-dashed border-slate-200 space-y-1.5 text-xs">
                  {costoEnvio > 0 && (
                    <div className="flex items-center justify-between text-slate-500 font-medium font-num">
                      <span>Envío</span>
                      <span>{formatPrecio(costoEnvio)}</span>
                    </div>
                  )}

                  {descuento > 0 && (
                    <div className="flex items-center justify-between text-emerald-700 font-bold font-num">
                      <span>Descuento</span>
                      <span>-{formatPrecio(descuento)}</span>
                    </div>
                  )}

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">
                        {hasRealWeight ? "Total final" : "Total estimado"}
                      </span>
                      <span className="text-[10.5px] font-medium text-slate-400">
                        {hasRealWeight
                          ? "Importe ajustado en balanza"
                          : "Sujeto a pesaje real en mostrador"}
                      </span>
                    </div>
                    <span className="text-xl font-black text-[#003366] font-num tracking-tight">
                      {formatPrecio(totalMostrar)}
                    </span>
                  </div>
                </div>

                {/* Pie discreto del comprobante */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                  <span>Sucursal Luis Guillón</span>
                  <span className="font-mono tracking-wider uppercase">
                    ORD-{formattedOrderCode}
                  </span>
                </div>
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingModal;
