// src/components/modals/OrderTrackingModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import { RotateCw, Check, ChevronLeft, X, Package } from "lucide-react";
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

  if (est.includes("cancelado")) {
    return {
      emoji: "⚠️",
      title: "Pedido cancelado",
      bg: "bg-rose-50 border-rose-200/80",
    };
  }
  if (est.includes("entregado") || est.includes("completado")) {
    return {
      emoji: "🎉",
      title: "Tu pedido fue entregado!",
      bg: "bg-emerald-50 border-emerald-200/80",
    };
  }
  if (est.includes("camino")) {
    return {
      emoji: "🛵",
      title: "Tu pedido está en camino!",
      bg: "bg-amber-50 border-amber-200/80",
    };
  }
  if (est.includes("listo") || est.includes("pesado")) {
    return {
      emoji: "📦",
      title: isPickup
        ? "Listo para retirar en sucursal!"
        : "Listo para despachar!",
      bg: "bg-emerald-50 border-emerald-200/80",
    };
  }
  if (est.includes("corte") || est.includes("preparacion")) {
    return {
      emoji: "🔪",
      title: "Pedido en preparación",
      bg: "bg-amber-50 border-amber-200/80",
    };
  }
  return {
    emoji: "🥩",
    title: "Recibimos tu pedido!",
    bg: "bg-blue-50 border-blue-200/80",
  };
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
  const targetOrderId = orderId || activeOrderId || activeFromHistory?.id || null;

  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    onBack || onClose,
  );

  const [pedido, setPedido] = useState(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(isOpen && targetOrderId));

  const buildOrderHeaders = useCallback(() => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (sesionId) headers["X-Sesion-Id"] = sesionId;
    return headers;
  }, [token, sesionId]);

  const fetchPedido = useCallback(
    async (orderId, showNotification = false) => {
      if (!orderId) return;
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/pedidos/${orderId}`, {
          headers: buildOrderHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setPedido(data);
          if (showNotification) {
            showToast(
              `Comanda #${data.id} sincronizada en tiempo real`,
              "info",
            );
          }
        } else if (showNotification) {
          showToast(`No se encontró el pedido #${orderId}`, "error");
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

  // Cargar pedido activo del usuario al abrir el modal y suscribir en Socket singleton
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
          `¡Tu pedido #${updated.id} actualizó su estado en vivo! 🥩`,
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
  const items = Array.isArray(displayedPedido?.items)
    ? displayedPedido.items
    : [];
  const isPickup = displayedPedido?.tipo_entrega === "retiro_sucursal";
  const hasRealWeight =
    Number(displayedPedido?.monto_total_final || displayedPedido?.monto_final_real) > 0 ||
    items.some((it) => Number(it.peso_real) > 0);
  const totalMostrar =
    Number(displayedPedido?.monto_total_final || displayedPedido?.monto_final_real) ||
    Number(displayedPedido?.monto_total_estimado) ||
    0;

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
      label: "1. Solicitud de pedido aceptada",
      time: currentStep >= 1 ? horaCreacion : "Pendiente",
    },
    {
      num: 2,
      label: "2. En preparación en balanza",
      time:
        currentStep > 2
          ? horaActualizacion
          : currentStep === 2
            ? "Ahora"
            : "Pendiente",
    },
    {
      num: 3,
      label: isPickup
        ? "3. Listo para retirar en sucursal"
        : "3. En camino hacia tu domicilio",
      time:
        currentStep > 3
          ? horaActualizacion
          : currentStep === 3
            ? "Ahora"
            : "Pendiente",
    },
    {
      num: 4,
      label: "4. Entregado",
      time: currentStep === 4 ? horaActualizacion : "Pendiente",
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white w-full sm:max-w-md rounded-t-4xl sm:rounded-3xl pb-6 shadow-2xl h-[80dvh] sm:max-h-[88dvh] overflow-y-auto scrollbar-none animate-in fade-in slide-in-from-bottom-4 duration-200 flex flex-col overscroll-contain"
      >
        {/* Header con soporte de arrastre */}
        <div
          {...dragHandleProps}
          className="touch-none select-none sticky top-0 bg-white z-10 shrink-0 px-6 pt-3.5 pb-3 border-b border-slate-200/60"
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack || onClose}
              className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer shadow-2xs transition-colors"
              aria-label="Volver"
              title="Volver"
            >
              <ChevronLeft className="size-4 stroke-[2.25]" />
            </button>
            <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight font-num">
              {displayedPedido?.id
                ? `${isInspectingSpecificOrder ? "Pedido" : "Seguimiento"} #${String(displayedPedido.id).padStart(4, "0")}`
                : targetOrderId
                  ? `${isInspectingSpecificOrder ? "Pedido" : "Seguimiento"} #${String(targetOrderId).padStart(4, "0")}`
                  : "Seguimiento en Vivo"}
            </h3>
            <div className="flex items-center gap-1.5">
              {targetOrderId && (
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-500 hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer shadow-2xs transition-colors"
                  aria-label="Actualizar estado"
                  title="Actualizar estado"
                >
                  <RotateCw
                    className={`size-3.5 stroke-[2.25] ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                </button>
              )}
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
        </div>

        <div className="flex flex-col size-full overflow-y-auto">
          {/* Estado vacío cuando el usuario no tiene un pedido propio activo */}
          {!displayedPedido && !isLoading ? (
            <div className="p-8 my-auto space-y-3 text-center">
              <div className="size-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Package className="size-7 stroke-[1.75]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">
                  Todavía no tenés un pedido en curso
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Acá vas a poder seguir el estado de tu pedido cuando confirmes
                  tu compra.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Tarjeta 3D de Estado */}
              <div className="flex items-center gap-4 p-6 border-b border-slate-100">
                <div
                  className={`size-16 rounded-2xl border flex items-center justify-center text-3xl shrink-0 shadow-2xs ${hero.bg}`}
                >
                  {hero.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    {hero.title}
                  </h3>
                  <p className="flex flex-col text-xs text-slate-500 mt-1 gap-0.5">
                    <span className="truncate">
                      <b>Modalidad:</b>{" "}
                      {isPickup
                        ? "Retiro en Sucursal Luis Guillón"
                        : "Envío a Domicilio"}
                    </span>
                    {isPickup && (
                      <span className="truncate text-[11px] text-slate-400">
                        Av. Luciano Valette 1696, Luis Guillón
                      </span>
                    )}
                    {pedido?.notas && (
                      <span className="line-clamp-2">
                        <b>Detalle:</b> {pedido.notas}
                      </span>
                    )}
                    {pedido?.cortador_nombre && (
                      <span className="text-[#003366] font-bold">
                        🥩 Preparado por:{" "}
                        {pedido.cortador_apodo || pedido.cortador_nombre}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Stepper en Tiempo Real con Checks Verdes */}
              <div className="py-4 space-y-4 px-6 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Estado de preparación y despacho (Luis Guillón)
                </span>

                {steps.map((step) => {
                  const isCompleted =
                    currentStep > step.num || currentStep === 4;
                  const isCurrent =
                    currentStep === step.num && currentStep !== 4;
                  const isPending = currentStep < step.num;

                  if (isCurrent) {
                    return (
                      <div key={step.num} className="flex items-center gap-3">
                        <div className="size-6 relative rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <div className="size-5 aspect-square bg-emerald-400/40 rounded-full animate-ping" />
                          <Check className="absolute inset-0 justify-self-center self-center size-3.5 stroke-[3]" />
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="font-bold text-emerald-600">
                            {step.label}
                          </span>
                          <span className="text-emerald-700 text-[11px] font-bold font-num">
                            {step.time}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  if (isCompleted) {
                    return (
                      <div key={step.num} className="flex items-center gap-3">
                        <div className="size-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <Check className="size-3.5 stroke-[3]" />
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="font-bold text-slate-800">
                            {step.label}
                          </span>
                          <span className="text-slate-400 text-[11px] font-num">
                            {step.time}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={step.num}
                      className={`flex items-center gap-3 ${
                        isPending ? "opacity-40" : ""
                      }`}
                    >
                      <div className="size-6 rounded-full border-2 border-slate-300 shrink-0" />
                      <div className="flex-1 flex justify-between">
                        <span className="text-slate-500">{step.label}</span>
                        <span className="text-slate-400 text-[11px]">
                          {step.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resumen de Pesaje Real en Balanza */}
              <div className="p-6 text-xs space-y-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[11px] text-slate-800 block">
                    Tus productos:
                  </span>
                </div>

                <div className="space-y-2 text-slate-600 pt-1">
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
                        className="flex justify-between items-start gap-2"
                      >
                        <div className="min-w-0">
                          <p className="flex items-center gap-2">
                            <span className="font-bold px-1.5 py-0.5 border border-slate-300 bg-white rounded text-[11px] font-num shrink-0">
                              {pesoMostrar} {unidad}
                            </span>
                            <span className="font-semibold text-slate-800 truncate">
                              {item.nombre_producto || item.nombre}
                            </span>
                          </p>
                          {item.opciones_corte_seleccionada && (
                            <span className="text-[10px] text-slate-400 block ml-12">
                              {item.opciones_corte_seleccionada}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-[13px] text-slate-900 font-num shrink-0">
                          {formatPrecio(precioItem)}
                        </span>
                      </div>
                    );
                  })}

                  <div className="flex justify-between font-extrabold text-sm text-[#003366] pt-2.5 border-t border-slate-200 font-num">
                    <span>
                      {hasRealWeight
                        ? "Total Final en Balanza:"
                        : "Total Estimado:"}
                    </span>
                    <span>{formatPrecio(totalMostrar)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingModal;
