// admin/src/pages/MetricasPage.jsx
import { useState, useEffect, useCallback } from "react";
import {
  Printer,
  TrendingUp,
  Scale,
  CheckCircle2,
  Eye,
  RefreshCw,
  ShoppingCart,
  Smartphone,
  Monitor,
  Megaphone,
  Activity,
} from "lucide-react";
import { VITE_API_URL } from "../config/api";
import { useAdmin } from "../context/AdminContext";
import { useAuth } from "../context/AuthContext";
import { formatMoney, formatDate } from "../utils/formatters";

const PASO_LABELS = {
  catalogo: "Viendo Catálogo",
  carrito_abierto: "Abrió el Carrito",
  checkout_datos: "Checkout (Datos)",
  checkout_entrega: "Checkout (Entrega)",
  checkout_pago: "Checkout (Pago)",
  pedido_completado: "Pedido Confirmado",
};

const EVENTO_LABELS = {
  ver_producto: "Vistas de Cortes",
  agregar_carrito: "Agregados al Carrito",
  buscar_catalogo: "Búsquedas en Catálogo",
  embudo_checkout: "Pasos del Checkout",
};

export default function MetricasPage() {
  const { selectedSucursal } = useAdmin();
  const sucursalId = selectedSucursal?.id || 1;
  const { authHeaders } = useAuth();

  const [rango, setRango] = useState("hoy"); // "hoy" | "semana" | "mes" | "anio"
  const [isLoading, setIsLoading] = useState(false);
  const [sucursalStats, setSucursalStats] = useState(null);
  const [analyticsStats, setAnalyticsStats] = useState(null);
  const [cloudCarts, setCloudCarts] = useState([]);

  const fetchMetricsData = useCallback(async () => {
    const [resSuc, resAna, resCarts] = await Promise.all([
      fetch(`${VITE_API_URL}/sucursales/${sucursalId}/metricas?rango=${rango}`, {
        headers: authHeaders,
      }),
      fetch(`${VITE_API_URL}/analytics/resumen?rango=${rango}`, {
        headers: authHeaders,
      }),
      fetch(`${VITE_API_URL}/carritos/activos`, {
        headers: authHeaders,
      }),
    ]);

    const dataSuc = resSuc.ok ? await resSuc.json() : null;
    const dataAna = resAna.ok ? await resAna.json() : null;
    const dataCarts = resCarts.ok ? await resCarts.json() : null;
    return { dataSuc, dataAna, dataCarts };
  }, [sucursalId, rango, authHeaders]);

  const handleRefreshMetrics = async () => {
    setIsLoading(true);
    try {
      const { dataSuc, dataAna, dataCarts } = await fetchMetricsData();
      if (dataSuc) setSucursalStats(dataSuc);
      if (dataAna) setAnalyticsStats(dataAna);
      if (dataCarts) {
        const list = Array.isArray(dataCarts)
          ? dataCarts
          : Array.isArray(dataCarts?.carritos)
            ? dataCarts.carritos
            : [];
        setCloudCarts(list);
      }
    } catch (err) {
      console.error("Error al cargar métricas:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchMetricsData()
      .then(({ dataSuc, dataAna, dataCarts }) => {
        if (!isMounted) return;
        if (dataSuc) setSucursalStats(dataSuc);
        if (dataAna) setAnalyticsStats(dataAna);
        if (dataCarts) {
          const list = Array.isArray(dataCarts)
            ? dataCarts
            : Array.isArray(dataCarts?.carritos)
              ? dataCarts.carritos
              : [];
          setCloudCarts(list);
        }
      })
      .catch((err) => {
        if (isMounted) console.error("Error al cargar métricas:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [fetchMetricsData]);

  const facturacionTotal = Number(sucursalStats?.facturacion_total || 0);
  const pedidosTotal = Number(sucursalStats?.pedidos_total || 0);
  const pedidosCompletados = Number(sucursalStats?.pedidos_completados || 0);
  const ticketPromedio = Number(sucursalStats?.ticket_promedio || 0);
  const volumenKg = sucursalStats?.volumen_kg || {
    total: 0,
    vacuno: 0,
    cerdo: 0,
    pollo: 0,
  };
  const cortesGanadores = Array.isArray(sucursalStats?.cortes_ganadores)
    ? sucursalStats.cortes_ganadores
    : [];

  const totalVisitas = Number(analyticsStats?.total_visitas || 0);
  const visitantesUnicos = Number(analyticsStats?.visitantes_unicos || 0);
  const pctMobile = Number(analyticsStats?.dispositivos?.porcentaje_mobile || 0);
  const eventosTop = Array.isArray(analyticsStats?.eventos_top)
    ? analyticsStats.eventos_top
    : [];
  const embudoPasos = Array.isArray(analyticsStats?.embudo_carritos?.por_paso)
    ? analyticsStats.embudo_carritos.por_paso
    : [];
  const publicidad = analyticsStats?.publicidad || {
    impresiones: 0,
    clics: 0,
    ctr: "0%",
  };

  return (
    <div className="space-y-5">
      {/* Cabecera y Filtro de Rango */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Métricas Operativas, Tráfico Web & Carritos en la Nube
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Balance en vivo de{" "}
            {selectedSucursal?.nombre || "Luis Guillón (Casa Central)"},
            interacciones de usuarios y embudo de compra.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-1 bg-slate-200/60 rounded-xl gap-1">
            {[
              { id: "hoy", label: "Hoy" },
              { id: "semana", label: "7 Días" },
              { id: "mes", label: "Mes" },
              { id: "anio", label: "Año" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRango(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  rango === item.id
                    ? "bg-[#002244] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRefreshMetrics}
            disabled={isLoading}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Actualizar métricas"
            aria-label="Actualizar métricas"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* 1. KPIs Principales de Ventas y Tráfico */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Facturación ({rango})</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatMoney(facturacionTotal)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Ticket promedio: {formatMoney(ticketPromedio)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Kilos Despachados</span>
            <Scale className="w-4 h-4 text-[#002244]" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {Number(volumenKg.total || 0).toFixed(1)} kg
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Vacuno: {Number(volumenKg.vacuno || 0).toFixed(1)}kg | Cerdo:{" "}
            {Number(volumenKg.cerdo || 0).toFixed(1)}kg | Pollo:{" "}
            {Number(volumenKg.pollo || 0).toFixed(1)}kg
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Pedidos Registrados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {pedidosTotal} pedidos
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-bold">
            {pedidosCompletados} entregados •{" "}
            {Number(sucursalStats?.pedidos_pendientes || 0)} en curso
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Tráfico & Publicidad Web</span>
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {totalVisitas} visitas
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-2">
            <span>{visitantesUnicos} únicos</span>
            <span>•</span>
            <span>{pctMobile}% Celular</span>
            <span>•</span>
            <span>CTR Banners: {publicidad.ctr}</span>
          </div>
        </div>
      </div>

      {/* 2. Desglose de Eventos de Telemetría, Embudo y Cortes Más Vendidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Eventos de interacción */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#002244]" />
              Interacciones en la Web
            </h2>
            <span className="text-[11px] font-bold text-slate-400">
              metricas_eventos
            </span>
          </div>
          {eventosTop.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Sin eventos registrados en este período.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {eventosTop.map((ev) => (
                <div
                  key={ev.tipo_evento}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60"
                >
                  <span className="font-bold text-slate-700">
                    {EVENTO_LABELS[ev.tipo_evento] || ev.tipo_evento}
                  </span>
                  <span className="font-mono font-black text-[#002244]">
                    {ev.total}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Embudo de pasos de Carritos */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-amber-600" />
              Embudo de Conversión
            </h2>
            <span className="text-[11px] font-bold text-slate-400">
              Por último paso
            </span>
          </div>
          {embudoPasos.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Todavía no hay carritos activos en este rango.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {embudoPasos.map((ep) => (
                <div
                  key={ep.paso}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60"
                >
                  <span className="font-bold text-slate-700">
                    {PASO_LABELS[ep.paso] || ep.paso}
                  </span>
                  <span className="font-mono font-black text-slate-900">
                    {ep.cantidad}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Cortes Más Vendidos */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-emerald-600" />
              Cortes Más Vendidos
            </h2>
            <span className="text-[11px] font-bold text-slate-400">
              Banners: {publicidad.impresiones} vistas / {publicidad.clics} clics
            </span>
          </div>
          {cortesGanadores.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Sin ventas registradas en este rango.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {cortesGanadores.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60"
                >
                  <span className="font-bold text-slate-800 truncate">
                    {c.nombre_producto}
                  </span>
                  <span className="font-mono font-bold text-emerald-700 shrink-0">
                    {c.kg_vendidos} kg ({formatMoney(c.total_facturado)})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Tabla Responsiva de Carritos en la Nube (Activos / Abandonados por Dispositivo) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2
              id="cloud-carts-caption"
              className="text-sm font-extrabold text-slate-900"
            >
              Carritos en la Nube en Vivo ({cloudCarts.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Qué cortes tiene cada visitante en su carrito, desde qué
              dispositivo navega y hasta qué paso del checkout llegó.
            </p>
          </div>
        </div>

        {cloudCarts.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 font-medium">
            No hay carritos en curso o abandonados en este momento.
          </div>
        ) : (
          <div
            tabIndex={0}
            role="region"
            aria-labelledby="cloud-carts-caption"
            className="overflow-x-auto max-h-[420px]"
          >
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-extrabold">
                <tr>
                  <th scope="col" className="py-3 px-4">
                    Visitante / Dispositivo
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Último Paso / Estado
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Cortes en el Carrito
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Total Estimado
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Última Actividad
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cloudCarts.map((cart) => {
                  const items = Array.isArray(cart.items) ? cart.items : [];
                  const isMobile =
                    String(cart.dispositivo || "").toLowerCase() === "mobile";
                  return (
                    <tr key={cart.id} className="hover:bg-slate-50/80">
                      <th
                        scope="row"
                        className="py-3 px-4 font-bold text-slate-900 sticky left-0 bg-white whitespace-nowrap"
                      >
                        <div className="flex items-center gap-2">
                          {isMobile ? (
                            <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                          ) : (
                            <Monitor className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                          <div>
                            <div className="font-bold text-slate-900">
                              {cart.cliente_nombre || "Visitante Anónimo"}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono font-normal">
                              {cart.cliente_telefono ||
                                cart.sesion_id ||
                                `Carrito #${cart.id}`}
                            </div>
                          </div>
                        </div>
                      </th>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                          {PASO_LABELS[cart.ultimo_paso] ||
                            cart.ultimo_paso ||
                            "En carrito"}
                        </span>
                        {cart.motivo_abandono ? (
                          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                            Motivo: {cart.motivo_abandono}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {items.map((it) => (
                            <span
                              key={it.id}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]"
                            >
                              <b>
                                {it.cantidad_kg} {it.unidad_medida || "kg"}
                              </b>{" "}
                              {it.nombre_producto}
                              {it.opciones_corte_seleccionada &&
                              it.opciones_corte_seleccionada !== "Estándar"
                                ? ` (${it.opciones_corte_seleccionada})`
                                : ""}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-slate-900 whitespace-nowrap">
                        {formatMoney(
                          cart.total_estimado ||
                            items.reduce(
                              (acc, it) =>
                                acc +
                                (Number(it.cantidad_kg) || 0) *
                                  (Number(it.precio_al_agregar) || 0),
                              0
                            )
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {cart.actualizado_en
                          ? formatDate(cart.actualizado_en)
                          : "Reciente"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
