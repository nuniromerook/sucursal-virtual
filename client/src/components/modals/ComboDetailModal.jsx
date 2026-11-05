// src/components/modals/ComboDetailModal.jsx
import React, { useState } from "react";
import {
  X,
  ShoppingCart,
  Plus,
  Minus,
  Scale,
  Users,
  Sparkles,
  Check,
  Flame,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { formatPrecio } from "@/utils/formatters";
import { useModalBehavior } from "@/hooks/useModalBehavior";

export const ComboDetailModal = ({ isOpen, onClose, combo }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [cantidad, setCantidad] = useState(1);
  const [notas, setNotas] = useState("");

  // Manejo de comportamiento nativo de modal: ESC, backdrop, overflow body y gesto de arrastre mobile
  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    onClose,
  );

  if (!isOpen || !combo) return null;

  const items = Array.isArray(combo.items) ? combo.items : [];
  const precioUnitario = Number(combo.precio) || 0;
  const precioAnteriorUnitario =
    Number(combo.precio_anterior) ||
    Number(combo.precioAnterior) ||
    Number(combo.precio_regular_calculado) ||
    precioUnitario;
  const ahorroUnitario =
    Number(combo.ahorro) > 0
      ? Number(combo.ahorro)
      : Math.max(0, precioAnteriorUnitario - precioUnitario);
  const kilosUnitario = Number(combo.kilos) || 0;
  const puntosUnitario = Number(combo.puntos) || 50;

  const totalPrecio = precioUnitario * cantidad;
  const totalAnterior = precioAnteriorUnitario * cantidad;
  const totalAhorro = ahorroUnitario * cantidad;
  const totalKilos = kilosUnitario * cantidad;
  const totalPuntos = puntosUnitario * cantidad;

  const handleIncrement = () => {
    setCantidad((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setCantidad((prev) => Math.max(1, prev - 1));
  };

  const handleAddToCart = () => {
    const mainImg =
      combo.imagen_url ||
      combo.imagenUrl ||
      items[0]?.imagen_url ||
      items[0]?.imagenUrl ||
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop";

    addToCart(
      {
        id: `combo-${combo.id}`,
        catalogo_id: items[0]?.catalogo_id || combo.id,
        es_combo: true,
        combo_id: combo.id,
        nombre: combo.nombre,
        slug: combo.slug,
        precio: precioUnitario,
        unidad_medida: "u",
        puntos: puntosUnitario,
        imagen_url: mainImg,
      },
      cantidad,
      {
        corte: "Combo preparado de cortes surtidos",
        envasado: "Envasado con cadena de frío",
        kilos: totalKilos,
        items_combo: items
          .map((i) => `${i.cantidad_o_peso || i.peso} de ${i.nombre}`)
          .join(", "),
        notas: notas.trim() || undefined,
      },
    );

    showToast(
      cantidad > 1
        ? `Sumaste ${cantidad} combos (${combo.nombre}) al pedido 🥩`
        : `Sumaste ${combo.nombre} al pedido 🥩`,
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="combo-detail-title"
    >
      {/* Contenedor Modal / Bottom Sheet */}
      <div
        ref={modalRef}
        className="bg-white w-full sm:max-w-2xl md:max-w-3xl rounded-t-4xl sm:rounded-3xl shadow-2xl h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Zona táctil de arrastre (celulares) y Header */}
        <div {...dragHandleProps} className="touch-none select-none shrink-0">
          {/* Barra táctil para deslizar en celulares */}
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-3 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />

          {/* Header Superior del Modal */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Combos especiales
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Cerrar ventana"
              className="size-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center font-bold transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal con scroll fluido */}
        <div className="overflow-y-auto no-scrollbar flex-1 px-5 sm:px-7 py-4 space-y-8">
          {/* 1. Hero Card con Datos Clave del Combo */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#002244] to-[#003366] text-white p-5 sm:p-6 shadow-md">
            {/* Adorno de fondo */}
            <div className="absolute -right-10 -bottom-10 size-44 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-white/15 text-white border border-white/20 text-[11px] font-black uppercase tracking-wide">
                  {combo.badge || "🔥 Combo Ahorro"}
                </span>
                {ahorroUnitario > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-extrabold flex items-center gap-1">
                    <Flame className="size-3 text-emerald-400" />
                    Ahorrás {formatPrecio(ahorroUnitario)}
                  </span>
                )}
              </div>

              <div>
                <h2
                  id="combo-detail-title"
                  className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight"
                >
                  {combo.nombre}
                </h2>
                {combo.descripcion && (
                  <p className="text-xs sm:text-sm text-slate-200/90 mt-1.5 leading-relaxed max-w-xl">
                    {combo.descripcion}
                  </p>
                )}
              </div>

              {/* Píldoras de Rendimiento, Peso y Puntos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-white/10 mt-1">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl">
                  <Scale className="size-4 text-slate-200 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-300 block">
                      Peso Total
                    </span>
                    <span className="text-xs font-black text-white font-num">
                      {kilosUnitario} kg carne
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl">
                  <Users className="size-4 text-slate-200 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-300 block">
                      Rinde Aprox.
                    </span>
                    <span className="text-xs font-black text-white">
                      {combo.rinde || "6 a 8 personas"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl col-span-2 sm:col-span-1">
                  <Sparkles className="size-4 text-amber-300 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-300 block">
                      Club Valette
                    </span>
                    <span className="text-xs font-black text-amber-300 font-num">
                      +{puntosUnitario} puntos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Visualización Detallada de Cada Corte con Imagen */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Cortes incluidos en este combo</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Inspeccioná las fotos reales y cantidades de cada producto del
                  combo:
                </p>
              </div>
            </div>

            {/* Grilla de Cortes con Foto Individual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((item, index) => {
                const cutImg =
                  item.imagen_url ||
                  item.imagenUrl ||
                  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400";

                return (
                  <div
                    key={index}
                    className="bg-white border border-slate-200/90 rounded-2xl p-3 flex gap-3 items-center hover:border-slate-300 hover:shadow-2xs transition-all group"
                  >
                    {/* Fotografía del corte */}
                    <div className="relative size-20 sm:size-22 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80">
                      <img
                        src={cutImg}
                        alt={item.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute bottom-1 right-1">
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-900/85 text-white text-[10px] font-black font-num shadow-xs">
                          {item.cantidad_o_peso || item.peso}
                        </span>
                      </div>
                    </div>

                    {/* Descripción y Especificación del corte */}
                    <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-[#003366] shrink-0" />
                          <h4 className="font-black text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-[#003366] transition-colors truncate">
                            {item.nombre}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {item.descripcion_item ||
                            item.descripcion ||
                            "Corte fresco seleccionado fraccionado en el día con cadena de frío."}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Indicaciones / Notas al Cortador */}
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1.5 block">
              Indicaciones especiales para el cortador (opcional):
            </label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: marcar vacío parrillero, separar chorizos en dos bolsitas..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:ring-2 focus:ring-[#003366]/20 transition-all outline-none font-medium"
            />
          </div>
        </div>

        {/* Footer Fijo con Precios, Selector de Cantidad y Botón CTA */}
        <div className="border-t border-slate-100 p-4 sm:p-5 bg-white shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Selector de cantidad y precios */}
          <div className="flex items-center justify-between sm:justify-start gap-4">
            {/* Control de unidades del combo */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/80 shrink-0">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={cantidad <= 1}
                aria-label="Restar combo"
                className="size-8 rounded-lg bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer shadow-2xs"
              >
                <Minus className="size-3.5 stroke-[2.5]" />
              </button>
              <span className="w-8 text-center font-black text-sm text-slate-900 font-num">
                {cantidad}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                aria-label="Sumar combo"
                className="size-8 rounded-lg bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="size-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Desglose de Precios */}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Total ({totalKilos} kg)
                </span>
                {totalAhorro > 0 && (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-num">
                    Ahorrás {formatPrecio(totalAhorro)}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight font-num">
                  {formatPrecio(totalPrecio)}
                </span>
                {totalAnterior > totalPrecio && (
                  <span className="text-xs font-semibold text-slate-400 line-through font-num">
                    {formatPrecio(totalAnterior)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botón CTA de Agregar al Carrito */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm bg-[#003366] hover:bg-valette-dark text-white active:scale-98 transition-all cursor-pointer"
          >
            <ShoppingCart className="size-4" />
            <span>
              {cantidad > 1
                ? `Agregar ${cantidad} Combos al Carrito`
                : "Agregar Combo al Carrito"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComboDetailModal;
