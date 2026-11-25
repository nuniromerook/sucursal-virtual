// src/components/modals/ComboDetailModal.jsx
import React, { useState } from "react";
import {
  X,
  ChevronLeft,
  ShoppingCart,
  Plus,
  Minus,
  Scale,
  Users,
  Sparkles,
  Package,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { formatPrecio } from "@/utils/formatters";
import { useModalBehavior } from "@/hooks/useModalBehavior";

export const ComboDetailModal = ({ isOpen, onClose, onBack, combo }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [cantidad, setCantidad] = useState(1);
  const [notas, setNotas] = useState("");

  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    onBack || onClose,
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
  const comboImg =
    combo.imagen_url ||
    combo.imagenUrl ||
    items[0]?.imagen_url ||
    items[0]?.imagenUrl ||
    "";

  const handleIncrement = () => setCantidad((prev) => prev + 1);
  const handleDecrement = () => setCantidad((prev) => Math.max(1, prev - 1));

  const handleAddToCart = () => {
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
        imagen_url: comboImg,
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
    (onBack || onClose)();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="combo-detail-title"
    >
      <div
        ref={modalRef}
        className="bg-white w-full sm:max-w-xl rounded-t-4xl sm:rounded-3xl shadow-2xl max-h-[90dvh] sm:max-h-[88dvh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 overscroll-contain"
      >
        {/* Header limpio y deslizable */}
        <div
          {...dragHandleProps}
          className="touch-none select-none shrink-0 px-5 sm:px-6 pt-3 pb-3 border-b border-slate-100 bg-white"
        >
          <div className="w-11 h-1 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack || onClose}
              title="Volver"
              aria-label="Volver"
              className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="size-4 stroke-[2.25]" />
            </button>

            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Combo Valette
            </span>

            <button
              type="button"
              onClick={onClose}
              title="Cerrar"
              aria-label="Cerrar"
              className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              <X className="size-4 stroke-[2.25]" />
            </button>
          </div>
        </div>

        {/* Cuerpo scrolleable, respirado y directo */}
        <div className="overflow-y-auto no-scrollbar flex-1 px-5 sm:px-6 py-4 space-y-5 overscroll-contain">
          {/* 1. Foto Protagonista aspect-video (idéntica a la card) */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-100">
            {comboImg ? (
              <img
                src={comboImg}
                alt={combo.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Package className="size-10 stroke-[1.5]" />
              </div>
            )}

            {/* Pill de ahorro o categoría (arriba izquierda) */}
            {(combo.badge || ahorroUnitario > 0) && (
              <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                {combo.badge && (
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900/85 text-white text-[11px] font-extrabold tracking-tight shadow-xs">
                    {combo.badge}
                  </span>
                )}
                {ahorroUnitario > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-black font-num shadow-xs">
                    Ahorrás {formatPrecio(ahorroUnitario)}
                  </span>
                )}
              </div>
            )}

            {/* Pill compacto Club Valette (abajo izquierda) */}
            <div className="absolute bottom-3 left-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/95 text-amber-900 text-[11px] font-black font-num shadow-xs">
                <Sparkles className="size-3 text-amber-500" />+{puntosUnitario}{" "}
                pts Club
              </span>
            </div>
          </div>

          {/* 2. Título, datos esenciales en línea y descripción breve */}
          <div className="space-y-2">
            <h1
              id="combo-detail-title"
              className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug"
            >
              {combo.nombre}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
              {kilosUnitario > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-num">
                  <Scale className="size-3.5 text-[#003366]" />
                  {kilosUnitario} kg
                </span>
              )}
              {combo.rinde && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                  <Users className="size-3.5 text-[#003366]" />
                  {combo.rinde}
                </span>
              )}
            </div>

            {combo.descripcion && (
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed pt-0.5">
                {combo.descripcion}
              </p>
            )}
          </div>

          {/* 3. Lista limpia y escaneable de cortes incluidos */}
          {items.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Qué incluye ({items.length} cortes)
                </h2>
              </div>

              <div className="rounded-2xl bg-slate-50/90 border border-slate-200/70 divide-y divide-slate-200/60 overflow-hidden">
                {items.map((item, index) => {
                  const cutImg = item.imagen_url || item.imagenUrl || "";
                  const desc = item.descripcion_item || item.descripcion || "";
                  const peso = item.cantidad_o_peso || item.peso || "";

                  return (
                    <div
                      key={item.id || index}
                      className="px-3.5 py-3 flex items-center gap-3"
                    >
                      {cutImg ? (
                        <img
                          src={cutImg}
                          alt={item.nombre}
                          className="size-11 rounded-xl object-cover bg-slate-200 shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="size-11 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 shrink-0">
                          <Package className="size-4" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {item.nombre}
                        </p>
                        {desc && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {desc}
                          </p>
                        )}
                      </div>

                      {peso && (
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200/90 text-slate-800 text-xs font-black font-num shrink-0">
                          {peso}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Nota opcional al carnicero (discreta) */}
          <div>
            <label
              htmlFor="combo-notes"
              className="text-xs font-bold text-slate-600 mb-1.5 block"
            >
              Nota para el carnicero{" "}
              <span className="text-slate-400 font-medium">(opcional)</span>
            </label>
            <input
              id="combo-notes"
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: separar en bolsitas, asado corte fino..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#003366] transition-colors outline-none"
            />
          </div>
        </div>

        {/* Footer fijo limpio orientado a conversión */}
        <div className="border-t border-slate-100 px-5 sm:px-6 py-3.5 bg-white shrink-0 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            {/* Stepper compacto */}
            <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 shrink-0">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={cantidad <= 1}
                aria-label="Restar combo"
                className="size-8 rounded-lg bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer shadow-2xs"
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

            {/* Precio final */}
            <div className="text-right sm:text-left">
              <div className="flex items-baseline justify-end sm:justify-start gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-slate-900 leading-none font-num">
                  {formatPrecio(totalPrecio)}
                </span>
                {totalAnterior > totalPrecio && (
                  <span className="text-xs font-semibold text-slate-400 line-through font-num">
                    {formatPrecio(totalAnterior)}
                  </span>
                )}
              </div>
              {totalAhorro > 0 && (
                <span className="text-[11px] font-bold text-emerald-700 font-num">
                  Ahorrás {formatPrecio(totalAhorro)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full sm:w-auto sm:min-w-48 px-5 py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 bg-[#003366] hover:bg-valette-dark text-white active:scale-[0.98] transition-all cursor-pointer shadow-sm"
          >
            <ShoppingCart className="size-4" />
            <span>
              {cantidad > 1 ? `Agregar (${cantidad})` : "Agregar al Carrito"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComboDetailModal;
