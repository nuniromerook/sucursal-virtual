// src/components/modals/ProductDetailModal.jsx
import React, { useState } from "react";
import {
  X,
  ChevronLeft,
  Heart,
  ShoppingCart,
  Plus,
  Minus,
  Flame,
  Users,
  Check,
  Sparkles,
  Beef,
  Package,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useToast } from "@/context/ToastContext";
import {
  formatPrecio,
  formatUnidadMedida,
  formatPrecioPorUnidad,
  formatCantidad,
} from "@/utils/formatters";
import { calculateItemPrice } from "@/utils/priceCalculator";
import { useModalBehavior } from "@/hooks/useModalBehavior";

export const ProductDetailModal = ({ isOpen, onClose, onBack, product }) => {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();

  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    onBack || onClose,
  );

  const unidadMedida = formatUnidadMedida(product?.unidad_medida);
  const esUnidad = unidadMedida === "u";
  const hasCutOptions =
    Array.isArray(product?.opciones_corte) && product.opciones_corte.length > 0;
  const defaultCut = hasCutOptions ? product.opciones_corte[0] : "";

  const [selectedKg, setSelectedKg] = useState(1);
  const [selectedCut, setSelectedCut] = useState(defaultCut);
  const [notas, setNotas] = useState("");

  if (!isOpen || !product) return null;

  const isFav = isFavorite(product.id);
  const isOutOfStock = product.sin_stock || product.activo === false;

  const priceInfo = calculateItemPrice({
    ...product,
    cantidad_kg: selectedKg,
  });

  const baseTotal = Math.round(selectedKg * (Number(product.precio) || 0));
  const hasNutrition =
    Number(product.proteinas) > 0 && Number(product.grasas) > 0;
  const showPoints =
    product.gana_puntos !== false && Number(product.puntos) > 0;

  const handleIncrement = () => setSelectedKg((prev) => Math.round(prev + 1));
  const handleDecrement = () =>
    setSelectedKg((prev) => Math.max(1, Math.round(prev - 1)));
  const handleSelectPredefinedKg = (kg) =>
    setSelectedKg(Math.max(1, Math.round(kg)));

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addToCart(product, selectedKg, {
      corte: hasCutOptions
        ? selectedCut || defaultCut
        : esUnidad
          ? "Estándar"
          : "Corte tradicional",
      notas: notas.trim() || undefined,
      unidad_medida: unidadMedida,
    });

    showToast(
      `Sumaste ${formatCantidad(selectedKg, unidadMedida)} de ${product.nombre} al pedido`,
    );
    (onBack || onClose)();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
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
              {product.categoria_label || "Corte Valette"}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => toggleFavorite(product.id, product.nombre)}
                title={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
                aria-label={
                  isFav ? "Quitar de favoritos" : "Guardar en favoritos"
                }
                className={`size-8 rounded-full bg-white border border-slate-200/80 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shadow-2xs ${
                  isFav ? "text-red-500" : "text-slate-500 hover:text-red-500"
                }`}
              >
                <Heart
                  className={`size-4 stroke-[2.25] ${
                    isFav ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </button>

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
        </div>

        {/* Cuerpo scrolleable, respirado y directo */}
        <div className="overflow-y-auto no-scrollbar flex-1 px-5 sm:px-6 py-4 space-y-5 overscroll-contain">
          {/* 1. Foto Protagonista aspect-video (sin fallback hardcodeado) */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-100">
            {product.imagen_url ? (
              <img
                src={product.imagen_url}
                alt={product.nombre}
                className={`w-full h-full object-cover ${
                  isOutOfStock ? "grayscale-30 opacity-85" : ""
                }`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Package className="size-10 stroke-[1.5]" />
              </div>
            )}

            {/* Badges superiores discretos */}
            {(isOutOfStock || product.badge || priceInfo.tienePromo) && (
              <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                {isOutOfStock ? (
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900/90 text-white text-[11px] font-extrabold shadow-xs">
                    Agotado por hoy
                  </span>
                ) : product.badge ? (
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900/85 text-white text-[11px] font-extrabold tracking-tight shadow-xs">
                    {product.badge}
                  </span>
                ) : null}

                {priceInfo.tienePromo && !isOutOfStock && (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-black shadow-xs">
                    Promo volumen activa
                  </span>
                )}
              </div>
            )}

            {/* Pill compacto Club Valette (abajo izquierda) */}
            {showPoints && (
              <div className="absolute bottom-3 left-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/95 text-amber-900 text-[11px] font-black font-num shadow-xs">
                  <Sparkles className="size-3 text-amber-500" />+
                  {Number(product.puntos)} pts Club
                </span>
              </div>
            )}
          </div>

          {/* 2. Título, precio de referencia, chips breves y descripción */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h1
                id="product-detail-title"
                className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug"
              >
                {product.nombre}
              </h1>

              <div className="text-right shrink-0">
                <span className="text-base sm:text-lg font-black text-[#003366] font-num block leading-tight">
                  {formatPrecio(product.precio)}
                  <span className="text-[11px] font-bold text-slate-400 ml-0.5">
                    /{unidadMedida}
                  </span>
                </span>
                {product.precio_anterior > product.precio && (
                  <span className="text-[11px] text-slate-400 line-through font-num">
                    {formatPrecio(product.precio_anterior)}
                  </span>
                )}
              </div>
            </div>

            {/* Chips breves de info útil (solo los que tengan datos reales) */}
            {(product.metodos_coccion?.length > 0 ||
              product.rinde_personas ||
              hasNutrition) && (
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
                {product.metodos_coccion?.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                    <Flame className="size-3.5 text-orange-500 shrink-0" />
                    {product.metodos_coccion.slice(0, 3).join(" · ")}
                  </span>
                )}
                {product.rinde_personas && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                    <Users className="size-3.5 text-[#003366] shrink-0" />
                    {product.rinde_personas}
                  </span>
                )}
                {hasNutrition && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-normal">
                    <b>Cada 100g | Proteínas:</b> {product.proteinas} g
                    <b>Grasas:</b> {product.grasas} g
                  </span>
                )}
              </div>
            )}

            {product.descripcion && (
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed pt-0.5">
                {product.descripcion}
              </p>
            )}
          </div>

          {/* 3. Selector de Cantidad + Promos por Volumen */}
          <div className="bg-slate-50/90 border border-slate-200/70 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 block">
                  Cantidad
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {esUnidad ? "Por unidad" : "Por kilogramo"}
                </span>
              </div>

              <div className="inline-flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={isOutOfStock || selectedKg <= 1}
                  aria-label={`Restar 1 ${unidadMedida}`}
                  className="size-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 disabled:opacity-40 cursor-pointer transition-colors"
                >
                  <Minus className="size-3.5 stroke-[2.5]" />
                </button>
                <span className="text-sm font-black text-slate-900 min-w-12 text-center font-num">
                  {selectedKg} {unidadMedida}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={isOutOfStock}
                  aria-label={`Sumar 1 ${unidadMedida}`}
                  className="size-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 disabled:opacity-40 cursor-pointer transition-colors"
                >
                  <Plus className="size-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Chips rápidos 1 a 5 */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[1, 2, 3, 4, 5].map((qty) => {
                const isSelected = selectedKg === qty;
                return (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => handleSelectPredefinedKg(qty)}
                    disabled={isOutOfStock}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer font-num ${
                      isSelected
                        ? "bg-[#003366] text-white shadow-2xs"
                        : "bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {qty} {unidadMedida}
                  </button>
                );
              })}
            </div>

            {/* Escalas de descuento por volumen */}
            {product.promos && product.promos.length > 0 && (
              <div className="pt-2.5 border-t border-slate-200/70 space-y-1.5">
                {product.promos.map((promo) => {
                  const activa = selectedKg >= promo.cantidad_kg;
                  return (
                    <div
                      key={promo.id || promo.cantidad_kg}
                      className={`flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-xl border transition-colors ${
                        activa
                          ? "bg-emerald-50 border-emerald-200 text-emerald-950 font-bold"
                          : "bg-white border-slate-200/80 text-slate-600"
                      }`}
                    >
                      <span className="truncate">
                        Desde {promo.cantidad_kg} {unidadMedida}:{" "}
                        <strong className="text-slate-900 font-num">
                          {formatPrecioPorUnidad(
                            promo.precio_promocional,
                            unidadMedida,
                          )}
                        </strong>
                      </span>
                      {activa ? (
                        <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                          Aplicada
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-num shrink-0">
                          +{promo.cantidad_kg - selectedKg} {unidadMedida}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Opciones de Corte (solo si existen en el producto) */}
          {hasCutOptions && (
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Beef className="size-3.5 text-[#003366]" />
                <span>Cómo te lo preparamos</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.opciones_corte.map((opc) => {
                  const isSelected = selectedCut === opc;
                  return (
                    <button
                      key={opc}
                      type="button"
                      onClick={() => setSelectedCut(opc)}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                        isSelected
                          ? "border-[#003366] bg-[#003366]/5 text-[#003366]"
                          : "border-slate-200/90 hover:border-slate-300 text-slate-700 bg-white"
                      }`}
                    >
                      <span className="leading-snug">{opc}</span>
                      {isSelected && (
                        <Check className="size-3.5 text-[#003366] stroke-3 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Nota opcional discreta */}
          <div>
            <label
              htmlFor="product-notes"
              className="text-xs font-bold text-slate-600 mb-1.5 block"
            >
              {hasCutOptions
                ? "Nota para el carnicero"
                : "Indicaciones o aclaraciones"}{" "}
              <span className="text-slate-400 font-medium">(opcional)</span>
            </label>
            <input
              id="product-notes"
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder={
                hasCutOptions
                  ? "Ej: sacar el cuerito, separar en dos bolsitas..."
                  : "Ej: dejar en recepción, empaquetar aparte..."
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#003366] transition-colors outline-none"
            />
          </div>
        </div>

        {/* Footer fijo limpio orientado a conversión */}
        <div className="border-t border-slate-100 px-5 sm:px-6 py-3.5 bg-white shrink-0 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-num leading-none">
                {formatPrecio(priceInfo.total)}
              </span>
              {priceInfo.ahorro > 0 && baseTotal > priceInfo.total && (
                <span className="text-xs font-semibold text-slate-400 line-through font-num">
                  {formatPrecio(baseTotal)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-bold text-slate-400 font-num">
                {selectedKg} {unidadMedida}
              </span>
              {priceInfo.ahorro > 0 && (
                <span className="text-[11px] font-bold text-emerald-700 font-num">
                  · Ahorrás {formatPrecio(priceInfo.ahorro)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`px-5 sm:px-7 py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer shrink-0 ${
              isOutOfStock
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-[#003366] hover:bg-valette-dark text-white"
            }`}
          >
            <ShoppingCart className="size-4" />
            <span>{isOutOfStock ? "Sin stock" : "Agregar al Carrito"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
