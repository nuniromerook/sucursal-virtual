// src/components/modals/OrderTrackingModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import { RotateCw, Check, ChevronLeft, X, Search } from "lucide-react";
import { io } from "socket.io-client";
import { useToast } from "@/context/ToastContext";
import { useCart } from "@/context/CartContext";
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

export const OrderTrackingModal = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const { activeOrderId, setActiveOrderId } = useCart();
  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    onClose,
  );

  const [pedido, setPedido] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lookupInput, setLookupInput] = useState("");

  const fetchPedido = useCallback(
    async (orderId, showNotification = false) => {
      if (!orderId) return;
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/pedidos/${orderId}`);
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
    [showToast],
  );

  // Cargar pedido activo al abrir el modal y conectar Socket.io en tiempo real
  useEffect(() => {
    if (!isOpen || !activeOrderId) return;

    let isMounted = true;
    const loadOrder = async () => {
      try {
        const res = await fetch(`${API_URL}/pedidos/${activeOrderId}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setPedido(data);
        }
      } catch {}
    };
    loadOrder();

    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      socket.emit("join_pedido", activeOrderId);
    });

    socket.on("pedido_actualizado", (updated) => {
      if (
        isMounted &&
        updated &&
        Number(updated.id) === Number(activeOrderId)
      ) {
        setPedido(updated);
        showToast(
          `¡Tu pedido #${updated.id} actualizó su estado en vivo! 🥩`,
          "info",
        );
      }
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, [isOpen, activeOrderId, showToast]);

  if (!isOpen) return null;

  const handleRefresh = () => {
    if (activeOrderId) {
      fetchPedido(activeOrderId, true);
    } else {
      showToast("Ingresá tu número de pedido para consultar", "info");
    }
  };

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    const cleanId = Number(String(lookupInput).replace(/\D/g, ""));
    if (!cleanId) return;
    setActiveOrderId(cleanId);
    fetchPedido(cleanId, true);
  };

  const currentStep = getStepIndex(pedido?.estado_local || pedido?.estado);
  const hero = getHeroStatusInfo(pedido);
  const items = Array.isArray(pedido?.items) ? pedido.items : [];
  const isPickup = pedido?.tipo_entrega === "retiro_sucursal";
  const hasRealWeight =
    Number(pedido?.monto_total_final || pedido?.monto_final_real) > 0 ||
    items.some((it) => Number(it.peso_real) > 0);
  const totalMostrar =
    Number(pedido?.monto_total_final || pedido?.monto_final_real) ||
    Number(pedido?.monto_total_estimado) ||
    0;

  const horaCreacion = pedido?.creado_en
    ? new Date(pedido.creado_en).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recibido";

  const horaActualizacion = pedido?.actualizado_en
    ? new Date(pedido.actualizado_en).toLocaleTimeString("es-AR", {
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
        className="bg-white w-full sm:max-w-md rounded-t-4xl sm:rounded-3xl pb-6 shadow-2xl h-[80vh] sm:max-h-[88vh] overflow-y-auto scrollbar-none animate-in fade-in slide-in-from-bottom-4 duration-200 flex flex-col"
      >
        {/* Header con soporte de arrastre */}
        <div
          {...dragHandleProps}
          className="flex flex-col w-full bg-white touch-none select-none shrink-0"
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-4 mb-0 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />

          <div className="flex items-center justify-between pb-3 pt-6 border-b border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="size-8 ml-6 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
              title="Volver"
            >
              <ChevronLeft className="size-4 stroke-[2.5]" />
            </button>
            <span className="font-extrabold text-sm text-slate-800 pl-4 font-num">
              {pedido?.id
                ? `Seguimiento #${String(pedido.id).padStart(4, "0")}`
                : activeOrderId
                  ? `Seguimiento #${String(activeOrderId).padStart(4, "0")}`
                  : "Seguimiento en Vivo"}
            </span>
            <div className="flex items-center gap-1 mr-6">
              <button
                type="button"
                onClick={handleRefresh}
                className="size-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
                title="Actualizar estado"
              >
                <RotateCw
                  className={`size-3.5 stroke-[2.5] ${
                    isLoading ? "animate-spin" : ""
                  }`}
                />
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

        <div className="flex flex-col size-full overflow-y-auto">
          {/* Buscador rápido de otro número de pedido */}
          {!pedido && !isLoading ? (
            <div className="p-6 space-y-4 text-center">
              <div className="size-16 rounded-2xl bg-slate-100 text-3xl flex items-center justify-center mx-auto">
                🥩
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Consultá tu pedido en tiempo real
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ingresá el número de comanda para ver el estado en mostrador y
                  el ticket de balanza.
                </p>
              </div>
              <form
                onSubmit={handleLookupSubmit}
                className="flex items-center gap-2 pt-2"
              >
                <input
                  type="text"
                  value={lookupInput}
                  onChange={(e) => setLookupInput(e.target.value)}
                  placeholder="Ej: 15"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold outline-none focus:bg-white focus:border-[#003366]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#003366] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="size-3.5" />
                  <span>Buscar</span>
                </button>
              </form>
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
                      <b>{isPickup ? "Sucursal:" : "Dirección:"}</b>{" "}
                      {pedido?.direccion_entrega ||
                        "Av. Luciano Valette 1696, Luis Guillón"}
                    </span>
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
