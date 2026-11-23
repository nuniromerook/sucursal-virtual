import { useState } from "react";
import { X, Scale } from "lucide-react";
import { formatMoney } from "../../utils/formatters";
import { useModalBehavior } from "../../hooks/useModalBehavior";

function getInitialPesos(pedido) {
  const initial = {};
  const items = Array.isArray(pedido?.items) ? pedido.items : [];
  items.forEach((it) => {
    const val =
      it.peso_real != null
        ? it.peso_real
        : it.cantidad_kg_solicitada ||
          it.cantidad_kg ||
          it.cantidad_pedida ||
          1;
    initial[it.id] = String(val);
  });
  return initial;
}

function PesajeModalContent({
  pedido,
  onClose,
  onConfirmarPesaje,
  isSaving,
}) {
  const [pesos, setPesos] = useState(() => getInitialPesos(pedido));
  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    true,
    onClose,
  );

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
    const precioUnit = Number(
      it.precio_por_kg_congelado ||
        it.precio_al_agregar ||
        it.precio_unitario ||
        it.precio_unit ||
        it.precio ||
        0,
    );
    totalRecalculado += peso * precioUnit;
  });

  const handleConfirm = () => {
    onConfirmarPesaje(pedido.id, pesos);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white w-full sm:max-w-lg rounded-t-4xl sm:rounded-3xl shadow-2xl h-[85vh] sm:h-auto sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 border border-slate-200/80"
      >
        {/* Zona táctil de arrastre (barra + header superior) */}
        <div {...dragHandleProps} className="touch-none select-none shrink-0">
          {/* Barra táctil para deslizar en celulares */}
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-3 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />

          {/* Cabecera Superior del Modal */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Scale className="size-4.5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Carga de Balanza (peso neto)
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Pedido #{pedido.id} •{" "}
                  {pedido.cliente_nombre ||
                    pedido.nombre_cliente ||
                    pedido.cliente ||
                    "Cliente Web"}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Cerrar"
              className="size-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center font-bold transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Lista de Items Scrollable */}
        <div className="p-4 sm:p-5 space-y-2.5 text-xs flex-1 overflow-y-auto">
          {items.map((it) => {
            const unit = it.unidad_medida || it.unidad || "kg";
            const cantOriginal =
              it.cantidad_kg_solicitada ||
              it.cantidad_kg ||
              it.cantidad_pedida ||
              1;

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
        <div className="p-4 sm:p-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Total Recalculado
            </span>
            <span className="font-black text-slate-900 text-base font-num">
              {formatMoney(totalRecalculado)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? "Guardando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PesajeModal({
  isOpen,
  onClose,
  pedido,
  onConfirmarPesaje,
  isSaving,
}) {
  if (!isOpen || !pedido) return null;

  return (
    <PesajeModalContent
      key={pedido.id}
      pedido={pedido}
      onClose={onClose}
      onConfirmarPesaje={onConfirmarPesaje}
      isSaving={isSaving}
    />
  );
}
