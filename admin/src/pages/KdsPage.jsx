// admin/src/pages/KdsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, Radio } from "lucide-react";
import { VITE_API_URL } from "../config/api";
import { useAdmin } from "../context/AdminContext";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import ComandaCard from "../components/kds/ComandaCard";
import PesajeModal from "../components/kds/PesajeModal";

export default function KdsPage() {
  const { selectedSucursal, setPedidosPendientesCount, showToast } = useAdmin();
  const { socket, isConnected, joinSucursal, ultimoPedido } = useSocket();
  const { authHeaders } = useAuth();

  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("todos");

  // Modal de pesaje
  const [pesajeModalOpen, setPesajeModalOpen] = useState(false);
  const [pedidoParaPesar, setPedidoParaPesar] = useState(null);
  const [isSavingPesaje, setIsSavingPesaje] = useState(false);

  const loadPedidos = useCallback(async () => {
    if (!selectedSucursal?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${VITE_API_URL}/sucursales/${selectedSucursal.id}/pedidos`, {
        headers: authHeaders,
      });

      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : [];
        setPedidos(items);
        const pendientes = items.filter(
          (p) => p.estado === "solicitado" || p.estado === "en_corte"
        ).length;
        setPedidosPendientesCount(pendientes);
      }
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSucursal, authHeaders, setPedidosPendientesCount]);

  useEffect(() => {
    loadPedidos();
    if (selectedSucursal?.id) {
      joinSucursal(selectedSucursal.id);
    }
  }, [selectedSucursal, joinSucursal, loadPedidos]);

  // Manejar nuevo pedido entrante por socket
  useEffect(() => {
    if (ultimoPedido) {
      setPedidos((prev) => {
        const exists = prev.find((p) => p.id === ultimoPedido.id);
        if (exists) {
          return prev.map((p) => (p.id === ultimoPedido.id ? ultimoPedido : p));
        } else {
          return [ultimoPedido, ...prev];
        }
      });
      showToast(`¡Nuevo pedido #${ultimoPedido.id} recibido en mostrador!`, "info");
    }
  }, [ultimoPedido, showToast]);

  const handleChangeStatus = async (orderId, newStatus) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === orderId ? { ...p, estado: newStatus } : p))
    );

    try {
      await fetch(`${VITE_API_URL}/sucursales/${selectedSucursal.id}/pedidos/${orderId}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ estado: newStatus }),
      });
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
      const res = await fetch(
        `${VITE_API_URL}/sucursales/${selectedSucursal.id}/pedidos/${orderId}/pesaje`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ pesos: pesosMap }),
        }
      );

      // Actualizar localmente el pedido
      setPedidos((prev) =>
        prev.map((p) => {
          if (p.id === orderId) {
            const updatedItems = (p.items || []).map((it) => ({
              ...it,
              peso_real: pesosMap[it.id] ? parseFloat(pesosMap[it.id]) : it.peso_real,
            }));
            return {
              ...p,
              items: updatedItems,
              estado: p.estado === "solicitado" ? "en_corte" : p.estado,
            };
          }
          return p;
        })
      );

      showToast(`Pesaje confirmado para Pedido #${orderId}`);
      setPesajeModalOpen(false);
    } catch (err) {
      console.error("Error al guardar pesaje:", err);
      // Fallback local
      setPedidos((prev) =>
        prev.map((p) => {
          if (p.id === orderId) {
            const updatedItems = (p.items || []).map((it) => ({
              ...it,
              peso_real: pesosMap[it.id] ? parseFloat(pesosMap[it.id]) : it.peso_real,
            }));
            return { ...p, items: updatedItems };
          }
          return p;
        })
      );
      setPesajeModalOpen(false);
    } finally {
      setIsSavingPesaje(false);
    }
  };

  const filteredPedidos = pedidos.filter((p) => {
    if (filterStatus === "todos") return true;
    return p.estado === filterStatus;
  });

  const countSolicitados = pedidos.filter((p) => p.estado === "solicitado").length;
  const countEnCorte = pedidos.filter((p) => p.estado === "en_corte").length;
  const countListos = pedidos.filter((p) => p.estado === "listo").length;

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            KDS | Comandas & Mesa de Corte
            <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {selectedSucursal?.nombre || "Sucursal"}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Control de pesaje en balanza y preparación exacta según la preferencia del cliente.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={loadPedidos}
            disabled={isLoading}
            className="p-2 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-xs shrink-0"
            title="Actualizar comandas"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-brand-navy" : ""}`} />
          </button>

          {/* Filtros de estado */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1 shrink-0">
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
