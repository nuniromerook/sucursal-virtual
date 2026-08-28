// frontend-admin/src/pages/sucursales/sucursal-data/Overview.jsx
import React, { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Trophy,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Store,
  Flame,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { API_URL } from "../../../config/api";
import BasicDropdown from "../../../components/ui/BasicDropdown";
import { useSocket } from "../../../context/SocketContext";

const RANGO_ITEMS = [
  { value: "hoy", label: "📅 Hoy (en vivo)" },
  { value: "semana", label: "📊 Últimos 7 días" },
  { value: "mes", label: "📈 Este mes" },
  { value: "anio", label: "📆 Año actual" },
];

export default function Overview() {
  const { sucursal } = useOutletContext();
  const { ultimoPedido } = useSocket();

  const [rango, setRango] = useState("hoy");
  const [metricas, setMetricas] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMetricas = async () => {
    if (!sucursal?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/sucursales/${sucursal.id}/metricas?rango=${rango}`
      );
      const data = await res.json();
      setMetricas(data);
    } catch (error) {
      console.error("Error al cargar métricas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetricas();
  }, [sucursal?.id, rango]);

  // Si llega un nuevo pedido por Socket.io, refrescar métricas automáticamente
  useEffect(() => {
    if (ultimoPedido && ultimoPedido.sucursal_id === sucursal?.id) {
      loadMetricas();
    }
  }, [ultimoPedido, sucursal?.id]);

  const vol = metricas?.volumen_kg || { total: 0, vacuno: 0, cerdo: 0, pollo: 0, elaborados: 0 };
  const totalVol = vol.total || 1; // Evitar división por cero

  return (
    <div className="flex flex-col gap-6">

      {/* ─── Header de Información de la Sucursal ─── */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-neutral-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="size-12 rounded-xl bg-main-blue/10 border border-main-blue/20 flex items-center justify-center text-main-blue shrink-0">
              <Store className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-neutral-900 tracking-tight">
                  {sucursal?.nombre}
                </h1>
                <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 rounded-md">
                  Sucursal Activa
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-neutral-500 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-neutral-400" />
                  {sucursal?.direccion}, {sucursal?.ciudad}
                </span>
                {sucursal?.telefono && (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3.5 text-neutral-400" />
                    {sucursal.telefono}
                  </span>
                )}
                {sucursal?.horario_atencion && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5 text-neutral-400" />
                    {sucursal.horario_atencion}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Selector de Rango Temporal */}
          <div className="w-full md:w-52 shrink-0">
            <BasicDropdown
              items={RANGO_ITEMS}
              value={rango}
              onChange={setRango}
              buttonClassName="py-2 text-xs"
            />
          </div>
        </div>
      </div>

      {/* ─── Tarjetas de Cierre de Caja & KPIs Financieros ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Facturación */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cierre de Caja</span>
            <div className="size-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-neutral-900 leading-tight">
              ${(metricas?.facturacion_total || 0).toLocaleString("es-AR")}
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Facturación en el período
            </p>
          </div>
        </div>

        {/* Volumen en Kg */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Carne Despachada</span>
            <div className="size-7 rounded-lg bg-blue-50 text-main-blue flex items-center justify-center">
              <Package className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-neutral-900 leading-tight">
              {(metricas?.volumen_kg?.total || 0).toFixed(1)} kg
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Volumen total fraccionado
            </p>
          </div>
        </div>

        {/* Pedidos */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pedidos</span>
            <div className="size-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-neutral-900 leading-tight">
              {metricas?.pedidos_total || 0}
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {metricas?.pedidos_completados || 0} entregados · {metricas?.pedidos_pendientes || 0} en curso
            </p>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ticket Promedio</span>
            <div className="size-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-neutral-900 leading-tight">
              ${(metricas?.ticket_promedio || 0).toLocaleString("es-AR")}
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Promedio por compra
            </p>
          </div>
        </div>

      </div>

      {/* ─── Desglose de Volumen por Especie ─── */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-neutral-200/80 shadow-2xs">
        <h3 className="font-bold text-sm text-neutral-900 mb-4">
          Volumen Despachado por Especie
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Vacuno */}
          <div className="bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-200/60">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-700 mb-1.5">
              <span className="flex items-center gap-1.5">🥩 Vacuno</span>
              <span>{vol.vacuno.toFixed(1)} kg</span>
            </div>
            <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-red-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (vol.vacuno / totalVol) * 100)}%` }}
              />
            </div>
          </div>

          {/* Cerdo */}
          <div className="bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-200/60">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-700 mb-1.5">
              <span className="flex items-center gap-1.5">🐷 Cerdo</span>
              <span>{vol.cerdo.toFixed(1)} kg</span>
            </div>
            <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (vol.cerdo / totalVol) * 100)}%` }}
              />
            </div>
          </div>

          {/* Pollo */}
          <div className="bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-200/60">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-700 mb-1.5">
              <span className="flex items-center gap-1.5">🍗 Pollo</span>
              <span>{vol.pollo.toFixed(1)} kg</span>
            </div>
            <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (vol.pollo / totalVol) * 100)}%` }}
              />
            </div>
          </div>

          {/* Elaborados */}
          <div className="bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-200/60">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-700 mb-1.5">
              <span className="flex items-center gap-1.5">🍲 Elaborados</span>
              <span>{vol.elaborados.toFixed(1)} kg</span>
            </div>
            <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (vol.elaborados / totalVol) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Inteligencia Comercial: Cortes Ganadores y Estancados ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 🏆 Cortes Ganadores (Top 5) */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3.5">
              <Trophy className="size-4.5 text-amber-500" />
              <h3 className="font-bold text-sm text-neutral-900">
                🏆 Cortes Ganadores (Mayor Rotación)
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              Los 5 cortes con mayor volumen despachado en este período.
            </p>

            {metricas?.cortes_ganadores?.length === 0 ? (
              <p className="text-xs text-neutral-400 py-6 text-center">
                Aún no hay ventas registradas en este período.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {metricas?.cortes_ganadores?.map((corte, idx) => (
                  <li key={corte.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="size-5 rounded-full bg-neutral-100 font-black text-[11px] text-neutral-600 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-neutral-800 truncate">
                        {corte.nombre_producto}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-emerald-600 block">
                        {corte.kg_vendidos.toFixed(1)} kg
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        ${corte.total_facturado.toLocaleString("es-AR")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ⚠️ Cortes Estancados */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3.5">
              <AlertTriangle className="size-4.5 text-orange-500" />
              <h3 className="font-bold text-sm text-neutral-900">
                ⚠️ Cortes con Menor Movimiento
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              Cortes con bajo movimiento para considerar promociones o combos.
            </p>

            {metricas?.cortes_estancados?.length === 0 ? (
              <p className="text-xs text-neutral-400 py-6 text-center">
                Sin datos de cortes estancados.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {metricas?.cortes_estancados?.map((corte) => (
                  <li key={corte.id} className="py-2.5 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-neutral-700 truncate">
                      {corte.nombre_producto}
                    </span>
                    <span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded text-[11px] shrink-0">
                      {corte.kg_vendidos.toFixed(1)} kg vendidos
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
