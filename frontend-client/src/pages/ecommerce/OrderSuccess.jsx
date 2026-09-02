// frontend-client/src/pages/ecommerce/OrderSuccess.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  Store,
  Truck,
  MessageCircle,
  Clock,
  Package,
  Scissors,
  Scale,
  Sparkles,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { VITE_API_URL } from "../../config/api";
import {
  formatPrecio,
  formatCantidad,
  formatPrecioPorUnidad,
} from "../../utils/formatters";
import NotFound from "../NotFound";

export default function OrderSuccess() {
  const { id } = useParams();
  const { user, token, isAuthenticated } = useAuth();
  const { socket } = useSocket();

  const [pedido, setPedido] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState(null); // null | "not_found" | "unauthorized" | "unauthenticated"

  const fetchPedido = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${VITE_API_URL}/pedidos/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        setErrorType("not_found");
        return;
      }

      const data = await res.json();

      // 1. Verificar si hay sesión activa
      if (!isAuthenticated || !user) {
        setErrorType("unauthenticated");
        return;
      }

      // 2. Verificar coincidencia del titular del pedido
      if (
        data.cliente_id &&
        user.id &&
        Number(data.cliente_id) !== Number(user.id)
      ) {
        setErrorType("unauthorized");
        return;
      }

      setPedido(data);
      setErrorType(null);
    } catch (err) {
      console.error("Error al cargar pedido:", err);
      setErrorType("not_found");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPedido();
    }
  }, [id, user, token, isAuthenticated]);

  // Escuchar actualización en vivo de este pedido específico por WebSockets
  useEffect(() => {
    if (!socket) return;

    const handlePedidoActualizado = (pedidoActualizado) => {
      if (Number(pedidoActualizado.id) === Number(id)) {
        console.log(
          "⚡ [OrderSuccess] Pedido actualizado en vivo:",
          pedidoActualizado,
        );
        setPedido((prev) => ({
          ...prev,
          ...pedidoActualizado,
        }));
      }
    };

    socket.on("pedido_actualizado", handlePedidoActualizado);

    return () => {
      socket.off("pedido_actualizado", handlePedidoActualizado);
    };
  }, [socket, id]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="size-14 bg-neutral-200 rounded-full mx-auto mb-4" />
        <div className="h-6 bg-neutral-200 rounded w-1/2 mx-auto mb-2" />
        <div className="h-4 bg-neutral-200 rounded w-1/3 mx-auto" />
      </div>
    );
  }

  // 1. Caso no autenticado
  if (errorType === "unauthenticated") {
    return (
      <NotFound
        title="Acceso restringido al comprobante"
        message="Debés iniciar sesión con tu cuenta para visualizar el comprobante de este pedido."
        showHomeButton={true}
        showProfileButton={false}
      />
    );
  }

  // 2. Caso no autorizado
  if (errorType === "unauthorized") {
    return (
      <NotFound
        title="Comprobante no disponible"
        message="El pedido que intentás consultar pertenece a otra cuenta de usuario o no tenés permisos para visualizarlo."
        showHomeButton={true}
        showProfileButton={true}
      />
    );
  }

  // 3. Caso no encontrado
  if (errorType === "not_found" || !pedido) {
    return (
      <NotFound
        title="Pedido no encontrado"
        message={`No pudimos encontrar el comprobante para la orden #${id}. Verificá el número de pedido o consultá desde tu historial de compras.`}
        showHomeButton={true}
        showProfileButton={true}
      />
    );
  }

  // Determinar etapa del stepper según estado operativo
  const estadoActual = (
    pedido.estado_local ||
    pedido.estado ||
    "solicitado"
  ).toLowerCase();
  const isCancelado =
    estadoActual.includes("cancelado") || estadoActual.includes("rechazado");

  let stepActual = 1;
  if (estadoActual.includes("corte") || estadoActual.includes("preparacion")) {
    stepActual = 2;
  } else if (
    estadoActual.includes("pesado") ||
    estadoActual.includes("listo") ||
    estadoActual.includes("camino")
  ) {
    stepActual = 3;
  } else if (
    estadoActual.includes("entregado") ||
    estadoActual.includes("completado")
  ) {
    stepActual = 4;
  }

  const sucursalTel = (pedido.sucursal_telefono || "1123456789").replace(
    /\D/g,
    "",
  );
  const mensajeWhatsApp = encodeURIComponent(
    `¡Hola Abastecedora Valette! 👋 Consulto por mi pedido #${pedido.id} a nombre de ${pedido.cliente_nombre}. ` +
      `Estado actual: ${estadoActual}.`,
  );
  const whatsappUrl = `https://wa.me/549${sucursalTel}?text=${mensajeWhatsApp}`;

  return (
    <div className="w-full min-h-screen py-8 sm:py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* ─── Tarjeta de Comprobante y Seguimiento en Vivo ─── */}
        <div className="bg-white rounded-lg p-5 sm:p-7 border border-neutral-200/80 shadow-2xs space-y-6">
          {/* Cabecera del comprobante */}
          <div className="text-center space-y-2 pb-2">
            <div
              className={`size-14 rounded-full flex items-center justify-center mx-auto shadow-2xs border ${
                isCancelado
                  ? "bg-red-50 text-red-600 border-red-200"
                  : stepActual === 4
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-blue-50 text-main-blue border-blue-200"
              }`}
            >
              {isCancelado ? (
                <AlertTriangle className="size-7" />
              ) : stepActual === 4 ? (
                <CheckCircle2 className="size-8" />
              ) : (
                <Package className="size-7" />
              )}
            </div>

            <div className="pt-1">
              <span
                className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                  isCancelado
                    ? "bg-red-50 text-red-800 border-red-200"
                    : stepActual === 4
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-blue-50 text-blue-800 border-blue-200"
                }`}
              >
                {isCancelado
                  ? "Pedido Cancelado"
                  : stepActual === 4
                    ? "Pedido Entregado"
                    : "Seguimiento en Vivo"}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight mt-2">
                {isCancelado
                  ? "Tu pedido no pudo completarse"
                  : stepActual === 4
                    ? "¡Pedido completado con éxito!"
                    : "¡Estamos preparando tu pedido!"}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                Número de orden:{" "}
                <strong className="text-main-blue font-black">
                  #{pedido.id}
                </strong>
              </p>
            </div>
          </div>

          {/* ─── Stepper de Seguimiento en Vivo ─── */}
          {!isCancelado && (
            <div className="p-4 sm:p-5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-neutral-600">
                  Estado del Pedido
                </span>
                {stepActual === 4 ? (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    Completado
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-main-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-2">
                    <span className="size-1 rounded-full bg-main-blue animate-ping" />
                    En vivo
                  </span>
                )}
              </div>

              {/* Barra y Pasos */}
              <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                {/* Paso 1 */}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`size-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      stepActual >= 1
                        ? "bg-main-blue text-white shadow-2xs"
                        : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    <CheckCircle2 className="size-4" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-neutral-800 leading-tight">
                    Solicitado
                  </span>
                </div>

                {/* Paso 2 */}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`size-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      stepActual >= 2
                        ? "bg-main-blue text-white shadow-2xs"
                        : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    <Scissors className="size-4" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-neutral-800 leading-tight">
                    En corte
                  </span>
                </div>

                {/* Paso 3 */}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`size-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      stepActual >= 3
                        ? "bg-main-blue text-white shadow-2xs"
                        : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    {pedido.tipo_entrega === "retiro_sucursal" ? (
                      <Store className="size-4" />
                    ) : (
                      <Truck className="size-4" />
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-neutral-800 leading-tight">
                    {pedido.tipo_entrega === "retiro_sucursal"
                      ? "Listo retiro"
                      : "En camino"}
                  </span>
                </div>

                {/* Paso 4 */}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`size-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      stepActual >= 4
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    <Sparkles className="size-4" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-neutral-800 leading-tight">
                    Entregado
                  </span>
                </div>
              </div>

              {/* ─── Descripción detallada de la etapa actual ─── */}
              <div className="pt-2.5 border-t border-neutral-200/60 text-xs text-neutral-600 flex flex-col items-start gap-1 bg-white/70 p-3 rounded-lg">
                <span className="font-bold text-neutral-900 shrink-0">
                  {stepActual === 1 && "1. Pedido Solicitado:"}
                  {stepActual === 2 && "2. Fraccionamiento en Curso:"}
                  {stepActual === 3 &&
                    (pedido.tipo_entrega === "retiro_sucursal"
                      ? "3. Listo en Mostrador:"
                      : "3. En Tránsito:")}
                  {stepActual === 4 && "4. Entrega Finalizada:"}
                </span>
                <p className="leading-relaxed">
                  {stepActual === 1 &&
                    "Recibimos tu orden en la sucursal y está lista para ser asignada al sector de carnicería."}
                  {stepActual === 2 &&
                    "Nuestros carniceros están seleccionando los cortes frescos, realizando el fraccionamiento artesanal y el pesaje final."}
                  {stepActual === 3 &&
                    (pedido.tipo_entrega === "retiro_sucursal"
                      ? "Tus cortes ya fueron pesados, envasados y refrigerados. Podés acercarte a la sucursal a retirar tu compra."
                      : "Tus cortes fueron empaquetados y el cadete ya está en camino a tu domicilio.")}
                  {stepActual === 4 &&
                    "¡Pedido entregado con éxito! Que disfrutes tus cortes y muchas gracias por elegir Abastecedora Valette."}
                </p>
              </div>
            </div>
          )}

          {/* Banner de Cancelación si aplica */}
          {isCancelado && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
              <p className="font-bold">Motivo de cancelación:</p>
              <p>{pedido.notas || "La sucursal no pudo procesar la orden."}</p>
            </div>
          )}

          {/* Módulo de Logística y Entrega */}
          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200/80 space-y-2.5 text-left">
            <div className="flex items-center gap-2 text-main-blue font-bold text-xs sm:text-sm pb-1.5 border-b border-neutral-200/60">
              {pedido.tipo_entrega === "retiro_sucursal" ? (
                <>
                  <Store className="size-4.5 shrink-0" />
                  <span>Retiro en Sucursal Valette</span>
                </>
              ) : (
                <>
                  <Truck className="size-4.5 shrink-0" />
                  <span>
                    Envío a Domicilio (
                    {pedido.tipo_entrega === "pedidosya"
                      ? "PedidosYa Envíos"
                      : "Logística Propia Valette"}
                    )
                  </span>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-neutral-400 block font-medium">
                  Sucursal asignada:
                </span>
                <span className="font-bold text-neutral-800">
                  {pedido.sucursal_nombre} ({pedido.sucursal_direccion})
                </span>
              </div>

              {pedido.tipo_entrega !== "retiro_sucursal" && (
                <div>
                  <span className="text-neutral-400 block font-medium">
                    Dirección de entrega:
                  </span>
                  <span className="font-bold text-neutral-800">
                    {pedido.direccion_entrega || "A coordinar"}
                  </span>
                </div>
              )}

              <div>
                <span className="text-neutral-400 block font-medium">
                  Medio de pago:
                </span>
                <span className="font-bold text-neutral-800 capitalize">
                  {pedido.medio_pago
                    ? pedido.medio_pago.replace("_", " ")
                    : "Efectivo"}
                </span>
              </div>

              <div>
                <span className="text-neutral-400 block font-medium">
                  Fecha y Hora:
                </span>
                <span className="font-bold text-neutral-800">
                  {new Date(pedido.creado_en || Date.now()).toLocaleDateString(
                    "es-AR",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Detalle de Cortes Solicitados ─── */}
          <div className="space-y-3 text-left">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-100 pb-2">
              Desglose de Cortes (
              {Array.isArray(pedido.items) ? pedido.items.length : 0})
            </h2>

            <div className="divide-y divide-neutral-100">
              {(pedido.items || []).map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3 text-neutral-900"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm sm:text-base text-neutral-900 truncate">
                      {item.nombre_producto}
                    </p>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {formatCantidad(
                        item.cantidad_kg_solicitada,
                        item.unidad_medida || "kg",
                      )}{" "}
                      --{" "}
                      {formatPrecioPorUnidad(
                        item.precio_por_kg_congelado,
                        item.unidad_medida || "kg",
                      )}
                    </p>
                  </div>
                  <span className="font-black text-sm sm:text-base text-neutral-900 shrink-0">
                    {formatPrecio(item.precio_estimado)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total estimado / final */}
            <div className="pt-3.5 mt-2 border-t border-neutral-200 flex justify-between items-baseline">
              <div>
                <span className="font-black text-base sm:text-lg text-neutral-900">
                  Total
                </span>
              </div>
              <span className="font-black text-xl sm:text-2xl text-main-blue">
                {formatPrecio(
                  pedido.monto_total_final || pedido.monto_total_estimado,
                )}
              </span>
            </div>
          </div>

          {/* ─── Botones de Acción ─── */}
          <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              <MessageCircle className="size-4" />
              <span>Contactar Sucursal por WhatsApp</span>
            </a>

            <Link
              to="/perfil?tab=compras"
              className="w-full sm:w-auto py-3 px-5 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>Ver mis compras</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
