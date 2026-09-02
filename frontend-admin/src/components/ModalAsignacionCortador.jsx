import React, { useState, useMemo } from "react";
import { Scissors, X, Search } from "lucide-react";

export default function ModalAsignacionCortador({
  isOpen,
  onClose,
  pedido,
  cortadores,
  onAssign,
  isAssigning,
}) {
  const [filtroTexto, setFiltroTexto] = useState("");
  const [orden, setOrden] = useState("menos_pedidos"); // "menos_pedidos" | "alfabetico"

  // Filtrado y ordenamiento de cortadores
  const cortadoresOrdenados = useMemo(() => {
    if (!cortadores) return [];
    
    let resultado = [...cortadores];

    if (filtroTexto.trim()) {
      const query = filtroTexto.toLowerCase();
      resultado = resultado.filter(
        (c) =>
          c.nombre?.toLowerCase().includes(query) ||
          c.apodo?.toLowerCase().includes(query)
      );
    }

    resultado.sort((a, b) => {
      if (orden === "alfabetico") {
        const nomA = a.nombre || "";
        const nomB = b.nombre || "";
        return nomA.localeCompare(nomB);
      } else {
        const enCorteA = Number(a.pedidos_en_corte || 0);
        const enCorteB = Number(b.pedidos_en_corte || 0);
        if (enCorteA !== enCorteB) return enCorteA - enCorteB;
        return Number(a.pedidos_hoy || 0) - Number(b.pedidos_hoy || 0);
      }
    });

    return resultado;
  }, [cortadores, filtroTexto, orden]);

  if (!isOpen || !pedido) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-neutral-200 flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="p-5 border-b border-neutral-100 bg-neutral-50/80 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-black text-neutral-900 flex items-center gap-2">
              <Scissors className="size-4 text-main-blue" />
              <span>
                Asignar Cortador · Comanda #{pedido.id}
              </span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Cliente:{" "}
              <strong>
                {pedido.cliente_nombre || "Cliente"}
              </strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Controles de Orden y Búsqueda */}
        <div className="p-4 bg-white border-b border-neutral-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar cortador..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-main-blue focus:bg-white"
            />
            <Search className="size-3.5 text-neutral-400 absolute left-2.5 inset-y-0 my-auto" />
          </div>

          {/* Botón Switch de Orden */}
          <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 shrink-0">
            <button
              type="button"
              onClick={() => setOrden("menos_pedidos")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                orden === "menos_pedidos"
                  ? "bg-main-blue text-white shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
              title="Balancear carga de trabajo"
            >
              ⚖️ Menor carga
            </button>
            <button
              type="button"
              onClick={() => setOrden("alfabetico")}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                orden === "alfabetico"
                  ? "bg-main-blue text-white shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              A-Z
            </button>
          </div>
        </div>

        {/* Lista de Cortadores con Carga Diaria */}
        <div className="p-4 overflow-y-auto space-y-2 divide-y divide-neutral-100 flex-1">
          {cortadoresOrdenados.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-500">
              No se encontraron cortadores activos.
            </div>
          ) : (
            cortadoresOrdenados.map((c) => {
              const isCurrent =
                pedido.cortador_id === c.id ||
                pedido.empleado_id === c.id;
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
                        : c.nombre?.slice(0, 2).toUpperCase()}
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
                    disabled={isAssigning}
                    onClick={() => onAssign(c)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50 shrink-0 ${
                      isCurrent
                        ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                        : "bg-main-blue hover:bg-main-blue/90 text-white shadow-xs active:scale-95"
                    }`}
                  >
                    {isAssigning && isCurrent
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

        <div className="p-3.5 border-t border-neutral-100 bg-neutral-50 text-right shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-xs font-bold text-neutral-700 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
