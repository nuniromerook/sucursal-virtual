// frontend-admin/src/pages/sucursales/sucursal-data/PedidosSucursal.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Bell,
  Clock,
  CheckCircle,
  Truck,
  Scissors,
  Scale,
  Package,
  Volume2,
  User,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  RefreshCw,
  AlertCircle,
  MessageCircle,
  Navigation,
  Sparkles,
} from "lucide-react";
import { VITE_API_URL } from "../../../config/api";
import { useSocket } from "../../../context/SocketContext";

const ESTADOS = [
  { key: "todos", label: "Todos los pedidos" },
  { key: "solicitado", label: "Solicitados" },
  { key: "en_corte", label: "En Corte" },
  { key: "listo", label: "Listos" },
  { key: "en_camino", label: "En Camino" },
  { key: "entregado", label: "Entregados" },
];

import { useAuth } from "../../../context/AuthContext";
import ModalAsignacionCortador from "../../../components/ModalAsignacionCortador";

export default function PedidosSucursal() {
  const { sucursal, setPedidosPendientes } = useOutletContext();
  const { ultimoPedido, reproducirSonidoComanda } = useSocket();
  const { token } = useAuth();

  const [pedidos, setPedidos] = useState([]);
  const [cortadores, setCortadores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actualizandoId, setActualizandoId] = useState(null);

  // Paginación numérica para listados grandes
  const [paginaActual, setPaginaActual] = useState(1);
  const PEDIDOS_POR_PAGINA = 9;

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroEstado]);

  // Modal para cargar peso real por cada corte
  const [modalPesaje, setModalPesaje] = useState({
    open: false,
    pedido: null,
    pesosItems: {},
  });

  const handleAbrirModalPesaje = (pedido) => {
    const pesosIniciales = {};
    if (Array.isArray(pedido.items)) {
      pedido.items.forEach((item) => {
        const val =
          item.peso_real || item.cantidad_kg_solicitada || item.cantidad_kg || 1;
        pesosIniciales[item.id] = Number(val).toFixed(3);
      });
    }
    setModalPesaje({
      open: true,
      pedido,
      pesosItems: pesosIniciales,
    });
  };

  const handlePesoItemChange = (itemId, rawVal) => {
    let cleaned = rawVal.replace(",", ".");
    cleaned = cleaned.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = `${parts[0]}.${parts.slice(1).join("")}`;
    }
    setModalPesaje((prev) => ({
      ...prev,
      pesosItems: {
        ...prev.pesosItems,
        [itemId]: cleaned,
      },
    }));
  };

  const handlePesoItemBlur = (itemId, val) => {
    const num = parseFloat(String(val).replace(",", "."));
    const fixed = isNaN(num) || num < 0 ? "0.000" : num.toFixed(3);
    setModalPesaje((prev) => ({
      ...prev,
      pesosItems: {
        ...prev.pesosItems,
        [itemId]: fixed,
      },
    }));
  };

  const handlePesoItemFocus = (e) => {
    e.target.select();
  };

  const calcularResumenPesaje = () => {
    if (!modalPesaje.pedido || !Array.isArray(modalPesaje.pedido.items)) {
      return {
        itemsArray: [],
        totalSolicitadoKg: 0,
        totalRealKg: 0,
        mermaKg: 0,
        montoTotalFinal: 0,
      };
    }

    let totalSolicitadoKg = 0;
    let totalRealKg = 0;
    let montoTotalFinal = 0;

    const itemsArray = modalPesaje.pedido.items.map((item) => {
      const kgSolicitados = Number(
        item.cantidad_kg_solicitada || item.cantidad_kg || 1,
      );
      const valStr =
        modalPesaje.pesosItems[item.id] ?? String(kgSolicitados.toFixed(3));
      const pesoRealKg = parseFloat(String(valStr).replace(",", ".")) || 0;
      const precioKg = Number(
        item.precio_por_kg_congelado || item.precio_al_agregar || item.precio || 0,
      );
      const precioFinalItem = Math.round(pesoRealKg * precioKg);

      totalSolicitadoKg += kgSolicitados;
      totalRealKg += pesoRealKg;
      montoTotalFinal += precioFinalItem;

      return {
        id: item.id,
        nombre: item.nombre_producto || `Corte #${item.catalogo_id}`,
        especie: item.especie,
        kgSolicitados,
        precioKg,
        pesoRealKg,
        precioFinalItem,
      };
    });

    const mermaKg = totalRealKg - totalSolicitadoKg;

    return {
      itemsArray,
      totalSolicitadoKg,
      totalRealKg,
      mermaKg,
      montoTotalFinal,
    };
  };

  const handleGuardarPesaje = async () => {
    if (!modalPesaje.pedido) return;
    const { itemsArray, montoTotalFinal } = calcularResumenPesaje();

    const items_pesos = itemsArray.map((i) => ({
      id: i.id,
      peso_real: i.pesoRealKg,
      precio_final: i.precioFinalItem,
    }));

    await handleCambiarEstado(modalPesaje.pedido.id, "listo", {
      items_pesos,
      monto_final_real: montoTotalFinal,
    });

    setModalPesaje({
      open: false,
      pedido: null,
      pesosItems: {},
    });
  };

  const loadData = async () => {
    if (!sucursal?.id) return;
    setIsLoading(true);
    try {
      const [resPedidos, resCortadores] = await Promise.all([
        fetch(`${VITE_API_URL}/sucursales/${sucursal.id}/pedidos`),
        fetch(`${VITE_API_URL}/sucursales/${sucursal.id}/cortadores-carga`),
      ]);

      const dataPedidos = await resPedidos.json();
      const dataCortadores = await resCortadores.json();

      setPedidos(Array.isArray(dataPedidos) ? dataPedidos : []);
      setCortadores(Array.isArray(dataCortadores) ? dataCortadores : []);

      const pendientes = Array.isArray(dataPedidos)
        ? dataPedidos.filter(
            (p) => !["entregado", "cancelado"].includes(p.estado),
          ).length
        : 0;
      if (typeof setPedidosPendientes === "function") {
        setPedidosPendientes(pendientes);
      }
    } catch (error) {
      console.error(
        "Error al cargar pedidos y empleados de la sucursal:",
        error,
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sucursal?.id]);

  // Actualizar en tiempo real cuando llega un nuevo pedido vía Socket.io
  useEffect(() => {
    if (ultimoPedido && ultimoPedido.sucursal_id === sucursal?.id) {
      setPedidos((prev) => {
        const existe = prev.some((p) => p.id === ultimoPedido.id);
        if (existe)
          return prev.map((p) => (p.id === ultimoPedido.id ? ultimoPedido : p));
        return [ultimoPedido, ...prev];
      });

      if (typeof setPedidosPendientes === "function") {
        setPedidosPendientes((prev) => prev + 1);
      }
    }
  }, [ultimoPedido?.id, sucursal?.id]);

  const [modalAsignacion, setModalAsignacion] = useState({ open: false, pedido: null });

  const handleAsignarCortador = async (cortador) => {
    if (!modalAsignacion.pedido) return;
    setActualizandoId(modalAsignacion.pedido.id);
    try {
      const res = await fetch(
        `${VITE_API_URL}/pedidos/${modalAsignacion.pedido.id}/estado`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            estado_local: "en_corte",
            cortador_id: cortador.id,
          }),
        }
      );
      if (res.ok) {
        setModalAsignacion({ open: false, pedido: null });
        loadData();
      }
    } catch (error) {
      console.error("Error asignando cortador:", error);
    } finally {
      setActualizandoId(null);
    }
  };

  // Cambiar estado operativo del pedido
  const handleCambiarEstado = async (pedidoId, nuevoEstado, extraData = {}) => {
    setActualizandoId(pedidoId);
    try {
      const res = await fetch(`${VITE_API_URL}/pedidos/${pedidoId}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ estado: nuevoEstado, ...extraData }),
      });
      const data = await res.json();

      if (res.ok && data.pedido) {
        setPedidos((prev) =>
          prev.map((p) => (p.id === pedidoId ? { ...p, ...data.pedido } : p)),
        );
      }
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    } finally {
      setActualizandoId(null);
    }
  };



  const pedidosFiltrados = useMemo(() => {
    if (filtroEstado === "todos") return pedidos;
    return pedidos.filter((p) => p.estado === filtroEstado);
  }, [pedidos, filtroEstado]);

  const totalPaginas = Math.ceil(pedidosFiltrados.length / PEDIDOS_POR_PAGINA) || 1;

  const pedidosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * PEDIDOS_POR_PAGINA;
    return pedidosFiltrados.slice(inicio, inicio + PEDIDOS_POR_PAGINA);
  }, [pedidosFiltrados, paginaActual]);

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
      label: estado,
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
        label: "Vacuno",
        emoji: "🥩",
        color: "bg-red-50 text-red-700 border-red-200",
      },
      cerdo: {
        label: "Cerdo",
        emoji: "🐷",
        color: "bg-rose-50 text-rose-700 border-rose-200",
      },
      pollo: {
        label: "Pollo",
        emoji: "🍗",
        color: "bg-amber-50 text-amber-700 border-amber-200",
      },
      embutidos: {
        label: "Embutido",
        emoji: "🌭",
        color: "bg-orange-50 text-orange-700 border-orange-200",
      },
      preparados: {
        label: "Elaborado",
        emoji: "🍲",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
    };
    const conf = map[esp] || {
      label: especie,
      emoji: "🥩",
      color: "bg-neutral-100 text-neutral-700 border-neutral-200",
    };
    return (
      <span
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-1 shrink-0 ${conf.color}`}
      >
        <span>{conf.emoji}</span>
        <span className="uppercase">{conf.label}</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ─── Barra Superior de Comandas ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border bg-white border-neutral-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="size-10 aspect-square rounded-lg bg-main-blue/10 flex items-center justify-center text-main-blue font-black">
            <Bell className="size-5 shrink-0" />
          </div>
          <div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-2">
              <h2 className="font-black text-base sm:text-lg text-neutral-900">
                Comandas en Vivo: {sucursal?.nombre}
              </h2>
              <span className="flex w-fit bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase animate-pulse">
                Socket.io Activo
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Los pedidos entrantes aparecen instantáneamente y reproducen el
              timbre 🔔
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

      {/* ─── Filtros de Estado (Por defecto "Solicitado") ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
        {ESTADOS.map((est) => {
          const isSelected = filtroEstado === est.key;
          const count =
            est.key === "todos"
              ? pedidos.length
              : pedidos.filter((p) => p.estado === est.key).length;
          return (
            <button
              key={est.key}
              type="button"
              onClick={() => setFiltroEstado(est.key)}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? "bg-main-blue text-white shadow-2xs"
                  : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              <span>{est.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Grilla / Tablero de Comandas ─── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white border border-neutral-200 p-4 rounded-xl h-48"
            />
          ))}
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
          {pedidosPaginados.map((pedido) => {
            const isPendingAction = actualizandoId === pedido.id;
            const cortadorAsignado =
              pedido.cortador_apodo || pedido.cortador_nombre;

            return (
              <div
                key={pedido.id}
                className="flex flex-col justify-between rounded-lg border p-4 sm:p-5 transition-all bg-white border-neutral-200/80 shadow-2xs hover:shadow-xs"
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
                          { hour: "2-digit", minute: "2-digit", hour12: false },
                        )}{" "}
                        hs
                      </span>
                    </div>
                    {badgeEstado(pedido.estado)}
                  </div>

                  {/* Cortador asignado badge */}
                  {cortadorAsignado && (
                    <div className="mb-3 flex items-center gap-1.5 bg-blue-50/70 border border-blue-200/70 px-2.5 py-1 rounded-lg text-sm font-bold text-blue-900">
                      <Scissors className="size-3.5 text-blue-700 shrink-0" />
                      <span>
                        Cortador: <strong>{cortadorAsignado}</strong>
                      </span>
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
                      <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Phone className="size-3.5" />{" "}
                        {pedido.cliente_telefono || "Sin teléfono"}
                      </p>
                    </div>
                    {pedido.cliente_telefono && (
                      <a
                        href={`https://wa.me/${pedido.cliente_telefono.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
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
                          {pedido.direccion_entrega || "A domicilio"}
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
                      Cortes Solicitados (
                      {Array.isArray(pedido.items) ? pedido.items.length : 0})
                    </p>
                    <ul className="divide-y divide-neutral-100 max-h-48 overflow-y-auto text-sm">
                      {Array.isArray(pedido.items) &&
                        pedido.items.map((item, idx) => (
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
                              {item.cantidad_kg} {item.unidad_medida || "kg"}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>

                {/* Footer: Montos y Flujo Operativo */}
                <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 font-medium">
                      Total del Pedido:
                    </span>
                    <span className="font-black text-lg text-neutral-900">
                      $
                      {Number(
                        pedido.monto_total_estimado ||
                          pedido.monto ||
                          pedido.monto_final_real ||
                          0,
                      ).toLocaleString("es-AR")}
                    </span>
                  </div>

                  {/* Botones según el estado actual */}
                  <div className="grid grid-cols-1 gap-1.5 mt-5">
                    {/* PASO 1: Solicitado -> Botonera de Cortadores Designados */}
                    {pedido.estado === "solicitado" && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-bold text-neutral-600 flex items-center gap-1">
                          <Scissors className="size-3 text-blue-600" />
                          ¿Quién fracciona este pedido?
                        </span>

                        <button
                          type="button"
                          disabled={isPendingAction}
                          onClick={() => setModalAsignacion({ open: true, pedido })}
                          className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs mt-2"
                        >
                          <Scissors className="size-3.5" />
                          <span>Asignar Cortador</span>
                        </button>
                      </div>
                    )}

                    {/* PASO 2: En Corte -> Cargar Pesaje Real y Marcar Listo */}
                    {pedido.estado === "en_corte" && (
                      <button
                        type="button"
                        onClick={() => handleAbrirModalPesaje(pedido)}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Scale className="size-3.5" />
                        <span>Cargar Pesaje Real & Marcar Listo</span>
                      </button>
                    )}

                    {/* Compatibilidad pedidos antiguos en estado pesado */}
                    {pedido.estado === "pesado" && (
                      <button
                        type="button"
                        disabled={isPendingAction}
                        onClick={() =>
                          handleCambiarEstado(pedido.id, "listo")
                        }
                        className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <CheckCircle className="size-3.5" />
                        <span>Marcar Como Listo</span>
                      </button>
                    )}

                    {/* PASO 4: Listo -> Despacho PedidosYa / Logística Propia / Mostrador */}
                    {pedido.estado === "listo" && (
                      <div className="flex flex-col gap-1.5">
                        {pedido.tipo_entrega !== "retiro_sucursal" ? (
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              disabled={isPendingAction}
                              onClick={() =>
                                handleCambiarEstado(pedido.id, "en_camino", {
                                  logistica: "pedidosya",
                                })
                              }
                              className="py-2 px-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Truck className="size-3.5" />
                              <span>PedidosYa</span>
                            </button>
                            <button
                              type="button"
                              disabled={isPendingAction}
                              onClick={() =>
                                handleCambiarEstado(pedido.id, "en_camino", {
                                  logistica: "particular",
                                })
                              }
                              className="py-2 px-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Navigation className="size-3.5" />
                              <span>Cadete Propio</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isPendingAction}
                            onClick={() =>
                              handleCambiarEstado(pedido.id, "entregado")
                            }
                            className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          >
                            <CheckCircle className="size-3.5" />
                            <span>Entregar en Mostrador</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* PASO 5: En Camino -> Confirmar Entrega */}
                    {pedido.estado === "en_camino" && (
                      <button
                        type="button"
                        disabled={isPendingAction}
                        onClick={() =>
                          handleCambiarEstado(pedido.id, "entregado")
                        }
                        className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <CheckCircle className="size-3.5" />
                        <span>Confirmar Entrega</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* ─── Paginación Numérica para Historial / Listados ─── */}
        {totalPaginas > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
            <span className="text-xs text-neutral-500 font-semibold">
              Mostrando {(paginaActual - 1) * PEDIDOS_POR_PAGINA + 1} -{" "}
              {Math.min(
                paginaActual * PEDIDOS_POR_PAGINA,
                pedidosFiltrados.length,
              )}{" "}
              de {pedidosFiltrados.length} pedidos
            </span>

            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <button
                type="button"
                disabled={paginaActual === 1}
                onClick={() => {
                  setPaginaActual((prev) => Math.max(prev - 1, 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-3 py-1.5 rounded-lg border text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-50 border-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Anterior
              </button>

              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setPaginaActual(num);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`size-8 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    paginaActual === num
                      ? "bg-main-blue text-white shadow-2xs"
                      : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                disabled={paginaActual === totalPaginas}
                onClick={() => {
                  setPaginaActual((prev) => Math.min(prev + 1, totalPaginas));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-3 py-1.5 rounded-lg border text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-50 border-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

      {/* ─── Modal de Carga de Peso Real por Corte ─── */}
      {modalPesaje.open && modalPesaje.pedido && (() => {
        const { itemsArray, totalSolicitadoKg, totalRealKg, mermaKg } = calcularResumenPesaje();
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 text-neutral-900 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2 text-main-blue">
                  <Scale className="size-6 shrink-0" />
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-neutral-900">
                      Pesaje Real · Comanda #{modalPesaje.pedido.id}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Ingresá el peso exacto de balanza por cada corte solicitado
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de Cortes e Inputs */}
              <div className="py-4 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {itemsArray.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Párrafo con nombre y kilaje pedido */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-neutral-900 truncate">
                          {item.nombre}
                        </span>
                        {item.especie && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-200 text-neutral-700 capitalize shrink-0">
                            {item.especie}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        Pedido: <strong className="text-neutral-900">{item.kgSolicitados.toFixed(3)} kg</strong>
                      </p>
                    </div>

                    {/* Input de peso real */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="flex flex-col items-end">
                        <label className="text-[10px] font-bold uppercase text-neutral-500 mb-0.5">
                          Peso Real (kg)
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={modalPesaje.pesosItems[item.id] ?? ""}
                            onFocus={handlePesoItemFocus}
                            onChange={(e) => handlePesoItemChange(item.id, e.target.value)}
                            onBlur={(e) => handlePesoItemBlur(item.id, e.target.value)}
                            className="w-28 px-3 py-1.5 text-right font-black text-sm rounded-lg border border-neutral-300 focus:border-main-blue focus:ring-2 focus:ring-main-blue/20 outline-none bg-white text-neutral-900"
                            placeholder="0.000"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen de Kilaje & Merma (Sin precios) */}
              <div className="p-3.5 rounded-xl bg-neutral-900 text-white space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 font-semibold">Total Solicitado:</span>
                  <span className="font-bold">{totalSolicitadoKg.toFixed(3)} kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 font-semibold">Total Peso Real:</span>
                  <span className="font-black text-emerald-400">{totalRealKg.toFixed(3)} kg</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-neutral-800 text-sm">
                  <span className="text-neutral-300 font-extrabold">Diferencia / Merma:</span>
                  <span className={`font-black ${mermaKg >= 0 ? "text-amber-400" : "text-red-400"}`}>
                    {mermaKg >= 0 ? `+${mermaKg.toFixed(3)} kg` : `${mermaKg.toFixed(3)} kg`}
                  </span>
                </div>
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() =>
                    setModalPesaje({
                      open: false,
                      pedido: null,
                      pesosItems: {},
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarPesaje}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle className="size-4" />
                  <span>Guardar Pesos & Marcar Listo</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <ModalAsignacionCortador
        isOpen={modalAsignacion.open && modalAsignacion.pedido}
        onClose={() => setModalAsignacion({ open: false, pedido: null })}
        pedido={modalAsignacion.pedido}
        cortadores={cortadores}
        onAssign={handleAsignarCortador}
        isAssigning={actualizandoId === modalAsignacion.pedido?.id}
      />
    </div>
  );
}
