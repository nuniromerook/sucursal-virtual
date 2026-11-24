// admin/src/components/kds/ComandaCard.jsx
import { useState } from "react";
import {
  Scissors,
  Scale,
  CheckCircle2,
  Truck,
  Store,
  ArrowRight,
  MapPin,
  XCircle,
  UserCheck,
} from "lucide-react";
import { formatMoney, formatWeight, formatDate } from "../../utils/formatters";

export default function ComandaCard({
  pedido,
  cortadores = [],
  canSeePrivateData = false,
  onOpenPesaje,
  onChangeStatus,
  onAssignCortador,
  onCancelOrder,
}) {
  const [showCancelBox, setShowCancelBox] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const estado = pedido.estado || pedido.estado_local || "solicitado";
  const items = Array.isArray(pedido.items) ? pedido.items : [];
  const isRetiro =
    pedido.tipo_entrega === "retiro_sucursal" ||
    pedido.tipo_entrega === "retiro" ||
    pedido.tipo === "Retiro en Sucursal";
  const clienteNombre =
    pedido.cliente_nombre ||
    pedido.nombre_cliente ||
    pedido.cliente ||
    "Cliente Web";
  const totalPedido =
    Number(pedido.monto_total_final) ||
    Number(pedido.monto_final_real) ||
    Number(pedido.monto_total_estimado) ||
    Number(pedido.total) ||
    Number(pedido.total_estimado) ||
    0;

  let statusBadge;
  if (estado === "solicitado") {
    statusBadge = (
      <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
        1. SOLICITADO
      </span>
    );
  } else if (estado === "en_corte") {
    statusBadge = (
      <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-bold px-2 py-0.5 rounded">
        2. EN CORTE
      </span>
    );
  } else if (estado === "listo") {
    statusBadge = (
      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
        3. LISTO
      </span>
    );
  } else if (estado === "cancelado") {
    statusBadge = (
      <span className="bg-rose-100 text-rose-700 border border-rose-300 text-[10px] font-bold px-2 py-0.5 rounded">
        CANCELADO
      </span>
    );
  } else {
    statusBadge = (
      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">
        {estado.toUpperCase()}
      </span>
    );
  }

  const isActiveOrder = estado !== "entregado" && estado !== "cancelado";

  return (
    <div
      className={`bg-white rounded-2xl border shadow-xs overflow-hidden flex flex-col ${
        estado === "solicitado"
          ? "border-amber-300 ring-2 ring-amber-300/40"
          : estado === "en_corte"
            ? "border-blue-300 ring-1 ring-blue-300/50"
            : estado === "cancelado"
              ? "border-rose-200 opacity-75"
              : "border-slate-200/80"
      }`}
    >
      {/* Cabecera de Comanda */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-900 text-sm">
              #{pedido.id}
            </span>
            {(pedido.creado_en || pedido.fecha) && (
              <span className="text-xs text-slate-500">
                • {formatDate(pedido.creado_en || pedido.fecha)}
              </span>
            )}
          </div>
          <div className="font-semibold text-slate-800 text-xs mt-0.5 truncate">
            {clienteNombre}
            {canSeePrivateData && pedido.cliente_telefono ? (
              <span className="text-[11px] font-normal text-slate-500 ml-1.5 font-mono">
                ({pedido.cliente_telefono})
              </span>
            ) : null}
          </div>
        </div>
        <div className="shrink-0">{statusBadge}</div>
      </div>

      {/* Items del Pedido */}
      <div className="p-3.5 space-y-3 flex-1 text-xs">
        {/* Dirección privada visible EXCLUSIVAMENTE a Propietario / Admin / Encargado */}
        {canSeePrivateData && !isRetiro && pedido.direccion_entrega && (
          <div className="text-[11px] text-slate-800 bg-slate-100/90 p-2 rounded-lg border border-slate-200 flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#002244] shrink-0 mt-0.5" />
            <span>
              <b>Entrega:</b> {pedido.direccion_entrega}
            </span>
          </div>
        )}

        {pedido.notas ? (
          <div className="text-[11px] text-amber-900 bg-amber-50/90 p-2 rounded-lg border border-amber-200/70 font-medium">
            <b>Observaciones:</b> {pedido.notas}
          </div>
        ) : null}

        {/* Asignar Cortador */}
        {cortadores.length > 0 && isActiveOrder && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[#002244] shrink-0" />
            <span className="text-[11px] font-bold text-slate-600 shrink-0">
              Cortador:
            </span>
            <select
              value={pedido.cortador_id || ""}
              onChange={(e) => {
                if (e.target.value) {
                  onAssignCortador?.(pedido.id, e.target.value);
                }
              }}
              className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="">Sin asignar</option>
              {cortadores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.apodo || c.nombre} ({c.pedidos_en_corte || 0} en corte)
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Cortes solicitados por el cliente:
        </div>

        {items.map((it, idx) => {
          const prep =
            it.opciones_corte_seleccionada ||
            it.opcion_corte ||
            it.preparacion_seleccionada ||
            it.corte;
          const nota = it.notas || it.nota_cliente || it.observaciones;
          const unit = it.unidad_medida || it.unidad || "kg";
          const cant =
            it.cantidad_kg_solicitada ||
            it.cantidad_kg ||
            it.cantidad_pedida ||
            1;
          const pesoReal = it.peso_real;

          return (
            <div
              key={idx}
              className="p-2.5 rounded bg-slate-50/80 border border-slate-200/90 space-y-1"
            >
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>{it.nombre_producto || it.nombre}</span>
                <span className="text-brand-crimson font-mono">
                  {formatWeight(cant, unit)}
                </span>
              </div>

              {prep ? (
                <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-[11px] bg-blue-50/80 px-2 py-1 rounded border border-blue-200/80">
                  <Scissors className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span>Preparación:</span>
                  <strong className="uppercase text-blue-800">{prep}</strong>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 italic">
                  Sin corte especial requerido
                </div>
              )}

              {nota ? (
                <div className="text-[11px] text-slate-700 bg-amber-50/70 p-1.5 rounded border border-amber-200/60">
                  <span className="font-semibold text-amber-900">
                    Nota del cliente:
                  </span>{" "}
                  "{nota}"
                </div>
              ) : null}

              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                <span>Peso neto en balanza:</span>
                <span
                  className={`font-mono font-bold ${
                    pesoReal ? "text-emerald-700" : "text-red-500"
                  }`}
                >
                  {pesoReal ? formatWeight(pesoReal, unit) : "Pendiente"}
                </span>
              </div>
            </div>
          );
        })}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-semibold text-slate-700">
          <span className="flex items-center gap-1">
            {isRetiro ? (
              <Store className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <Truck className="w-3.5 h-3.5 text-slate-500" />
            )}
            {isRetiro ? "Retiro en Mostrador" : "Envío a Domicilio"}
          </span>
          <span className="text-slate-900 font-bold font-mono">
            Total: {formatMoney(totalPedido)}
          </span>
        </div>

        {/* Motivo de cancelación inline */}
        {showCancelBox && isActiveOrder && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Motivo de cancelación (ej: Sin stock, pedido duplicado)..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 text-xs outline-none"
            />
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setShowCancelBox(false);
                  setCancelReason("");
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-[11px] cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => {
                  onCancelOrder?.(pedido.id, cancelReason.trim());
                  setShowCancelBox(false);
                  setCancelReason("");
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Botones de Acción de Carnicero */}
      {isActiveOrder && (
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenPesaje(pedido)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5 text-slate-600" />
              Pesar
            </button>
            {canSeePrivateData && (
              <button
                type="button"
                onClick={() => setShowCancelBox((v) => !v)}
                title="Cancelar pedido"
                className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {estado === "solicitado" && (
              <button
                type="button"
                onClick={() => onChangeStatus(pedido.id, "en_corte")}
                className="px-3 py-1.5 bg-[#002244] hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span>A Mesa de Corte</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {estado === "en_corte" && (
              <button
                type="button"
                onClick={() => onChangeStatus(pedido.id, "listo")}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Marcar Listo</span>
              </button>
            )}

            {estado === "listo" && (
              <button
                type="button"
                onClick={() => onChangeStatus(pedido.id, "entregado")}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer active:scale-95"
              >
                Despachar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
