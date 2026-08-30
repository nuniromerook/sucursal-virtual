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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../config/api";
import { formatPrecio, formatCantidad, formatPrecioPorUnidad } from "../../utils/formatters";
import NotFound from "../NotFound";

export default function OrderSuccess() {
  const { id } = useParams();
  const { user, token, isAuthenticated } = useAuth();

  const [pedido, setPedido] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState(null); // null | "not_found" | "unauthorized" | "unauthenticated"

  useEffect(() => {
    const fetchPedido = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/pedidos/${id}`, {
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
        if (data.cliente_id && user.id && Number(data.cliente_id) !== Number(user.id)) {
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

    if (id) {
      fetchPedido();
    }
  }, [id, user, token, isAuthenticated]);

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

  // 2. Caso no autorizado (el pedido pertenece a otro usuario)
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

  const sucursalTel = (pedido.sucursal_telefono || "1123456789").replace(/\D/g, "");
  const mensajeWhatsApp = encodeURIComponent(
    `¡Hola Abastecedora Valette! 👋 Realicé el pedido #${pedido.id} a nombre de ${pedido.cliente_nombre}. ` +
      `Monto estimado: ${formatPrecio(pedido.monto_total_estimado)}. ` +
      `Tipo de entrega: ${pedido.tipo_entrega === "retiro_sucursal" ? "Retiro en sucursal" : "Envío a domicilio"}.`
  );
  const whatsappUrl = `https://wa.me/549${sucursalTel}?text=${mensajeWhatsApp}`;

  return (
    <div className="w-full min-h-screen py-8 sm:py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* ─── Tarjeta de Comprobante / Confirmación ─── */}
        <div className="bg-white rounded-lg p-5 sm:p-7 border border-neutral-200/80 shadow-2xs space-y-6">
          
          {/* Cabecera del comprobante */}
          <div className="text-center space-y-2 pb-2">
            <div className="size-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="size-8" />
            </div>

            <div className="pt-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                Pedido Recibido con Éxito
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight mt-2">
                ¡Muchas gracias por tu compra!
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                Número de orden: <strong className="text-main-blue font-black">#{pedido.id}</strong>
              </p>
            </div>
          </div>

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
                  <span>Envío a Domicilio ({pedido.tipo_entrega === "pedidosya" ? "PedidosYa Envíos" : "Logística Propia Valette"})</span>
                </>
              )}
            </div>

            {pedido.tipo_entrega === "retiro_sucursal" ? (
              <div className="text-xs text-neutral-700 space-y-1">
                <p>
                  <strong className="text-neutral-900">Sucursal:</strong> {pedido.sucursal_nombre} ({pedido.sucursal_ciudad})
                </p>
                <p>
                  <strong className="text-neutral-900">Dirección:</strong> {pedido.sucursal_direccion}
                </p>
                {pedido.sucursal_horario && (
                  <p className="text-neutral-500">
                    <strong>Horario:</strong> {pedido.sucursal_horario}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-xs text-neutral-700 space-y-1">
                <p>
                  <strong className="text-neutral-900">Dirección de entrega:</strong> {pedido.direccion_entrega}
                </p>
                <p className="text-neutral-500">
                  <strong>Sucursal de despacho:</strong> {pedido.sucursal_nombre} ({pedido.sucursal_direccion})
                </p>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-neutral-500 pt-1.5 border-t border-neutral-200/60">
              <Clock className="size-3.5 text-main-blue" />
              <span>
                Estado: <strong className="capitalize text-neutral-900">{pedido.estado_local || "solicitado"}</strong>
              </span>
            </div>
          </div>

          {/* Desglose de Cortes Solicitados */}
          <div className="border-t border-neutral-100 pt-4 text-left">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
              <Package className="size-4 text-main-blue" />
              <span>Detalle de los cortes solicitados</span>
            </h2>

            <div className="divide-y divide-neutral-100">
              {(pedido.items || []).map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3 text-neutral-900"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
                      {item.nombre_producto}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {formatCantidad(item.cantidad_kg_solicitada, item.unidad_medida || "kg")} • {formatPrecioPorUnidad(item.precio_por_kg_congelado, item.unidad_medida || "kg")}
                    </p>
                  </div>
                  <span className="font-black text-xs sm:text-sm text-neutral-900 shrink-0">
                    {formatPrecio(item.precio_estimado)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total estimado */}
            <div className="pt-3.5 mt-2 border-t border-neutral-200 flex justify-between items-baseline">
              <div>
                <span className="text-xs sm:text-sm font-bold text-neutral-700">Total Estimado</span>
                <p className="text-[11px] text-neutral-400">* Se confirma con exactitud de balanza al fraccionar</p>
              </div>
              <span className="text-lg sm:text-xl font-black text-main-blue">
                {formatPrecio(pedido.monto_total_estimado)}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageCircle className="size-4" />
              <span>Avisar por WhatsApp a la Sucursal</span>
            </a>

            <Link
              to="/perfil?tab=pedidos"
              className="py-2.5 px-4 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs transition-all text-center cursor-pointer"
            >
              Ver mis compras
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
