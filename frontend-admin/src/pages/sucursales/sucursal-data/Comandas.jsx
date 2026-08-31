// frontend-admin/src/pages/sucursales/sucursal-data/Comandas.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import {
  Clock,
  Radio,
  Scissors,
  CheckCircle2,
  AlertCircle,
  User,
  Users,
  Volume2,
  VolumeX,
  Maximize2,
  ArrowUpDown,
  Sparkles,
  Search,
  X,
  Flame,
  Check,
  Scale,
  DollarSign,
  PackageCheck,
  ChevronRight,
} from "lucide-react";
import { API_URL } from "../../../config/api";
import { useSocket } from "../../../context/SocketContext";
import { useAuth } from "../../../context/AuthContext";
import { formatMoney } from "../../../utils/formatters";

export default function Comandas() {
  const { sucursal } = useOutletContext() || {};
  const { slug } = useParams();
  const { ultimoPedido, reproducirSonidoComanda } = useSocket();
  const { user } = useAuth();

  const [pedidos, setPedidos] = useState([]);
  const [cortadores, setCortadores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sonidoHabilitado, setSonidoHabilitado] = useState(true);
  const [horaActual, setHoraActual] = useState(new Date());

  // Modal de Asignación de Cortador
  const [modalAsignacion, setModalAsignacion] = useState({
    open: false,
    pedido: null,
  });
  const [ordenCortadores, setOrdenCortadores] = useState("menos_pedidos"); // "menos_pedidos" | "alfabetico"
  const [filtroTextoCortador, setFiltroTextoCortador] = useState("");
  const [asignandoId, setAsignandoId] = useState(null);

  // Modal de Pesaje en Balanza (para pasar a pesado/listo)
  const [modalPesaje, setModalPesaje] = useState({
    open: false,
    pedido: null,
    pesoFinal: "",
    montoFinal: "",
  });

  // Reloj digital en vivo
  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    const idOrSlug = sucursal?.id || slug;
    if (!idOrSlug) return;

    try {
      const [resPed, resCort] = await Promise.all([
        fetch(`${API_URL}/sucursales/${idOrSlug}/pedidos`),
        fetch(`${API_URL}/sucursales/${idOrSlug}/cortadores-carga`),
      ]);

      if (resPed.ok) {
        const dataPed = await resPed.json();
        setPedidos(Array.isArray(dataPed) ? dataPed : []);
      }
      if (resCort.ok) {
        const dataCort = await resCort.json();
        setCortadores(Array.isArray(dataCort) ? dataCort : []);
      }
    } catch (err) {
      console.error("Error al cargar comandas TV:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sucursal?.id, slug]);

  // Alerta sonora y recarga en vivo con Socket.io
  useEffect(() => {
    if (ultimoPedido) {
      if (sonidoHabilitado) {
        reproducirSonidoComanda();
      }
      loadData();
    }
  }, [ultimoPedido, sonidoHabilitado]);

  // Filtrar pedidos activos para el KDS de la carnicería
  const comandasSolicitadas = useMemo(
    () => pedidos.filter((p) => p.estado_local === "solicitado"),
    [pedidos]
  );
  const comandasEnCorte = useMemo(
    () => pedidos.filter((p) => p.estado_local === "en_corte"),
    [pedidos]
  );
  const comandasListas = useMemo(
    () =>
      pedidos.filter(
        (p) =>
          p.estado_local === "pesado" ||
          p.estado_local === "listo" ||
          p.estado_local === "en_camino"
      ),
    [pedidos]
  );

  // Cortadores ordenados según el filtro del modal
  const cortadoresOrdenados = useMemo(() => {
    let list = [...cortadores];

    if (filtroTextoCortador.trim()) {
      const q = filtroTextoCortador.toLowerCase().trim();
      list = list.filter(
        (c) =>
          (c.nombre || "").toLowerCase().includes(q) ||
          (c.apodo || "").toLowerCase().includes(q)
      );
    }

    if (ordenCortadores === "menos_pedidos") {
      // Priorizar los que tienen 0 en corte, luego menor cantidad de pedidos hoy
      list.sort((a, b) => {
        if (a.pedidos_en_corte !== b.pedidos_en_corte) {
          return a.pedidos_en_corte - b.pedidos_en_corte;
        }
        return a.pedidos_hoy - b.pedidos_hoy;
      });
    } else {
      list.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
    }

    return list;
  }, [cortadores, ordenCortadores, filtroTextoCortador]);

  // Asignar cortador al pedido
  const handleAsignarCortador = async (cortador) => {
    if (!modalAsignacion.pedido) return;
    setAsignandoId(cortador.id);

    try {
      const res = await fetch(
        `${API_URL}/pedidos/${modalAsignacion.pedido.id}/estado`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            empleado_id: cortador.id,
            estado_local: "en_corte",
          }),
        }
      );

      if (res.ok) {
        setModalAsignacion({ open: false, pedido: null });
        loadData();
      }
    } catch (err) {
      console.error("Error al asignar cortador:", err);
    } finally {
      setAsignandoId(null);
    }
  };

  // Guardar peso real y monto final de balanza
  const handleGuardarPesaje = async (e) => {
    e.preventDefault();
    if (!modalPesaje.pedido) return;

    try {
      const res = await fetch(
        `${API_URL}/pedidos/${modalPesaje.pedido.id}/estado`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            estado_local: "listo",
            peso_total_real: parseFloat(modalPesaje.pesoFinal) || null,
            monto_total_final: parseFloat(modalPesaje.montoFinal) || null,
          }),
        }
      );

      if (res.ok) {
        setModalPesaje({ open: false, pedido: null, pesoFinal: "", montoFinal: "" });
        loadData();
      }
    } catch (err) {
      console.error("Error al registrar pesaje:", err);
    }
  };

  const puedeGestionar = user?.rol === "admin" || user?.rol === "administrador" || user?.rol === "encargado";

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans select-none -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      {/* ─── Encabezado KDS TV ─── */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-main-red/20 border border-main-red/40 flex items-center justify-center text-main-red shadow-lg">
            <Scissors className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                Comandas en Vivo · {sucursal?.nombre || "Sector de Corte"}
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black animate-pulse">
                <Radio className="size-3" />
                <span>TV ON</span>
              </div>
            </div>
            <p className="text-xs text-neutral-400 font-medium mt-0.5">
              {puedeGestionar ? `Modo Encargado (${user.nombre})` : "Pantalla KDS de Despacho & Corte"}
            </p>
          </div>
        </div>

        {/* Reloj y Controles */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl text-neutral-300 text-sm font-black font-mono shadow-inner">
            <Clock className="size-4 text-neutral-500" />
            <span>
              {horaActual.toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSonidoHabilitado(!sonidoHabilitado)}
              title={sonidoHabilitado ? "Silenciar alarmas" : "Activar alarmas sonoras"}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                sonidoHabilitado
                  ? "bg-neutral-900 border-neutral-700 text-emerald-400 hover:bg-neutral-800"
                  : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {sonidoHabilitado ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              title="Pantalla Completa TV"
              className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
            >
              <Maximize2 className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Columnas de Comandas ─── */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 pt-6 items-start">
        {/* COLUMNA 1: SOLICITADOS / NUEVOS */}
        <section className="bg-neutral-900/90 rounded-2xl border border-amber-500/30 overflow-hidden flex flex-col shadow-2xl">
          <div className="p-4 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm tracking-wide text-amber-400 uppercase">
              <span className="size-2.5 rounded-full bg-amber-400 animate-ping" />
              <span>1. Nuevos Solicitados</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-neutral-950 font-black text-xs">
              {comandasSolicitadas.length}
            </span>
          </div>

          <div className="p-3.5 space-y-3.5 max-h-[calc(100vh-230px)] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700">
            {comandasSolicitadas.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs font-semibold">
                Sin pedidos nuevos por asignar
              </div>
            ) : (
              comandasSolicitadas.map((ped) => (
                <ComandaCard
                  key={ped.id}
                  pedido={ped}
                  puedeGestionar={puedeGestionar}
                  onAsignar={() => setModalAsignacion({ open: true, pedido: ped })}
                  onPesaje={() =>
                    setModalPesaje({
                      open: true,
                      pedido: ped,
                      pesoFinal: ped.peso_total_real || "",
                      montoFinal: ped.monto_total_final || ped.monto_total_estimado || "",
                    })
                  }
                />
              ))
            )}
          </div>
        </section>

        {/* COLUMNA 2: EN CORTE / PREPARACIÓN */}
        <section className="bg-neutral-900/90 rounded-2xl border border-blue-500/30 overflow-hidden flex flex-col shadow-2xl">
          <div className="p-4 bg-blue-500/15 border-b border-blue-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm tracking-wide text-blue-400 uppercase">
              <Scissors className="size-4 animate-bounce" />
              <span>2. En Corte / Preparación</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-400 text-neutral-950 font-black text-xs">
              {comandasEnCorte.length}
            </span>
          </div>

          <div className="p-3.5 space-y-3.5 max-h-[calc(100vh-230px)] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700">
            {comandasEnCorte.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs font-semibold">
                No hay comandas en corte actualmente
              </div>
            ) : (
              comandasEnCorte.map((ped) => (
                <ComandaCard
                  key={ped.id}
                  pedido={ped}
                  puedeGestionar={puedeGestionar}
                  onAsignar={() => setModalAsignacion({ open: true, pedido: ped })}
                  onPesaje={() =>
                    setModalPesaje({
                      open: true,
                      pedido: ped,
                      pesoFinal: ped.peso_total_real || "",
                      montoFinal: ped.monto_total_final || ped.monto_total_estimado || "",
                    })
                  }
                />
              ))
            )}
          </div>
        </section>

        {/* COLUMNA 3: PESADOS & LISTOS */}
        <section className="bg-neutral-900/90 rounded-2xl border border-emerald-500/30 overflow-hidden flex flex-col shadow-2xl">
          <div className="p-4 bg-emerald-500/15 border-b border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm tracking-wide text-emerald-400 uppercase">
              <PackageCheck className="size-4" />
              <span>3. Pesados & Listos</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-neutral-950 font-black text-xs">
              {comandasListas.length}
            </span>
          </div>

          <div className="p-3.5 space-y-3.5 max-h-[calc(100vh-230px)] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700">
            {comandasListas.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs font-semibold">
                Sin pedidos listos pendientes de entrega
              </div>
            ) : (
              comandasListas.map((ped) => (
                <ComandaCard
                  key={ped.id}
                  pedido={ped}
                  puedeGestionar={puedeGestionar}
                  onAsignar={() => setModalAsignacion({ open: true, pedido: ped })}
                  onPesaje={() =>
                    setModalPesaje({
                      open: true,
                      pedido: ped,
                      pesoFinal: ped.peso_total_real || "",
                      montoFinal: ped.monto_total_final || ped.monto_total_estimado || "",
                    })
                  }
                />
              ))
            )}
          </div>
        </section>
      </main>

      {/* ─── Modal de Asignación Inteligente de Cortador ─── */}
      {modalAsignacion.open && modalAsignacion.pedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Header Modal */}
            <div className="p-5 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Scissors className="size-4 text-main-red" />
                  <span>Asignar Cortador · Comanda #{modalAsignacion.pedido.id}</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Cliente: <strong>{modalAsignacion.pedido.cliente_nombre || "Cliente"}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalAsignacion({ open: false, pedido: null })}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Controles de Ordenamiento y Búsqueda */}
            <div className="p-4 bg-neutral-950/40 border-b border-neutral-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Buscar cortador..."
                  value={filtroTextoCortador}
                  onChange={(e) => setFiltroTextoCortador(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-main-blue"
                />
                <Search className="size-3.5 text-neutral-400 absolute left-2.5 inset-y-0 my-auto" />
              </div>

              {/* Botón Switch de Orden */}
              <div className="flex items-center gap-1 bg-neutral-800 p-0.5 rounded-lg border border-neutral-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setOrdenCortadores("menos_pedidos")}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    ordenCortadores === "menos_pedidos"
                      ? "bg-main-blue text-white shadow-xs"
                      : "text-neutral-400 hover:text-white"
                  }`}
                  title="Balancear carga de trabajo"
                >
                  ⚖️ Menor carga
                </button>
                <button
                  type="button"
                  onClick={() => setOrdenCortadores("alfabetico")}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    ordenCortadores === "alfabetico"
                      ? "bg-main-blue text-white shadow-xs"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  A-Z
                </button>
              </div>
            </div>

            {/* Lista de Cortadores con Carga Diaria */}
            <div className="p-4 max-h-80 overflow-y-auto space-y-2 divide-y divide-neutral-800/60">
              {cortadoresOrdenados.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500">
                  No hay cortadores activos en esta sucursal
                </div>
              ) : (
                cortadoresOrdenados.map((c) => {
                  const isCurrent = modalAsignacion.pedido.empleado_id === c.id;
                  const isBusy = c.pedidos_en_corte > 0;

                  return (
                    <div
                      key={c.id}
                      className="pt-2 first:pt-0 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <div
                          className={`size-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isCurrent
                              ? "bg-main-red text-white"
                              : isBusy
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-neutral-800 text-neutral-300"
                          }`}
                        >
                          {c.apodo ? c.apodo.slice(0, 2).toUpperCase() : c.nombre.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-black text-white truncate">
                              {c.nombre} {c.apodo && `(${c.apodo})`}
                            </p>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-main-red/30 text-main-red text-[10px] font-black border border-main-red/50">
                                Asignado
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                            <span
                              className={`font-bold ${
                                isBusy ? "text-amber-400" : "text-emerald-400"
                              }`}
                            >
                              {c.pedidos_en_corte === 0
                                ? "🟢 Libre"
                                : `🟡 ${c.pedidos_en_corte} en corte`}
                            </span>
                            <span>·</span>
                            <span>{c.pedidos_hoy} pedidos hoy</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={asignandoId === c.id}
                        onClick={() => handleAsignarCortador(c)}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer disabled:opacity-50 shrink-0 ${
                          isCurrent
                            ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                            : "bg-main-blue hover:bg-main-blue/90 text-white shadow-md active:scale-95"
                        }`}
                      >
                        {asignandoId === c.id
                          ? "Asignando..."
                          : isCurrent
                          ? "Reasignar"
                          : "Asignar"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3.5 border-t border-neutral-800 bg-neutral-950/60 text-right">
              <button
                type="button"
                onClick={() => setModalAsignacion({ open: false, pedido: null })}
                className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal de Carga de Balanza / Pesaje ─── */}
      {modalPesaje.open && modalPesaje.pedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Scale className="size-4 text-emerald-400" />
                <span>Cargar Peso de Balanza · #{modalPesaje.pedido.id}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalPesaje({ open: false, pedido: null })}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarPesaje} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Peso Real de Balanza (kg)
                </label>
                <input
                  type="number"
                  step="0.005"
                  required
                  placeholder="Ej: 1.620"
                  value={modalPesaje.pesoFinal}
                  onChange={(e) =>
                    setModalPesaje({ ...modalPesaje, pesoFinal: e.target.value })
                  }
                  className="w-full rounded-xl bg-neutral-800 border border-neutral-700 px-3.5 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Monto Final Exacto ($)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="Ej: 12960"
                  value={modalPesaje.montoFinal}
                  onChange={(e) =>
                    setModalPesaje({ ...modalPesaje, montoFinal: e.target.value })
                  }
                  className="w-full rounded-xl bg-neutral-800 border border-neutral-700 px-3.5 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalPesaje({ open: false, pedido: null })}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer transition-all"
                >
                  Confirmar y Marcar Listo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Tarjeta individual de comanda para TV KDS
 */
function ComandaCard({ pedido, puedeGestionar, onAsignar, onPesaje }) {
  const items = Array.isArray(pedido.items) ? pedido.items : [];

  return (
    <div className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl p-4 transition-all shadow-md flex flex-col gap-3">
      {/* Header Comanda */}
      <div className="flex items-start justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-white font-mono">
              #{pedido.id}
            </span>
            <span className="px-2 py-0.2 rounded bg-neutral-800 text-[10px] font-extrabold uppercase text-neutral-300 tracking-wider">
              {pedido.tipo_entrega?.replace("_", " ")}
            </span>
          </div>
          <p className="text-xs font-bold text-neutral-300 mt-0.5 truncate">
            {pedido.cliente_nombre || "Cliente"}
          </p>
        </div>

        {/* Cortador Asignado */}
        {pedido.empleado_nombre ? (
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-neutral-500 block">
              Cortador
            </span>
            <span className="text-xs font-black text-main-blue bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-lg inline-block">
              {pedido.empleado_nombre}
            </span>
          </div>
        ) : (
          <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
            Sin Cortador
          </span>
        )}
      </div>

      {/* Items y Cortes detallados */}
      <div className="space-y-2">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="p-2 rounded-lg bg-neutral-900/80 border border-neutral-800/60 flex items-start justify-between gap-2 text-xs"
          >
            <div className="min-w-0">
              <p className="font-black text-white leading-snug">
                {it.nombre_producto}
              </p>
              {it.fraccion && (
                <p className="text-[11px] font-extrabold text-amber-400 mt-0.5">
                  ✂️ {it.fraccion}
                </p>
              )}
            </div>
            <span className="font-black text-white font-mono bg-neutral-800 px-2 py-0.5 rounded shrink-0">
              {Number(it.cantidad_kg_solicitada || it.cantidad || 1)}{" "}
              {it.unidad_medida || "kg"}
            </span>
          </div>
        ))}
      </div>

      {/* Footer de Comanda */}
      <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80 text-xs">
        <span className="font-black text-neutral-400 font-mono">
          {formatMoney(
            pedido.monto_total_final || pedido.monto_total_estimado || pedido.monto
          )}
        </span>

        {puedeGestionar && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onAsignar}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-bold transition-colors cursor-pointer"
            >
              {pedido.empleado_nombre ? "Reasignar" : "Asignar Cortador"}
            </button>

            {pedido.estado_local === "en_corte" && (
              <button
                type="button"
                onClick={onPesaje}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition-colors cursor-pointer"
              >
                Pesar Balanza
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
