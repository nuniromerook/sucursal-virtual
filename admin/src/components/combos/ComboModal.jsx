// admin/src/components/combos/ComboModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  Check,
  Scale,
  Sparkles,
  Layers,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { formatMoney } from "../../utils/formatters";
import { useModalBehavior } from "../../hooks/useModalBehavior";

export default function ComboModal({
  isOpen,
  onClose,
  combo,
  catalogProducts = [],
  onSave,
  isSaving,
}) {
  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    onClose
  );

  const [nombre, setNombre] = useState("");
  const [badge, setBadge] = useState("🔥 Parrilla Tradición");
  const [rinde, setRinde] = useState("6 a 8 personas");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [puntos, setPuntos] = useState(50);
  const [activo, setActivo] = useState(true);
  const [items, setItems] = useState([]);
  const [errorValidation, setErrorValidation] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    setErrorValidation(null);

    if (combo) {
      setNombre(combo.nombre || "");
      setBadge(combo.badge || "🔥 Combo Ahorro");
      setRinde(combo.rinde || "6 a 8 personas");
      setDescripcion(combo.descripcion || "");
      setPrecio(combo.precio != null ? String(combo.precio) : "");
      setPuntos(combo.puntos != null ? combo.puntos : 50);
      setActivo(combo.activo !== false);

      const comboItems = Array.isArray(combo.items) ? combo.items : [];
      setItems(
        comboItems.map((it, idx) => ({
          tempId: it.id || `item-${Date.now()}-${idx}`,
          catalogo_id: it.catalogo_id || (it.id ? it.id : ""),
          cantidad_o_peso: it.cantidad_o_peso || `${it.peso_kg || 1} kg`,
          peso_kg: it.peso_kg != null ? Number(it.peso_kg) : 1,
          descripcion_item: it.descripcion_item || "",
        }))
      );
    } else {
      // Nuevo Combo: precargar con 2 cortes iniciales del catálogo si existen
      const defaultP1 = catalogProducts[0]?.id || "";
      const defaultP2 = catalogProducts[1]?.id || "";

      setNombre("");
      setBadge("🔥 Combo Ahorro");
      setRinde("6 a 8 personas");
      setDescripcion("");
      setPrecio("");
      setPuntos(50);
      setActivo(true);
      setItems([
        {
          tempId: `item-${Date.now()}-1`,
          catalogo_id: defaultP1,
          cantidad_o_peso: "2 kg",
          peso_kg: 2,
          descripcion_item: "",
        },
        {
          tempId: `item-${Date.now()}-2`,
          catalogo_id: defaultP2,
          cantidad_o_peso: "2 kg",
          peso_kg: 2,
          descripcion_item: "",
        },
      ]);
    }
  }, [isOpen, combo, catalogProducts]);

  // Mapa de productos de catálogo por id para acceso instantáneo
  const productMap = useMemo(() => {
    const map = new Map();
    catalogProducts.forEach((p) => {
      map.set(Number(p.id), p);
    });
    return map;
  }, [catalogProducts]);

  // Cálculos dinámicos en vivo del combo
  const { precioRegularTotal, totalKilosCalc, ahorroCalculado } = useMemo(() => {
    let regularSum = 0;
    let kilosSum = 0;

    items.forEach((it) => {
      const prod = productMap.get(Number(it.catalogo_id));
      const peso = Number(it.peso_kg) || 0;
      kilosSum += peso;

      if (prod) {
        const unitPrice = Number(prod.precio) || 0;
        regularSum += peso * unitPrice;
      }
    });

    const precioComboNum = Number(precio) || 0;
    const ahorro = Math.max(0, regularSum - precioComboNum);

    return {
      precioRegularTotal: regularSum,
      totalKilosCalc: kilosSum,
      ahorroCalculado: ahorro,
    };
  }, [items, productMap, precio]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const nextProd = catalogProducts.find(
      (p) => !items.some((it) => Number(it.catalogo_id) === Number(p.id))
    ) || catalogProducts[0];

    setItems((prev) => [
      ...prev,
      {
        tempId: `item-${Date.now()}-${prev.length + 1}`,
        catalogo_id: nextProd ? nextProd.id : "",
        cantidad_o_peso: "1 kg",
        peso_kg: 1,
        descripcion_item: "",
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      setErrorValidation("El combo debe incluir al menos un corte de carne.");
      return;
    }
    setErrorValidation(null);
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        const updated = { ...it, [field]: value };

        // Si cambia el peso numérico, sugerir formato en texto si coincide
        if (field === "peso_kg") {
          const num = Number(value);
          if (!isNaN(num) && num > 0) {
            const prod = productMap.get(Number(it.catalogo_id));
            const unit = prod?.unidad_medida || "kg";
            updated.cantidad_o_peso = `${num} ${unit}`;
          }
        }
        return updated;
      })
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      setErrorValidation("Por favor ingrese el nombre del combo.");
      return;
    }

    if (!precio || Number(precio) <= 0) {
      setErrorValidation("Por favor ingrese un precio válido mayor a 0.");
      return;
    }

    if (items.length === 0) {
      setErrorValidation("El combo debe tener al menos un corte del catálogo.");
      return;
    }

    // Validar que todos los items tengan un corte seleccionado
    const invalidItem = items.find((it) => !it.catalogo_id);
    if (invalidItem) {
      setErrorValidation("Seleccioná un producto del catálogo para cada corte del combo.");
      return;
    }

    setErrorValidation(null);

    const payload = {
      id: combo?.id,
      nombre: nombre.trim(),
      badge: badge.trim(),
      rinde: rinde.trim(),
      descripcion: descripcion.trim(),
      precio: Number(precio),
      precio_anterior: precioRegularTotal,
      kilos: totalKilosCalc,
      puntos: Number(puntos) || 50,
      activo: Boolean(activo),
      items: items.map((it, idx) => ({
        catalogo_id: Number(it.catalogo_id),
        cantidad_o_peso: it.cantidad_o_peso || `${it.peso_kg || 1} kg`,
        peso_kg: Number(it.peso_kg) || 1,
        descripcion_item: it.descripcion_item || "",
        orden: idx + 1,
      })),
    };

    onSave(payload);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white w-full sm:max-w-2xl md:max-w-3xl rounded-t-4xl sm:rounded-3xl shadow-2xl h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 border border-slate-200/80"
      >
        {/* Zona táctil de arrastre (barra + header superior) */}
        <div {...dragHandleProps} className="touch-none select-none shrink-0">
          {/* Barra táctil para deslizar en celulares */}
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-3 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />

          {/* Header Superior del Modal */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-2xl bg-red-50 text-valette-red flex items-center justify-center shrink-0">
                <Layers className="size-4.5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {combo ? "Editor de Combos" : "Armador de Combos"}
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {combo ? combo.nombre : "Armar Nuevo Combo de Cortes"}
                </h2>
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

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-xs flex flex-col justify-between"
        >
          <div className="space-y-6">
            {errorValidation && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-2 font-medium">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorValidation}</span>
              </div>
            )}

            {/* 1. Datos Generales del Combo */}
            <div className="space-y-3.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                1. Datos Básicos del Combo
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nombre del Combo *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="ej: Combo Asado Parrillero Tradición (5 kg)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#002244] outline-none font-bold text-slate-900 text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Badge / Etiqueta Destacada
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="ej: 🔥 Parrilla Tradición"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#002244] outline-none font-medium text-slate-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Rinde Estimado
                  </label>
                  <input
                    type="text"
                    value={rinde}
                    onChange={(e) => setRinde(e.target.value)}
                    placeholder="ej: 6 a 8 personas"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#002244] outline-none font-medium text-slate-900 transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Descripción del Paquete
                  </label>
                  <textarea
                    rows={2}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="ej: La selección parrillera definitiva con novillito seleccionado, cerdo crocante y chorizo puro cerdo..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#002244] outline-none font-medium text-slate-900 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 2. Contenedor Dinámico de Cortes Incluidos */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  2. Cortes que Componen el Combo ({items.length})
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  Las fotos y datos se vinculan en vivo al catálogo
                </span>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => {
                  const prod = productMap.get(Number(item.catalogo_id));

                  return (
                    <div
                      key={item.tempId}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-colors"
                    >
                      {/* Miniatura en vivo del corte */}
                      <div className="size-14 rounded-xl bg-slate-200 border border-slate-300/80 overflow-hidden shrink-0 relative">
                        {prod?.imagen_url ? (
                          <img
                            src={prod.imagen_url}
                            alt={prod.nombre_producto}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">
                            🥩
                          </div>
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-[8px] font-black text-white text-center py-0.5 truncate uppercase">
                          {prod?.categoria || "Corte"}
                        </span>
                      </div>

                      {/* Selector de Producto del Catálogo */}
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Corte #{idx + 1}
                        </label>
                        <select
                          value={item.catalogo_id}
                          onChange={(e) =>
                            handleItemChange(idx, "catalogo_id", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-[#002244]"
                        >
                          <option value="">-- Seleccionar corte --</option>
                          {catalogProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre_producto} ({p.categoria}) - {formatMoney(p.precio)}/{p.unidad_medida || "kg"}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Cantidad / Peso para el cliente */}
                      <div className="w-full sm:w-32">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Detalle visible
                        </label>
                        <input
                          type="text"
                          value={item.cantidad_o_peso}
                          onChange={(e) =>
                            handleItemChange(idx, "cantidad_o_peso", e.target.value)
                          }
                          placeholder="ej: 2 kg"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 outline-none focus:border-[#002244]"
                        />
                      </div>

                      {/* Peso en KG (para cálculo financiero de ahorro) */}
                      <div className="w-full sm:w-24">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Peso (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.peso_kg}
                          onChange={(e) =>
                            handleItemChange(idx, "peso_kg", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold font-num text-slate-900 outline-none focus:border-[#002244]"
                        />
                      </div>

                      {/* Botón Eliminar Corte */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        title="Quitar corte del combo"
                        className="size-8 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 self-end sm:self-center mt-2 sm:mt-4"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Agregar Otro Corte al Combo</span>
              </button>
            </div>

            {/* 3. Fijación Manual de Precio y Calculadora de Ahorro */}
            <div className="space-y-3.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                3. Precio Final y Cálculo de Ahorro
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Precio Manual del Combo ($) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-bold text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={precio}
                      onChange={(e) => setPrecio(e.target.value)}
                      placeholder="ej: 37900"
                      className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#002244] outline-none font-black text-slate-900 text-base font-num"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    Precio de venta cerrado que abona el cliente por el paquete.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Puntos Club Valette Otorgados
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
                      <Sparkles className="size-4" />
                    </span>
                    <input
                      type="number"
                      value={puntos}
                      onChange={(e) => setPuntos(e.target.value)}
                      placeholder="50"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#002244] outline-none font-bold text-slate-900 font-num"
                    />
                  </div>
                </div>
              </div>

              {/* Caja Inteligente de Análisis Financiero en Vivo */}
              <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Balance Financiero en Tiempo Real</span>
                  <span className="font-num text-[#002244]">
                    Peso Total: {totalKilosCalc.toFixed(1)} kg
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Suma por Separado
                    </span>
                    <span className="text-sm font-black text-slate-800 font-num block mt-0.5">
                      {formatMoney(precioRegularTotal)}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      Según catálogo vigente
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Precio Fijo Combo
                    </span>
                    <span className="text-sm font-black text-[#002244] font-num block mt-0.5">
                      {formatMoney(Number(precio) || 0)}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      Fijado por el admin
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                      Ahorro para el Cliente
                    </span>
                    <span className="text-sm font-black text-emerald-700 font-num block mt-0.5">
                      {ahorroCalculado > 0 ? formatMoney(ahorroCalculado) : "$ 0"}
                    </span>
                    <span className="text-[9px] text-emerald-600 block mt-0.5 font-bold">
                      {ahorroCalculado > 0
                        ? `Ahorra ${(
                            (ahorroCalculado / (precioRegularTotal || 1)) *
                            100
                          ).toFixed(0)}% comprando el combo`
                        : "Sin descuento calculado"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Estado de Publicación */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">
                  Visible en la Tienda Online
                </div>
                <div className="text-[11px] text-slate-500">
                  Habilita el combo para compra inmediata en el frontend cliente
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#002244]"></div>
              </label>
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="pt-4 border-t border-slate-100 bg-slate-50/50 -mx-5 -mb-5 sm:-mx-7 sm:-mb-7 p-4 sm:p-5 flex items-center justify-between shrink-0 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 text-slate-500 hover:text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#c53030] hover:bg-[#a82525] text-white rounded-xl font-black text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              <Check className="size-4 stroke-[2.5]" />
              <span>{isSaving ? "Guardando..." : "Guardar Combo"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
