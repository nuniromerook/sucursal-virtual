// frontend/src/pages/ecommerce/OrderSuccess.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  Store,
  Truck,
  ArrowRight,
  Phone,
  MessageCircle,
  Clock,
  Sparkles,
  MapPin,
  FileText,
} from "lucide-react";
import { API_URL } from "../../config/api";
import { formatPrecio, formatCantidad } from "../../utils/formatters";

export default function OrderSuccess() {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPedido = async () => {
      try {
        const res = await fetch(`${API_URL}/pedidos/${id}`);
        if (!res.ok) throw new Error("Pedido no encontrado");
        const data = await res.json();
        setPedido(data);
      } catch (err) {
        console.error("Error al cargar pedido:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchPedido();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="size-16 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-neutral-900 mb-2">
          No pudimos encontrar el pedido #{id}
        </h2>
        <p className="text-neutral-500 mb-6">
          Verificá el enlace o contactate con nosotros por WhatsApp.
        </p>
        <Link
          to="/"
          className="px-6 py-2.5 rounded-lg bg-main-blue text-white font-semibold text-sm"
        >
          Volver a la tienda
        </Link>
      </div>
    );
  }

  // Generar link de WhatsApp para la sucursal
  const sucursalTel = (pedido.sucursal_telefono || "1123456789").replace(/\D/g, "");
  const mensajeWhatsApp = encodeURIComponent(
    `¡Hola Abastecedora Valette! 👋 Realicé el pedido #${pedido.id} a nombre de ${pedido.cliente_nombre}. ` +
      `Monto estimado: ${formatPrecio(pedido.monto_total_estimado)}. ` +
      `Tipo de entrega: ${pedido.tipo_entrega === "retiro_sucursal" ? "Retiro en sucursal" : "Envío a domicilio"}.`
  );
  const whatsappUrl = `https://wa.me/549${sucursalTel}?text=${mensajeWhatsApp}`;

  return (
    <div className="w-full bg-neutral-50 min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Tarjeta de Confirmación */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm text-center space-y-6">
          <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-in zoom-in">
            <CheckCircle2 className="size-9" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Pedido Recibido con Éxito
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-3">
              ¡Muchas gracias por tu compra!
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Número de orden: <strong className="text-neutral-900">#{pedido.id}</strong>
            </p>
          </div>

          {/* Información de preparación y entrega */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-left space-y-3">
            <div className="flex items-center gap-2 text-main-blue font-bold text-sm">
              {pedido.tipo_entrega === "retiro_sucursal" ? (
                <>
                  <Store className="size-5 shrink-0" />
                  <span>Retiro en Sucursal Valette</span>
                </>
              ) : (
                <>
                  <Truck className="size-5 shrink-0" />
                  <span>Envío a Domicilio ({pedido.tipo_entrega === "pedidosya" ? "PedidosYa Envíos" : "Logística Valette"})</span>
                </>
              )}
            </div>

            {pedido.tipo_entrega === "retiro_sucursal" ? (
              <div className="text-xs text-neutral-700 space-y-1">
                <p>
                  <strong>Sucursal:</strong> {pedido.sucursal_nombre} ({pedido.sucursal_ciudad})
                </p>
                <p>
                  <strong>Dirección:</strong> {pedido.sucursal_direccion}
                </p>
                {pedido.sucursal_horario && (
                  <p>
                    <strong>Horario de atención:</strong> {pedido.sucursal_horario}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-xs text-neutral-700 space-y-1">
                <p>
                  <strong>Dirección de entrega:</strong> {pedido.direccion_entrega}
                </p>
                <p>
                  <strong>Sucursal de despacho:</strong> {pedido.sucursal_nombre} ({pedido.sucursal_direccion})
                </p>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-neutral-500 pt-1 border-t border-blue-100">
              <Clock className="size-3.5 text-main-blue" />
              <span>
                Estado actual: <strong className="capitalize text-neutral-800">{pedido.estado_local}</strong>
              </span>
            </div>
          </div>

          {/* Desglose de Items */}
          <div className="border-t border-neutral-100 pt-5 text-left">
            <h2 className="text-sm font-bold text-neutral-900 mb-3">
              Detalle de los cortes solicitados:
            </h2>
            <div className="divide-y divide-neutral-100">
              {(pedido.items || []).map((item) => (
                <div
                  key={item.id}
                  className="py-2.5 flex items-center justify-between text-xs text-neutral-800"
                >
                  <div>
                    <p className="font-semibold">{item.nombre_producto}</p>
                    <p className="text-neutral-500">
                      {formatCantidad(item.cantidad_kg_solicitada, item.unidad_medida || "kg")} • {formatPrecio(item.precio_por_kg_congelado)}/kg
                    </p>
                  </div>
                  <span className="font-bold">{formatPrecio(item.precio_estimado)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 mt-3 border-t border-neutral-200 flex justify-between items-center">
              <span className="text-sm font-bold text-neutral-900">Total Estimado</span>
              <span className="text-lg font-extrabold text-main-blue">
                {formatPrecio(pedido.monto_total_estimado)}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageCircle className="size-5" />
              <span>Enviar WhatsApp a la Sucursal</span>
            </a>

            <Link
              to="/"
              className="py-3 px-6 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-sm transition-all text-center"
            >
              Volver al Catálogo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
