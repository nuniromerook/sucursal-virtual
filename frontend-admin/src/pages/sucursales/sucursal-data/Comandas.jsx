// frontend-admin/src/pages/sucursales/sucursal-data/Comandas.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Volume2,
  VolumeX,
  RefreshCw,
  Scissors,
  Package,
  Truck,
  User,
  Phone,
  MessageCircle,
  Clock,
  Radio,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Maximize2,
} from "lucide-react";
import { VITE_API_URL } from "../../../config/api";
import { useSocket } from "../../../context/SocketContext";
import { useAuth } from "../../../context/AuthContext";
import { formatMoney } from "../../../utils/formatters";

const ESTADOS = [
  { key: "todos", label: "Todos los pedidos" },
  { key: "solicitado", label: "Solicitados" },
  { key: "en_corte", label: "En Corte" },
  { key: "pesado", label: "Esperando Aprobación" },
  { key: "listo", label: "Listos" },
  { key: "en_camino", label: "En Camino" },
  { key: "entregado", label: "Entregados" },
];

export default function Comandas() {
  const { slug } = useParams();
  const { user } = useAuth();
  const {
    socket,
    isConnected,
    joinSucursal,
    leaveSucursal,
    reproducirSonidoComanda,
    ultimoPedido,
  } = useSocket();
  const navigate = useNavigate();

  const [sucursal, setSucursal] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [cortadores, setCortadores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [actualizandoId, setActualizandoId] = useState(null);

  // Modal de Asignación de Cortador
  const [modalAsignacion, setModalAsignacion] = useState({
    open: false,
    pedido: null,
  });
  const [ordenCortadores, setOrdenCortadores] = useState("menos_pedidos"); // "menos_pedidos" | "alfabetico"
  const [filtroTextoCortador, setFiltroTextoCortador] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const puedeGestionar = Boolean(
    user &&
    (user.rol === "admin" ||
      user.rol === "administrador" ||
      user.rol === "encargado"),
  );

  // 1. Cargar datos de la sucursal y pedidos
  const loadData = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    try {
      // Obtener info de la sucursal
      const resSuc = await fetch(`${VITE_API_URL}/sucursales/${slug}`);
      const dataSuc = await resSuc.json();
      if (dataSuc.error) return;
      setSucursal(dataSuc);

      // Unir socket a la sala de esta sucursal
      if (dataSuc.id) {
        joinSucursal(dataSuc.id);
      }

      // Cargar pedidos y cortadores con carga
      const [resPed, resCort] = await Promise.all([
        fetch(`${VITE_API_URL}/sucursales/${dataSuc.id}/pedidos`),
        fetch(`${VITE_API_URL}/sucursales/${dataSuc.id}/cortadores-carga`),
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
      console.error("Error al cargar comandas:", err);
    } finally {
      setIsLoading(false);
    }
  }, [slug, joinSucursal]);

  useEffect(() => {
    loadData();

    return () => {
      if (sucursal?.id) {
        leaveSucursal(sucursal.id);
      }
    };
  }, [slug, loadData]);

  // 2. Escuchar eventos Socket.io en tiempo real y reproducir timbre
  useEffect(() => {
    if (!socket) return;

    const handleNuevoPedido = (pedido) => {
      if (sucursal?.id && Number(pedido.sucursal_id) === Number(sucursal.id)) {
        reproducirSonidoComanda();
        setPedidos((prev) => {
          if (prev.some((p) => p.id === pedido.id)) return prev;
          return [pedido, ...prev];
        });
      }
    };

    const handlePedidoActualizado = (pedido) => {
      if (sucursal?.id && Number(pedido.sucursal_id) === Number(sucursal.id)) {
        setPedidos((prev) =>
          prev.map((p) => (p.id === pedido.id ? { ...p, ...pedido } : p)),
        );
      }
    };

    socket.on("nuevo_pedido", handleNuevoPedido);
    socket.on("pedido_actualizado", handlePedidoActualizado);

    return () => {
      socket.off("nuevo_pedido", handleNuevoPedido);
      socket.off("pedido_actualizado", handlePedidoActualizado);
    };
  }, [socket, sucursal?.id, reproducirSonidoComanda]);

  // Escuchar cuando SocketContext reciba un nuevo pedido global
  useEffect(() => {
    if (
      ultimoPedido &&
      sucursal?.id &&
      Number(ultimoPedido.sucursal_id) === Number(sucursal.id)
    ) {
      setPedidos((prev) => {
        if (prev.some((p) => p.id === ultimoPedido.id)) return prev;
        return [ultimoPedido, ...prev];
      });
    }
  }, [ultimoPedido, sucursal?.id]);

  // 3. Asignar cortador al pedido
  const handleAsignarCortador = async (cortador) => {
    if (!modalAsignacion.pedido) return;
    setActualizandoId(modalAsignacion.pedido.id);

    try {
      const res = await fetch(
        `${VITE_API_URL}/pedidos/${modalAsignacion.pedido.id}/estado`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cortador_id: cortador.id,
            estado: "en_corte",
          }),
        },
      );

      const data = await res.json();
      if (res.ok) {
        setModalAsignacion({ open: false, pedido: null });
        loadData();
      }
    } catch (err) {
      console.error("Error al asignar cortador:", err);
    } finally {
      setActualizandoId(null);
    }
  };

  // 4. Filtrar pedidos por estado
  const pedidosFiltrados = useMemo(() => {
    if (filtroEstado === "todos") return pedidos;
    return pedidos.filter((p) => (p.estado || p.estado_local) === filtroEstado);
  }, [pedidos, filtroEstado]);

  // Atajos de teclado para KDS
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorar si el usuario está escribiendo en un input o el modal está abierto
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA"
      )
        return;
      if (modalAsignacion.open) return;

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setFocusedIndex((prev) =>
          Math.min(prev + 1, pedidosFiltrados.length - 1),
        );
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        const pedido = pedidosFiltrados[focusedIndex];
        if (pedido) {
          navigate(`/admin/sucursales/${slug}/comandas/${pedido.id}`);
        }
      } else if (e.key === "Escape") {
        setFocusedIndex(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pedidosFiltrados, focusedIndex, modalAsignacion.open, slug, navigate]);

  // Contadores para las pestañas
  const conteoPorEstado = useMemo(() => {
    const counts = {};
    ESTADOS.forEach((e) => (counts[e.key] = 0));
    pedidos.forEach((p) => {
      const est = p.estado || p.estado_local;
      counts.todos = (counts.todos || 0) + 1;
      if (counts[est] !== undefined) {
        counts[est] += 1;
      }
    });
    return counts;
  }, [pedidos]);

  // Cortadores ordenados para el modal
  const cortadoresOrdenados = useMemo(() => {
    let list = [...cortadores];

    if (filtroTextoCortador.trim()) {
      const q = filtroTextoCortador.toLowerCase().trim();
      list = list.filter(
        (c) =>
          (c.nombre || "").toLowerCase().includes(q) ||
          (c.apodo || "").toLowerCase().includes(q),
      );
    }

    if (ordenCortadores === "menos_pedidos") {
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

  const badgeEstado = (estado) => {
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
        bg: "bg-purple-50 text-purple-800 border-purple-200 animate-pulse",
      },
      listo: {
        label: "Listo para Despacho",
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
      cancelado: {
        label: "Cancelado",
        bg: "bg-red-50 text-red-700 border-red-200",
      },
    };
    const conf = map[estado] || {
      label: estado || "Solicitado",
      bg: "bg-neutral-100 text-neutral-600 border-neutral-200",
    };
    return (
      <span
        className={`text-xs font-bold px-2.5 py-0.5 rounded-sm border ${conf.bg}`}
      >
        {conf.label}
      </span>
    );
  };

  const especieBadge = (especie) => {
    if (!especie) return null;
    const esp = String(especie).toLowerCase().trim();
    const map = {
      vacuno: {
        label: "VACUNO",
        color: "bg-red-50 text-red-700 border-red-200",
      },
      cerdo: {
        label: "CERDO",
        color: "bg-rose-50 text-rose-700 border-rose-200",
      },
      pollo: {
        label: "POLLO",
        color: "bg-amber-50 text-amber-800 border-amber-200",
      },
      embutidos: {
        label: "EMBUTIDOS",
        color: "bg-orange-50 text-orange-800 border-orange-200",
      },
      almacen: {
        label: "ALMACÉN",
        color: "bg-slate-50 text-slate-700 border-slate-200",
      },
    };
    const conf = map[esp];
    if (!conf) return null;
    return (
      <span
        className={`text-[10px] font-black uppercase px-1.5 py-0.2 rounded border ${conf.color}`}
      >
        {conf.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 font-sans select-none">
      <div className="max-w-7xl mx-auto flex flex-col gap-5">
        {/* ─── Barra Superior de Comandas ─── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border bg-white border-neutral-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="size-10 aspect-square rounded-lg bg-main-blue/10 flex items-center justify-center text-main-blue font-black">
              <Bell className="size-5 shrink-0" />
            </div>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <h2 className="font-black text-base sm:text-lg text-neutral-900">
                  Comandas en Vivo: {sucursal?.nombre || "Cargando..."}
                </h2>
                <span className="flex w-fit bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase animate-pulse">
                  Socket.io Activo
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {puedeGestionar
                  ? `Panel de Encargado (${user.nombre}) · Asignación y gestión habilitada`
                  : "Los pedidos entrantes aparecen instantáneamente y reproducen el timbre 🔔"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botón probar timbre */}
            <button
              type="button"
              onClick={reproducirSonidoComanda}
              title="Probar timbre de comanda"
              className="p-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-700"
            >
              <Volume2 className="size-4" />
              <span className="inline">Probar Timbre</span>
            </button>

            {/* Botón refrescar */}
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="p-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-700"
            >
              <RefreshCw
                className={`size-4 ${isLoading ? "animate-spin" : ""}`}
              />
              <span className="inline">Refrescar</span>
            </button>
          </div>
        </div>

        {/* ─── Filtros de Estado ─── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {ESTADOS.map((est) => {
            const isActive = filtroEstado === est.key;
            const count = conteoPorEstado[est.key] || 0;

            return (
              <button
                key={est.key}
                type="button"
                onClick={() => setFiltroEstado(est.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-main-blue text-white shadow-2xs"
                    : "bg-white text-neutral-600 border border-neutral-200/80 hover:bg-neutral-50"
                }`}
              >
                <span>{est.label}</span>
                <span
                  className={`text-[11px] font-black rounded-full px-1.5 py-0.2 min-w-4 text-center ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── Grilla de Comandas ─── */}
        {isLoading && pedidos.length === 0 ? (
          <div className="text-center py-16 rounded-xl border bg-white border-neutral-200/80 shadow-2xs">
            <RefreshCw className="size-8 mx-auto mb-2 text-main-blue animate-spin" />
            <p className="text-sm font-bold text-neutral-600">
              Conectando con la sucursal...
            </p>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center py-16 rounded-xl border bg-white border-neutral-200/80 shadow-2xs">
            <Package className="size-12 mx-auto mb-3 opacity-40 stroke-1" />
            <h3 className="font-bold text-base text-neutral-800">
              No hay pedidos en estado "
              {ESTADOS.find((e) => e.key === filtroEstado)?.label}"
            </h3>
            <p className="text-xs opacity-60 mt-1">
              Los pedidos entrantes aparecerán acá automáticamente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pedidosFiltrados.map((pedido, idx) => {
              const cortadorAsignado =
                pedido.cortador_apodo ||
                pedido.cortador_nombre ||
                pedido.empleado_nombre;
              const items = Array.isArray(pedido.items) ? pedido.items : [];
              const estadoActual =
                pedido.estado || pedido.estado_local || "solicitado";

              return (
                <div
                  key={pedido.id}
                  className={`flex flex-col justify-between rounded-lg border p-4 sm:p-5 transition-all bg-white shadow-2xs hover:shadow-xs cursor-pointer ${
                    focusedIndex === idx
                      ? "ring-2 ring-main-blue border-main-blue scale-[1.02] shadow-md"
                      : "border-neutral-200/80"
                  }`}
                  onClick={() =>
                    navigate(`/admin/sucursales/${slug}/comandas/${pedido.id}`)
                  }
                >
                  <div>
                    {/* Header de la Comanda */}
                    <div className="flex items-center justify-between gap-2 border-b pb-3 mb-3 text-sm border-neutral-100">
                      <div>
                        <span className="text-xl font-black tracking-tight text-main-blue">
                          #{pedido.id}
                        </span>
                        <span className="ml-2 text-neutral-400">
                          {new Date(pedido.creado_en).toLocaleTimeString(
                            "es-AR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            },
                          )}{" "}
                          hs
                        </span>
                      </div>
                      {badgeEstado(estadoActual)}
                    </div>

                    {/* Cortador asignado badge */}
                    {cortadorAsignado && (
                      <div className="mb-3 flex items-center justify-between gap-1.5 bg-blue-50/70 border border-blue-200/70 px-2.5 py-1 rounded-lg text-sm font-bold text-blue-900">
                        <div className="flex items-center gap-1.5">
                          <Scissors className="size-3.5 text-blue-700 shrink-0" />
                          <span>
                            Cortador: <strong>{cortadorAsignado}</strong>
                          </span>
                        </div>
                        {puedeGestionar && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalAsignacion({ open: true, pedido });
                            }}
                            className="text-xs text-blue-700 hover:text-blue-900 underline cursor-pointer font-medium"
                          >
                            Cambiar
                          </button>
                        )}
                      </div>
                    )}

                    {/* Datos del Cliente */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="size-8 rounded-full bg-main-blue/10 flex items-center justify-center text-main-blue font-bold text-xs shrink-0">
                        {pedido.cliente_nombre ? (
                          pedido.cliente_nombre.charAt(0).toUpperCase()
                        ) : (
                          <User className="size-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-bold truncate leading-tight text-neutral-900">
                            {pedido.cliente_nombre
                              ? pedido.cliente_nombre
                                  .replace(/\s*\(@[^)]+\)/g, "")
                                  .trim()
                              : "Cliente Valette"}
                          </p>
                          {pedido.cliente_usuario && (
                            <span className="text-[11px] font-bold text-main-blue bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60">
                              @{pedido.cliente_usuario.replace(/^@/, "")}
                            </span>
                          )}
                        </div>

                        {/* Teléfono: Solo visible para Encargado / Admin */}
                        {puedeGestionar && (
                          <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                            <Phone className="size-3.5" />{" "}
                            {pedido.cliente_telefono || "Sin teléfono"}
                          </p>
                        )}
                      </div>

                      {/* Botón WhatsApp: Solo visible para Encargado / Admin */}
                      {puedeGestionar && pedido.cliente_telefono && (
                        <a
                          href={`https://wa.me/${pedido.cliente_telefono.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          title="Contactar por WhatsApp"
                        >
                          <MessageCircle className="size-5" />
                        </a>
                      )}
                    </div>

                    {/* Tipo de entrega */}
                    <div className="flex items-center gap-1.5 text-xs uppercase text-neutral-600 mb-3 bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                      {pedido.tipo_entrega !== "retiro_sucursal" ? (
                        <>
                          <Truck className="size-3.5 text-main-blue shrink-0" />
                          <span className="truncate">
                            <strong>Envío:</strong>{" "}
                            {puedeGestionar
                              ? pedido.direccion_entrega || "A domicilio"
                              : "A Domicilio"}
                          </span>
                        </>
                      ) : (
                        <>
                          <Package className="size-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>Retira en mostrador</strong>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Lista de Cortes / Items */}
                    <div className="space-y-1.5 mb-4">
                      <p className="text-xs uppercase font-bold tracking-wider text-neutral-400">
                        Cortes Solicitados ({items.length})
                      </p>
                      <ul className="divide-y divide-neutral-100 max-h-48 overflow-y-auto text-sm">
                        {items.map((item, idx) => (
                          <li
                            key={idx}
                            className="py-2 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-neutral-900 truncate">
                                {item.nombre_producto ||
                                  `Corte #${item.catalogo_id}`}
                              </span>
                              {especieBadge(item.especie)}
                            </div>
                            <span className="font-black text-neutral-900 bg-neutral-100 px-2.5 py-0.5 rounded text-xs shrink-0">
                              {Number(
                                item.cantidad_kg ||
                                  item.cantidad_kg_solicitada ||
                                  item.cantidad ||
                                  1,
                              )}{" "}
                              {item.unidad_medida || "kg"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Footer: Montos y Botón de Asignación */}
                  <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500 font-medium">
                        {pedido.monto_final_real
                          ? "Monto final real:"
                          : "Monto estimado:"}
                      </span>
                      <span className="font-black text-lg text-neutral-900">
                        $
                        {Number(
                          pedido.monto_final_real ||
                            pedido.monto_total_final ||
                            pedido.monto_total_estimado ||
                            pedido.monto ||
                            0,
                        ).toLocaleString("es-AR")}
                      </span>
                    </div>

                    {/* Botón ¿Quién fracciona? -> Solo para Encargado / Admin */}
                    {puedeGestionar &&
                      !cortadorAsignado &&
                      estadoActual === "solicitado" && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalAsignacion({ open: true, pedido });
                            }}
                            className="w-full py-2.5 px-3 rounded-lg bg-main-blue hover:bg-main-blue/90 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:scale-[1.01]"
                          >
                            <Scissors className="size-4" />
                            <span>Asignar Cortador</span>
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Modal de Asignación de Cortador con Balanceo de Carga ─── */}
      {modalAsignacion.open && modalAsignacion.pedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-neutral-200">
            {/* Header Modal */}
            <div className="p-5 border-b border-neutral-100 bg-neutral-50/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-neutral-900 flex items-center gap-2">
                  <Scissors className="size-4 text-main-blue" />
                  <span>
                    Asignar Cortador · Comanda #{modalAsignacion.pedido.id}
                  </span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Cliente:{" "}
                  <strong>
                    {modalAsignacion.pedido.cliente_nombre || "Cliente"}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setModalAsignacion({ open: false, pedido: null })
                }
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Controles de Orden y Búsqueda */}
            <div className="p-4 bg-white border-b border-neutral-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Buscar cortador..."
                  value={filtroTextoCortador}
                  onChange={(e) => setFiltroTextoCortador(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-main-blue focus:bg-white"
                />
                <Search className="size-3.5 text-neutral-400 absolute left-2.5 inset-y-0 my-auto" />
              </div>

              {/* Botón Switch de Orden */}
              <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setOrdenCortadores("menos_pedidos")}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    ordenCortadores === "menos_pedidos"
                      ? "bg-main-blue text-white shadow-xs"
                      : "text-neutral-600 hover:text-neutral-900"
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
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  A-Z
                </button>
              </div>
            </div>

            {/* Lista de Cortadores con Carga Diaria */}
            <div className="p-4 max-h-80 overflow-y-auto space-y-2 divide-y divide-neutral-100">
              {cortadoresOrdenados.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500">
                  No hay cortadores activos registrados en esta sucursal
                </div>
              ) : (
                cortadoresOrdenados.map((c) => {
                  const isCurrent =
                    modalAsignacion.pedido.cortador_id === c.id ||
                    modalAsignacion.pedido.empleado_id === c.id;
                  const isBusy = Number(c.pedidos_en_corte) > 0;

                  return (
                    <div
                      key={c.id}
                      className="pt-2 first:pt-0 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <div
                          className={`size-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isCurrent
                              ? "bg-main-blue text-white"
                              : isBusy
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {c.apodo
                            ? c.apodo.slice(0, 2).toUpperCase()
                            : c.nombre.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-black text-neutral-900 truncate">
                              {c.nombre} {c.apodo && `(${c.apodo})`}
                            </p>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-main-blue text-[10px] font-black border border-blue-200">
                                Asignado
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                            <span
                              className={`font-bold ${
                                isBusy ? "text-amber-600" : "text-emerald-600"
                              }`}
                            >
                              {isBusy
                                ? `🟡 ${c.pedidos_en_corte} en corte`
                                : "🟢 Libre"}
                            </span>
                            <span>·</span>
                            <span>{c.pedidos_hoy || 0} pedidos hoy</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={actualizandoId === modalAsignacion.pedido.id}
                        onClick={() => handleAsignarCortador(c)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 shrink-0 ${
                          isCurrent
                            ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                            : "bg-main-blue hover:bg-main-blue/90 text-white shadow-xs active:scale-95"
                        }`}
                      >
                        {actualizandoId === modalAsignacion.pedido.id
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

            <div className="p-3.5 border-t border-neutral-100 bg-neutral-50 text-right">
              <button
                type="button"
                onClick={() =>
                  setModalAsignacion({ open: false, pedido: null })
                }
                className="px-4 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-xs font-bold text-neutral-700 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
