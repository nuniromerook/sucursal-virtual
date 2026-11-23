import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { VITE_API_URL } from "../config/api";
import { useAdmin } from "../context/AdminContext";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import ComandaCard from "../components/kds/ComandaCard";
import PesajeModal from "../components/kds/PesajeModal";

export default function KdsPage() {
  const { selectedSucursal, setPedidosPendientesCount, showToast } = useAdmin();
  const { socket, joinSucursal } = useSocket();
  const { authHeaders } = useAuth();

  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("todos");

  // Modal de pesaje
  const [pesajeModalOpen, setPesajeModalOpen] = useState(false);
  const [pedidoParaPesar, setPedidoParaPesar] = useState(null);
  const [isSavingPesaje, setIsSavingPesaje] = useState(false);

  const fetchPedidosData = useCallback(async () => {
    if (!selectedSucursal?.id) return [];
    try {
      const res = await fetch(
        `${VITE_API_URL}/sucursales/${selectedSucursal.id}/pedidos`,
        {
          headers: authHeaders,
        },
      );

      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      }
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
    }
    return [];
  }, [selectedSucursal, authHeaders]);

  // Recarga manual desde el botón
  const loadPedidos = async () => {
    if (!selectedSucursal?.id) return;
    setIsLoading(true);
    try {
      const items = await fetchPedidosData();
      setPedidos(items);
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
    if (!selectedSucursal?.id) return;

    joinSucursal(selectedSucursal.id);

    let isMounted = true;
    fetchPedidosData()
      .then((items) => {
        if (!isMounted) return;
        setPedidos(items);
        const pendientes = items.filter(
          (p) => p.estado === "solicitado" || p.estado === "en_corte",
        ).length;
        setPedidosPendientesCount(pendientes);
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Error al cargar pedidos:", err);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSucursal?.id, fetchPedidosData, joinSucursal, setPedidosPendientesCount]);

  // Manejar eventos de socket en tiempo real
  useEffect(() => {
    if (!socket) return;

    const syncPendientes = (list) => {
      const pendientes = list.filter(
        (p) =>
          (p.estado || p.estado_local) === "solicitado" ||
          (p.estado || p.estado_local) === "en_corte"
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
      showToast(
        `¡Nuevo pedido #${pedido.id} recibido en mostrador!`,
        "info",
      );
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

  const handleChangeStatus = async (orderId, newStatus) => {
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === orderId
          ? { ...p, estado: newStatus, estado_local: newStatus }
          : p
      ),
    );

    try {
      const res = await fetch(`${VITE_API_URL}/pedidos/${orderId}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ estado: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.pedido) {
          setPedidos((prev) =>
            prev.map((p) => (p.id === orderId ? data.pedido : p))
          );
        }
      }
      showToast(`Pedido #${orderId} actualizado a ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    }
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
            prev.map((p) => (p.id === orderId ? data.pedido : p))
          );
        }
      }

      showToast(`Pesaje de balanza confirmado para Pedido #${orderId}`);
      setPesajeModalOpen(false);
    } catch (err) {
      console.error("Error al guardar pesaje:", err);
      setPesajeModalOpen(false);
    } finally {
      setIsSavingPesaje(false);
    }
  };

  const filteredPedidos = pedidos.filter((p) => {
    if (filterStatus === "todos") return true;
    return p.estado === filterStatus;
  });

  const countSolicitados = pedidos.filter(
    (p) => p.estado === "solicitado",
  ).length;
  const countEnCorte = pedidos.filter((p) => p.estado === "en_corte").length;
  const countListos = pedidos.filter((p) => p.estado === "listo").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Comandas en vivo
            <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md flex items-center gap-1.5 ml-auto sm:ml-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {selectedSucursal?.nombre || "Sucursal"}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pedidos en vivo, control de pesaje y preparación según la
            preferencia del cliente.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-3 sm:pb-0">
          <button
            type="button"
            onClick={loadPedidos}
            disabled={isLoading}
            className="p-2 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-xs shrink-0"
            title="Actualizar comandas"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin text-brand-navy" : ""}`}
            />
          </button>

          {/* Filtros de estado */}
          <div className="inline-flex p-1.5 bg-slate-200/40 rounded-xl gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setFilterStatus("todos")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === "todos"
                  ? "bg-[#002244] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Todos ({pedidos.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("solicitado")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === "solicitado"
                  ? "bg-[#002244] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Nuevos ({countSolicitados})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("en_corte")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === "en_corte"
                  ? "bg-[#002244] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              En Corte ({countEnCorte})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("listo")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === "listo"
                  ? "bg-[#002244] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Listos ({countListos})
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Comandas */}
      {filteredPedidos.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 text-xs font-medium">
          No hay comandas registradas en este estado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPedidos.map((pedido) => (
            <ComandaCard
              key={pedido.id}
              pedido={pedido}
              onOpenPesaje={handleOpenPesaje}
              onChangeStatus={handleChangeStatus}
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
