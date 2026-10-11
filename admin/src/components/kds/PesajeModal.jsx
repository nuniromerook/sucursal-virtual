// admin/src/components/kds/PesajeModal.jsx
import React, { useState, useEffect } from "react";
import { X, Scale } from "lucide-react";
import { formatMoney } from "../../utils/formatters";

export default function PesajeModal({ isOpen, onClose, pedido, onConfirmarPesaje, isSaving }) {
  const [pesos, setPesos] = useState({});

  useEffect(() => {
    if (!isOpen || !pedido) return;

    const initial = {};
    const items = Array.isArray(pedido.items) ? pedido.items : [];
    items.forEach((it) => {
      const val = it.peso_real != null ? it.peso_real : it.cantidad_kg_solicitada || it.cantidad_kg || it.cantidad_pedida || 1;
      initial[it.id] = String(val);
    });
    setPesos(initial);
  }, [isOpen, pedido]);

  if (!isOpen || !pedido) return null;

  const handlePesoChange = (itemId, val) => {
    let clean = val.replace(",", ".");
    setPesos((prev) => ({
      ...prev,
      [itemId]: clean,
    }));
  };

  // Calcular nuevo total sumando cada item
  const items = Array.isArray(pedido.items) ? pedido.items : [];
  let totalRecalculado = 0;
  items.forEach((it) => {
    const rawPeso = parseFloat(pesos[it.id]);
    const peso = !isNaN(rawPeso) && rawPeso > 0 ? rawPeso : 0;
    const precioUnit = Number(it.precio_unitario || it.precio_unit || it.precio || 0);
    totalRecalculado += peso * precioUnit;
  });

  const handleConfirm = () => {
    onConfirmarPesaje(pedido.id, pesos);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs transition-all duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[88vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 border border-slate-200/80">
        
        {/* Barra táctil móvil */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Cabecera */}
        <div className="bg-[#002244] px-5 py-3.5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <Scale className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">
                Carga de Balanza Real
              </div>
              <div className="text-sm font-extrabold leading-tight">
                Pedido #{pedido.id} - {pedido.nombre_cliente || pedido.cliente}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Items */}
        <div className="p-4 sm:p-5 space-y-2.5 text-xs flex-1 overflow-y-auto">
          {items.map((it) => {
            const unit = it.unidad_medida || it.unidad || "kg";
            const cantOriginal = it.cantidad_kg_solicitada || it.cantidad_kg || it.cantidad_pedida || 1;

            return (
              <div
                key={it.id}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5"
              >
                <div className="flex items-center justify-between font-extrabold text-slate-900">
                  <span>{it.nombre_producto || it.nombre}</span>
                  <span className="text-slate-500 text-[11px] font-medium">
                    Solicitado: {cantOriginal} {unit}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="text-[11px] text-slate-600 font-bold">
                    Peso real balanza ({unit}):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step={unit === "kg" ? "0.005" : "1"}
                      value={pesos[it.id] ?? cantOriginal}
                      onChange={(e) => handlePesoChange(it.id, e.target.value)}
                      className="w-28 px-3 py-1.5 font-mono font-black text-slate-900 border border-slate-300 rounded-xl bg-white text-right outline-none focus:border-[#002244]"
                    />
                    <span className="font-mono text-slate-500 font-bold w-6">
                      {unit}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="text-xs">
            <span className="text-slate-500 font-medium">Nuevo Total:</span>
            <span className="font-black text-slate-900 text-sm ml-1.5 font-mono">
              {formatMoney(totalRecalculado)}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3.5 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold cursor-pointer rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? "Guardando..." : "Confirmar y Guardar Ticket"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
