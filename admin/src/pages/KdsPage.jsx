// admin/src/pages/KdsPage.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  RefreshCw,
  Table2,
  LayoutGrid,
  Scale,
  Search,
  XCircle,
} from "lucide-react";
import { VITE_API_URL } from "../config/api";
import { useAdmin } from "../context/AdminContext";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { formatMoney, formatDate } from "../utils/formatters";
import ComandaCard from "../components/kds/ComandaCard";
import PesajeModal from "../components/kds/PesajeModal";

const STATUS_META = {
  solicitado: {
    label: "Solicitado",
    pill: "bg-red-50 text-[#c53030] border-red-200",
    next: "en_corte",
    nextLabel: "A corte",
  },
  en_corte: {
    label: "En corte",
    pill: "bg-amber-50 text-amber-800 border-amber-200",
    next: "listo",
    nextLabel: "Marcar listo",
  },
  listo: {
    label: "Listo",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    next: "entregado",
    nextLabel: "Entregar",
  },
  entregado: {
    label: "Entregado",
    pill: "bg-slate-100 text-slate-600 border-slate-200",
    next: null,
    nextLabel: null,
  },
  cancelado: {
    label: "Cancelado",
    pill: "bg-rose-50 text-rose-700 border-rose-200",
    next: null,
    nextLabel: null,
  },
};

export default function KdsPage() {
  const { selectedSucursal, setPedidosPendientesCount, showToast } = useAdmin();
  const { socket, joinSucursal } = useSocket();
  const { authHeaders, isManager } = useAuth();
  const sucursalId = selectedSucursal?.id || 1;

  const [pedidos, setPedidos] = useState([]);
  const [cortadores, setCortadores] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState(() =>
    isManager ? "tabla" : "tarjetas",
  );

  // Modal de pesaje
  const [pesajeModalOpen, setPesajeModalOpen] = useState(false);
  const [pedidoParaPesar, setPedidoParaPesar] = useState(null);
  const [isSavingPesaje, setIsSavingPesaje] = useState(false);

  const fetchPedidosData = useCallback(async () => {
    try {
      const [pedRes, cortRes] = await Promise.all([
        fetch(`${VITE_API_URL}/sucursales/${sucursalId}/pedidos`, {
          headers: authHeaders,
        }),
        fetch(`${VITE_API_URL}/sucursales/${sucursalId}/cortadores-carga`, {
          headers: authHeaders,
        }),
      ]);

      const pedList = pedRes.ok ? await pedRes.json() : [];
      const cortList = cortRes.ok ? await cortRes.json() : [];
      return {
        pedidos: Array.isArray(pedList) ? pedList : [],
        cortadores: Array.isArray(cortList) ? cortList : [],
      };
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
    }
    return { pedidos: [], cortadores: [] };
  }, [sucursalId, authHeaders]);

  const loadPedidos = async () => {
    setIsLoading(true);
    try {
      const { pedidos: items, cortadores: corts } = await fetchPedidosData();
      setPedidos(items);
      setCortadores(corts);
      const pendientes = items.filter(
        (p) => p.estado === "solicitado" || p.estado === "en_corte",
      ).length;
      setPedidosPendientesCount(pendientes);
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    joinSucursal(sucursalId);

    let isMounted = true;
    fetchPedidosData()
      .then(({ pedidos: items, cortadores: corts }) => {
        if (!isMounted) return;
        setPedidos(items);
        setCortadores(corts);
        const pendientes = items.filter(
          (p) => p.estado === "solicitado" || p.estado === "en_corte",
        ).length;
        setPedidosPendientesCount(pendientes);
      })
      .catch((err) => {
        if (isMounted) console.error("Error al cargar pedidos:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sucursalId, fetchPedidosData, joinSucursal, setPedidosPendientesCount]);

  // Socket en tiempo real
  useEffect(() => {
    if (!socket) return;

    const syncPendientes = (list) => {
      const pendientes = list.filter(
        (p) =>
          (p.estado || p.estado_local) === "solicitado" ||
          (p.estado || p.estado_local) === "en_corte",
      ).length;
      setPedidosPendientesCount(pendientes);
    };

    const handleNuevoPedido = (pedido) => {
      setPedidos((prev) => {
        const exists = prev.find((p) => p.id === pedido.id);
        const next = exists
          ? prev.map((p) => (p.id === pedido.id ? pedido : p))
          : [pedido, ...prev];
        syncPendientes(next);
        return next;
      });
      showToast(`Nuevo pedido #${pedido.id} recibido en mostrador!`, "info");
    };

    const handlePedidoActualizado = (pedido) => {
      setPedidos((prev) => {
        const next = prev.map((p) => (p.id === pedido.id ? pedido : p));
        syncPendientes(next);
        return next;
      });
    };

    socket.on("nuevo_pedido", handleNuevoPedido);
    socket.on("pedido_actualizado", handlePedidoActualizado);

    return () => {
      socket.off("nuevo_pedido", handleNuevoPedido);
      socket.off("pedido_actualizado", handlePedidoActualizado);
    };
  }, [socket, showToast, setPedidosPendientesCount]);

  const handleChangeStatus = async (orderId, newStatus, extraPayload = {}) => {
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === orderId
          ? {
              ...p,
              ...(newStatus ? { estado: newStatus, estado_local: newStatus } : {}),
              ...extraPayload,
            }
          : p,
      ),
    );

    try {
      const res = await fetch(`${VITE_API_URL}/pedidos/${orderId}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          ...(newStatus ? { estado: newStatus } : {}),
          ...extraPayload,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.pedido) {
          setPedidos((prev) =>
            prev.map((p) => (p.id === orderId ? data.pedido : p)),
          );
        }
      }
      if (extraPayload.cortador_id) {
        showToast(`Cortador asignado al pedido #${orderId}`);
      } else if (newStatus) {
        showToast(`Pedido #${orderId} actualizado a ${newStatus.toUpperCase()}`);
      }
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    }
  };

  const handleAssignCortador = async (orderId, cortadorId) => {
    await handleChangeStatus(orderId, null, { cortador_id: Number(cortadorId) });
  };

  const handleCancelOrder = async (orderId, motivo) => {
    await handleChangeStatus(orderId, "cancelado", {
      notas: motivo || "Cancelado desde mostrador",
    });
  };

  const handleOpenPesaje = (pedido) => {
    setPedidoParaPesar(pedido);
    setPesajeModalOpen(true);
  };

  const handleConfirmarPesaje = async (orderId, pesosMap) => {
    setIsSavingPesaje(true);
    try {
      const itemsPesos = Object.entries(pesosMap).map(([itemId, pesoVal]) => ({
        item_id: Number(itemId),
        peso_real: parseFloat(pesoVal) || 0,
      }));
      const currentOrder = pedidos.find((p) => p.id === orderId);
      const currEst =
        currentOrder?.estado || currentOrder?.estado_local || "solicitado";
      const nextEstado = currEst === "solicitado" ? "en_corte" : currEst;

      const res = await fetch(`${VITE_API_URL}/pedidos/${orderId}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          estado: nextEstado,
          items_pesos: itemsPesos,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.pedido) {
          setPedidos((prev) =>
            prev.map((p) => (p.id === orderId ? data.pedido : p)),
          );
        }
      }

      showToast(`Pesaje confirmado para Pedido #${orderId}`);
      setPesajeModalOpen(false);
    } catch (err) {
      console.error("Error al guardar pesaje:", err);
      setPesajeModalOpen(false);
    } finally {
      setIsSavingPesaje(false);
    }
  };

  const filteredPedidos = useMemo(() => {
    const q = searchTerm.trim().toLowerCase().replace(/^#/, "");
    return pedidos.filter((p) => {
      const est = p.estado || p.estado_local || "solicitado";
      if (filterStatus !== "todos" && est !== filterStatus) return false;
      if (!q) return true;
      const cliente = String(
        p.cliente_nombre || p.nombre_cliente || p.cliente || "",
      ).toLowerCase();
      return String(p.id).includes(q) || cliente.includes(q);
    });
  }, [pedidos, filterStatus, searchTerm]);

  const countSolicitados = pedidos.filter(
    (p) => (p.estado || p.estado_local) === "solicitado",
  ).length;
  const countEnCorte = pedidos.filter(
    (p) => (p.estado || p.estado_local) === "en_corte",
  ).length;
  const countListos = pedidos.filter(
    (p) => (p.estado || p.estado_local) === "listo",
  ).length;

  return (
    <div className="space-y-4">
      {/* Header compacto Valette OS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Comandas Web y Despacho (KDS)
          </h1>
          <p className="text-xs text-slate-500">
            Control de pedidos en tiempo real, asignación de cortadores y pesaje de balanza.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white">
            <button
              type="button"
              onClick={() => setViewMode("tabla")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === "tabla"
                  ? "bg-[#002244] text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Tabla</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tarjetas")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === "tarjetas"
                  ? "bg-[#002244] text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tarjetas</span>
            </button>
          </div>

          <button
            type="button"
            onClick={loadPedidos}
            disabled={isLoading}
            className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shrink-0"
            title="Actualizar comandas"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#002244]" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* KPI Strip de estado rápido */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setFilterStatus("solicitado")}
          className={`text-left bg-white px-4 py-3 rounded-xl border transition-colors cursor-pointer ${
            filterStatus === "solicitado"
              ? "border-[#c53030]"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-semibold text-slate-500">
            Nuevos / solicitados
          </div>
          <div
            className={`text-xl font-extrabold tabular-nums mt-0.5 ${
              countSolicitados > 0 ? "text-[#c53030]" : "text-slate-900"
            }`}
          >
            {countSolicitados}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus("en_corte")}
          className={`text-left bg-white px-4 py-3 rounded-xl border transition-colors cursor-pointer ${
            filterStatus === "en_corte"
              ? "border-[#002244]"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-semibold text-slate-500">
            En mesa de corte
          </div>
          <div className="text-xl font-extrabold text-amber-700 tabular-nums mt-0.5">
            {countEnCorte}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus("listo")}
          className={`text-left bg-white px-4 py-3 rounded-xl border transition-colors cursor-pointer ${
            filterStatus === "listo"
              ? "border-emerald-600"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-semibold text-slate-500">
            Listos para entrega
          </div>
          <div className="text-xl font-extrabold text-emerald-700 tabular-nums mt-0.5">
            {countListos}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus("todos")}
          className={`text-left bg-white px-4 py-3 rounded-xl border transition-colors cursor-pointer ${
            filterStatus === "todos"
              ? "border-[#002244]"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="text-[11px] font-semibold text-slate-500">
            Total registrados
          </div>
          <div className="text-xl font-extrabold text-slate-900 tabular-nums mt-0.5">
            {pedidos.length}
          </div>
        </button>
      </div>

      {/* Barra de búsqueda y filtro */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar #pedido o cliente..."
            className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#002244] text-xs outline-none"
          />
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 overflow-x-auto no-scrollbar">
          {[
            { id: "todos", label: `Todos (${pedidos.length})` },
            { id: "solicitado", label: `Nuevos (${countSolicitados})` },
            { id: "en_corte", label: `En corte (${countEnCorte})` },
            { id: "listo", label: `Listos (${countListos})` },
            { id: "entregado", label: "Entregados" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap cursor-pointer transition-colors ${
                filterStatus === tab.id
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-600 font-semibold hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido: Vista Tabla rápida o Vista Tarjetas */}
      {filteredPedidos.length === 0 ? (
        <div className="py-14 text-center text-slate-400 bg-white rounded-xl border border-slate-200/90 text-xs font-medium">
          No hay comandas registradas en este estado.
        </div>
      ) : viewMode === "tabla" ? (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-native overflow-hidden">
          <div
            tabIndex={0}
            role="region"
            aria-labelledby="kds-table-caption"
            className="erp-table-wrapper"
          >
            <table className="erp-table min-w-[940px]">
              <caption id="kds-table-caption" className="sr-only-live">
                Tabla operativa de comandas web
              </caption>
              <thead>
                <tr>
                  <th scope="col">Pedido</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Entrega</th>
                  <th scope="col">Detalle de cortes</th>
                  <th scope="col">Cortador</th>
                  <th scope="col" className="text-right">
                    Total
                  </th>
                  <th scope="col">Estado</th>
                  <th scope="col" className="text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPedidos.map((pedido) => {
                  const estado =
                    pedido.estado || pedido.estado_local || "solicitado";
                  const meta = STATUS_META[estado] || STATUS_META.solicitado;
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
                  const isActive =
                    estado !== "entregado" && estado !== "cancelado";

                  return (
                    <tr key={pedido.id}>
                      <th scope="row" className="whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">
                          #{pedido.id}
                        </div>
                        <div className="text-[11px] font-normal text-slate-400 tabular-nums">
                          {pedido.creado_en || pedido.fecha
                            ? formatDate(pedido.creado_en || pedido.fecha)
                            : ""}
                        </div>
                      </th>

                      <td className="whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {clienteNombre}
                        </div>
                        {isManager && pedido.cliente_telefono && (
                          <div className="text-[11px] font-mono text-slate-400">
                            {pedido.cliente_telefono}
                          </div>
                        )}
                      </td>

                      <td className="whitespace-nowrap">
                        <div className="font-semibold text-slate-700 text-xs">
                          {isRetiro ? "Retiro mostrador" : "Envío a domicilio"}
                        </div>
                        {isManager && !isRetiro && pedido.direccion_entrega && (
                          <div className="text-[11px] text-slate-500 max-w-[200px] truncate">
                            {pedido.direccion_entrega}
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="flex flex-wrap gap-1 max-w-[280px]">
                          {items.length === 0 ? (
                            <span className="text-[11px] text-slate-400">
                              Sin detalle
                            </span>
                          ) : (
                            items.map((it, idx) => (
                              <span
                                key={it.id || idx}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium whitespace-nowrap"
                              >
                                <b className="tabular-nums">
                                  {it.peso_real || it.cantidad_kg || it.cantidad || 1}
                                  {it.unidad_medida || "kg"}
                                </b>{" "}
                                {it.nombre_producto || it.nombre}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="whitespace-nowrap">
                        {cortadores.length > 0 && isActive ? (
                          <select
                            value={pedido.cortador_id || ""}
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignCortador(pedido.id, e.target.value);
                              }
                            }}
                            className="h-7 px-2 rounded-md border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-800 outline-none cursor-pointer"
                          >
                            <option value="">Sin asignar</option>
                            {cortadores.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.apodo || c.nombre}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            {pedido.cortador_nombre || "—"}
                          </span>
                        )}
                      </td>

                      <td className="text-right tabular-nums font-bold text-slate-900 whitespace-nowrap">
                        {formatMoney(totalPedido)}
                      </td>

                      <td className="whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${meta.pill}`}
                        >
                          {meta.label}
                        </span>
                      </td>

                      <td className="text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {isActive && (
                            <button
                              type="button"
                              onClick={() => handleOpenPesaje(pedido)}
                              title="Registrar pesos reales de balanza"
                              className="px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Scale className="w-3 h-3" />
                              <span>Pesar</span>
                            </button>
                          )}
                          {meta.next && (
                            <button
                              type="button"
                              onClick={() =>
                                handleChangeStatus(pedido.id, meta.next)
                              }
                              className="px-2.5 py-1 rounded-md bg-[#002244] hover:bg-[#1e3b6c] text-white text-[11px] font-bold cursor-pointer"
                            >
                              {meta.nextLabel}
                            </button>
                          )}
                          {isManager && isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                const reason = window.prompt(
                                  `Motivo de cancelación del pedido #${pedido.id}:`,
                                  "Sin stock en mostrador",
                                );
                                if (reason !== null) {
                                  handleCancelOrder(pedido.id, reason);
                                }
                              }}
                              title="Cancelar pedido"
                              className="p-1 rounded-md text-slate-400 hover:text-[#c53030] hover:bg-rose-50 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPedidos.map((pedido) => (
            <ComandaCard
              key={pedido.id}
              pedido={pedido}
              cortadores={cortadores}
              canSeePrivateData={isManager}
              onOpenPesaje={handleOpenPesaje}
              onChangeStatus={handleChangeStatus}
              onAssignCortador={handleAssignCortador}
              onCancelOrder={handleCancelOrder}
            />
          ))}
        </div>
      )}

      {/* Modal de pesaje */}
      <PesajeModal
        isOpen={pesajeModalOpen}
        onClose={() => setPesajeModalOpen(false)}
        pedido={pedidoParaPesar}
        onConfirmarPesaje={handleConfirmarPesaje}
        isSaving={isSavingPesaje}
      />
    </div>
  );
}
