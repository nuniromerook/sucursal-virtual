// frontend-admin/src/pages/Inicio.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  Package,
  ShoppingBag,
  Store,
  Users,
  Eye,
  Smartphone,
  Monitor,
  Star,
  Award,
  Sparkles,
  ArrowRight,
  Plus,
  RefreshCw,
  ExternalLink,
  Flame,
  Radio,
  Clock,
  CheckCircle,
  Truck,
  Scissors,
  AlertCircle,
  BarChart3,
  Percent,
  MousePointerClick,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import { API_URL } from "../config/api";
import BasicDropdown from "../components/ui/BasicDropdown";

const PERIODOS_DROPDOWN = [
  { value: "hoy", label: "Hoy en vivo" },
  { value: "semana", label: "Últimos 7 días" },
  { value: "mes", label: "Este mes" },
  { value: "anio", label: "Año actual" },
];

export default function Inicio() {
  const { setNavbarTitle } = useAppContext();
  const { ultimoPedido } = useSocket();
  const navigate = useNavigate();

  const [rango, setRango] = useState("hoy");
  const [dashboardData, setDashboardData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [favoritosRanking, setFavoritosRanking] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setNavbarTitle("Torre de Control");
  }, [setNavbarTitle]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resDash, resAnalytics, resFavs] = await Promise.all([
        fetch(`${API_URL}/dashboard/resumen?rango=${rango}`),
        fetch(`${API_URL}/analytics/resumen?rango=${rango}`),
        fetch(`${API_URL}/catalogo/favoritos/ranking`),
      ]);

      const [dataDash, dataAnalytics, dataFavs] = await Promise.all([
        resDash.json(),
        resAnalytics.json(),
        resFavs.json(),
      ]);

      setDashboardData(dataDash);
      setAnalyticsData(dataAnalytics);
      setFavoritosRanking(Array.isArray(dataFavs) ? dataFavs : []);
    } catch (err) {
      console.error("Error al cargar datos del dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [rango]);

  // Actualizar en vivo cuando entra un pedido por Socket.io
  useEffect(() => {
    if (ultimoPedido) {
      loadData();
    }
  }, [ultimoPedido?.id]);

  const formatMoney = (val) => `$${Number(val || 0).toLocaleString("es-AR")}`;

  const estadoBadge = (estado) => {
    const map = {
      solicitado: {
        label: "Solicitado",
        bg: "bg-amber-50 text-amber-800 border-amber-200",
      },
      en_corte: {
        label: "En Corte",
        bg: "bg-blue-50 text-blue-800 border-blue-200",
      },
      pesado: {
        label: "Esperando Aprobación",
        bg: "bg-purple-50 text-purple-800 border-purple-200",
      },
      listo: {
        label: "Listo",
        bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      },
      en_camino: {
        label: "En Camino",
        bg: "bg-orange-50 text-orange-800 border-orange-200",
      },
      entregado: {
        label: "Entregado",
        bg: "bg-neutral-100 text-neutral-600 border-neutral-200",
      },
    };
    const conf = map[estado] || {
      label: estado,
      bg: "bg-neutral-100 text-neutral-600 border-neutral-200",
    };
    return (
      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${conf.bg}`}
      >
        {conf.label}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* ─── 1. Header Ejecutivo & Accesos Rápidos ─── */}
      <div className="bg-white rounded-lg p-5 sm:p-6 border border-neutral-200/80 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="size-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Red Valette en Vivo
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight mt-1">
              Torre de Control — Abastecedora Valette
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Resumen ejecutivo consolidado de todas las sucursales, tienda
              online y analítica de público.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Selector de Rango Temporal */}
            <div className="w-40 sm:w-44">
              <BasicDropdown
                items={PERIODOS_DROPDOWN}
                value={rango}
                onChange={setRango}
                buttonClassName="py-2 text-xs font-bold"
              />
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              title="Refrescar métricas"
              className="p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer transition-colors"
            >
              <RefreshCw
                className={`size-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>

            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <span>Ver Tienda</span>
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* ─── 2. KPIs Consolidados Globales ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Facturación Consolidada */}
        <div className="bg-white p-5 rounded-lg border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Facturación Total
            </span>
            <div className="size-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              {formatMoney(dashboardData?.facturacion_total)}
            </h3>
            <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
              <TrendingUp className="size-3.5 text-emerald-500" />
              Suma de todas las sucursales y ecommerce
            </p>
          </div>
        </div>

        {/* Volumen Total en Kg */}
        <div className="bg-white p-5 rounded-lg border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Volumen Despachado
            </span>
            <div className="size-9 rounded-xl bg-blue-50 text-main-blue flex items-center justify-center font-bold">
              <ScaleIcon className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              {dashboardData?.volumen_kg?.total || 0}{" "}
              <span className="text-lg font-bold text-neutral-500">kg</span>
            </h3>
            {/* Mini desglose de especies */}
            <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-neutral-600">
              <span className="text-red-700">
                🥩 {dashboardData?.volumen_kg?.vacuno || 0}k
              </span>
              <span className="text-rose-700">
                🐷 {dashboardData?.volumen_kg?.cerdo || 0}k
              </span>
              <span className="text-amber-700">
                🍗 {dashboardData?.volumen_kg?.pollo || 0}k
              </span>
            </div>
          </div>
        </div>

        {/* Total de Pedidos */}
        <div className="bg-white p-5 rounded-lg border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Pedidos Globales
            </span>
            <div className="size-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <ShoppingBag className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                {dashboardData?.pedidos_total || 0}
              </h3>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {dashboardData?.pedidos_pendientes || 0} en curso
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              {dashboardData?.pedidos_entregados || 0} entregados exitosamente
            </p>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white p-5 rounded-lg border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Ticket Promedio
            </span>
            <div className="size-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <TrendingUp className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              {formatMoney(dashboardData?.ticket_promedio)}
            </h3>
            <p className="text-[11px] text-neutral-400 mt-1">
              Gasto medio por cliente en la plataforma
            </p>
          </div>
        </div>
      </div>

      {/* ─── 3. Tablero de Red de Sucursales ─── */}
      <div className="bg-white rounded-lg p-5 sm:p-6 border border-neutral-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Store className="size-5 text-main-blue" />
            <h2 className="text-base font-black text-neutral-900 tracking-tight">
              Red de Sucursales en Operación (
              {dashboardData?.sucursales?.length || 0})
            </h2>
          </div>
          <span className="text-xs font-bold text-neutral-400">
            Hacé clic en cualquier sucursal para operarla
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardData?.sucursales?.map((suc) => (
            <div
              key={suc.id}
              onClick={() => navigate(`/sucursal/${suc.slug || suc.id}`)}
              className="group p-5 rounded-xl border border-neutral-200 hover:border-main-blue/50 hover:shadow-md transition-all cursor-pointer bg-neutral-50/50 hover:bg-white flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-base text-neutral-900 group-hover:text-main-blue transition-colors">
                      {suc.nombre}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      {suc.direccion} · {suc.ciudad}
                    </p>
                  </div>
                  {suc.pedidos_pendientes > 0 ? (
                    <span className="text-[11px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full animate-pulse shadow-2xs">
                      {suc.pedidos_pendientes} pedidos
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                      Al día
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 bg-white p-3 rounded-lg border border-neutral-100 text-xs mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">
                      Facturación {rango}:
                    </span>
                    <span className="font-black text-neutral-900">
                      {formatMoney(suc.facturacion_hoy)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Equipo activo:</span>
                    <span className="font-bold text-neutral-700">
                      {suc.empleados_activos} personas
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-main-blue pt-2 border-t border-neutral-100">
                <span>Operar Comandas & Stock</span>
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 4. Sección de Analítica de Tráfico & Media Kit Publicitario ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Tráfico & Dispositivos */}
        <div className="lg:col-span-2 bg-white rounded-lg p-5 sm:p-6 border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <BarChart3 className="size-5 text-purple-700" />
                <div>
                  <h2 className="text-base font-black text-neutral-900 tracking-tight">
                    Analítica de Tráfico & Audiencia
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Medición de ingresos al ecommerce para pauta y espacios
                    publicitarios.
                  </p>
                </div>
              </div>
              <span className="text-xs font-black uppercase text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                Media Kit
              </span>
            </div>

            {/* Tarjetas de Visitas y Audiencia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                <span className="text-xs font-bold text-neutral-500">
                  Total Vistas de Página (Page Views)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-2xl font-black text-neutral-900">
                    {analyticsData?.total_visitas || 0}
                  </h3>
                  <span className="text-xs text-neutral-400">
                    ({analyticsData?.visitantes_unicos || 0} únicos)
                  </span>
                </div>
              </div>

              {/* % Móvil vs Escritorio */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-500 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Smartphone className="size-3.5 text-main-blue" /> Móvil{" "}
                    {analyticsData?.dispositivos?.porcentaje_mobile || 0}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Monitor className="size-3.5 text-neutral-600" /> PC{" "}
                    {100 -
                      (analyticsData?.dispositivos?.porcentaje_mobile || 0)}
                    %
                  </span>
                </div>
                {/* Barra de proporción */}
                <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden flex">
                  <div
                    className="bg-main-blue h-full"
                    style={{
                      width: `${analyticsData?.dispositivos?.porcentaje_mobile || 0}%`,
                    }}
                  />
                  <div
                    className="bg-neutral-700 h-full"
                    style={{
                      width: `${100 - (analyticsData?.dispositivos?.porcentaje_mobile || 0)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Páginas Más Visitadas */}
            <div>
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                Top Páginas Más Vistas
              </h4>
              <div className="space-y-1.5">
                {analyticsData?.paginas_top?.map((pag, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-neutral-50 border border-neutral-100"
                  >
                    <span className="font-semibold text-neutral-800 truncate">
                      {pag.ruta}
                    </span>
                    <span className="font-black text-neutral-900 bg-neutral-200/70 px-2 py-0.5 rounded text-[11px]">
                      {pag.visitas} visitas
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tarjeta de Banners Publicitarios (Sponsors) */}
          <div className="mt-6 pt-4 border-t border-neutral-100 bg-gradient-to-r from-purple-50/50 to-neutral-50 p-4 rounded-xl border border-purple-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                <MousePointerClick className="size-4 text-purple-700" />
                Rendimiento de Banners Publicitarios (Carrusel Home)
              </span>
              <span className="font-black text-purple-700">
                CTR {analyticsData?.publicidad?.ctr || "0%"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-neutral-100">
                <span className="text-[10px] text-neutral-400 block">
                  Impresiones
                </span>
                <span className="font-black text-neutral-900">
                  {analyticsData?.publicidad?.impresiones || 0}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-neutral-100">
                <span className="text-[10px] text-neutral-400 block">
                  Clics Reales
                </span>
                <span className="font-black text-neutral-900">
                  {analyticsData?.publicidad?.clics || 0}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-neutral-100">
                <span className="text-[10px] text-neutral-400 block">
                  Efectividad
                </span>
                <span className="font-black text-emerald-600">
                  {analyticsData?.publicidad?.ctr || "0%"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Top Favoritos ⭐ & Ganadores */}
        <div className="bg-white rounded-lg p-5 sm:p-6 border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Star className="size-5 text-amber-500 fill-amber-400" />
              <div>
                <h3 className="font-black text-base text-neutral-900">
                  Cortes Más Deseados ⭐
                </h3>
                <p className="text-xs text-neutral-500">
                  Guardados en favoritos por los clientes
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {favoritosRanking.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-6 text-center">
                  Aún no hay favoritos registrados por clientes.
                </p>
              ) : (
                favoritosRanking.map((fav, idx) => (
                  <div
                    key={fav.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-100 bg-neutral-50 hover:bg-neutral-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-black text-xs text-neutral-400 w-4">
                        #{idx + 1}
                      </span>
                      <img
                        src={
                          fav.imagen_url ||
                          "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=100"
                        }
                        alt={fav.nombre_producto}
                        className="size-9 rounded-lg object-cover border border-neutral-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 truncate">
                          {fav.nombre_producto}
                        </p>
                        <p className="text-[10px] text-neutral-400 capitalize">
                          {fav.especie}
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                      <Star className="size-3 fill-amber-500" />
                      {fav.total_favoritos}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cortes más vendidos en volumen */}
          <div className="mt-6 pt-4 border-t border-neutral-100">
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Flame className="size-3.5 text-orange-500" /> Top Vendidos en Kg
            </h4>
            <div className="space-y-1.5 text-xs">
              {dashboardData?.cortes_ganadores?.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <span className="font-semibold text-neutral-800 truncate">
                    {c.nombre_producto}
                  </span>
                  <span className="font-black text-neutral-900">
                    {c.total_kg_vendidos} kg
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 5. Live Feed de Últimas Órdenes de la Cadena ─── */}
      <div className="bg-white rounded-lg p-5 sm:p-6 border border-neutral-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="size-5 text-emerald-600 animate-pulse" />
            <h3 className="font-black text-base text-neutral-900">
              Últimas Comandas Entrantes (En Vivo)
            </h3>
          </div>
          <span className="text-xs text-neutral-400">
            Actualizado al instante vía Socket.io
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 font-bold uppercase text-[10px]">
                <th className="pb-2.5">Pedido</th>
                <th className="pb-2.5">Cliente</th>
                <th className="pb-2.5">Sucursal</th>
                <th className="pb-2.5">Monto</th>
                <th className="pb-2.5">Entrega</th>
                <th className="pb-2.5">Estado</th>
                <th className="pb-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {dashboardData?.ultimos_pedidos?.map((ped) => (
                <tr
                  key={ped.id}
                  className="hover:bg-neutral-50 transition-colors"
                >
                  <td className="py-3 font-black text-main-blue">#{ped.id}</td>
                  <td className="py-3 font-bold text-neutral-900">
                    {ped.cliente_nombre}
                  </td>
                  <td className="py-3 text-neutral-600">
                    {ped.sucursal_nombre}
                  </td>
                  <td className="py-3 font-black text-neutral-900">
                    {formatMoney(ped.monto)}
                  </td>
                  <td className="py-3 text-neutral-500 capitalize">
                    {ped.tipo_entrega.replace("_", " ")}
                  </td>
                  <td className="py-3">{estadoBadge(ped.estado)}</td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/sucursales/${ped.sucursal_slug || 1}/pedidos`,
                        )
                      }
                      className="px-2.5 py-1 rounded bg-neutral-100 hover:bg-main-blue hover:text-white font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      Ver Comanda
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Icono auxiliar para báscula
function ScaleIcon(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  );
}
