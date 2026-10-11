import React, { useState } from "react";
import {
  X,
  Heart,
  ShoppingCart,
  Plus,
  Minus,
  Flame,
  Users,
  Check,
  Info,
  Sparkles,
  Beef,
  Coins,
  Activity,
  HandCoins,
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

export const ProductDetailModal = ({ isOpen, onClose, product }) => {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();

  // Estandarización de comportamiento: bloqueo de scroll, escape y backdrop + gesto táctil de cierre
  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    onClose,
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

  // Cálculo financiero reactivo con promociones por volumen (sin tope máximo)
  const priceInfo = calculateItemPrice({
    ...product,
    cantidad_kg: selectedKg,
  });

  const handleIncrement = () => {
    setSelectedKg((prev) => Math.round(prev + 1));
  };

  const handleDecrement = () => {
    setSelectedKg((prev) => Math.max(1, Math.round(prev - 1)));
  };

  const handleSelectPredefinedKg = (kg) => {
    setSelectedKg(Math.max(1, Math.round(kg)));
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addToCart(product, selectedKg, {
      corte: hasCutOptions
        ? selectedCut || defaultCut
        : esUnidad
          ? "Estándar"
          : "Corte tradicional",
      notas,
      unidad_medida: unidadMedida,
    });

    showToast(
      `Sumaste ${formatCantidad(selectedKg, unidadMedida)} de ${product.nombre} al pedido`,
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
    >
      {/* Contenedor Modal / Bottom Sheet */}
      <div
        ref={modalRef}
        className="bg-white w-full sm:max-w-xl md:max-w-2xl rounded-t-4xl sm:rounded-3xl shadow-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Zona táctil de arrastre (barra + header superior) */}
        <div {...dragHandleProps} className="touch-none select-none shrink-0">
          {/* Barra táctil para deslizar en celulares */}
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-3 sm:hidden shrink-0 cursor-grab" />

          {/* Header Superior del Modal */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                {product.categoria_label || "Frigorífico Valette"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Botón Favorito */}
              <button
                type="button"
                onClick={() => toggleFavorite(product.id, product.nombre)}
                title={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
                className={`size-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer ${
                  isFav ? "text-red-500" : "text-slate-500 hover:text-red-500"
                }`}
              >
                <Heart
                  className={`size-4 stroke-[2.2] ${
                    isFav ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </button>

              {/* Botón Cerrar */}
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
        </div>

        {/* Cuerpo del Modal con scroll fluido */}
        <div className="overflow-y-auto no-scrollbar flex-1 px-5 sm:px-7 py-4 space-y-6">
          {/* 1. Imagen Principal con Badges */}
          <div className="relative w-full aspect-4/3 sm:aspect-auto sm:h-64 bg-slate-100 rounded-2xl overflow-hidden shadow-2xs">
            <img
              src={
                product.imagen_url ||
                "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800"
              }
              alt={product.nombre}
              className={`w-full h-full object-cover ${
                isOutOfStock ? "grayscale-30" : ""
              }`}
            />

            {/* Badges superiores sobre la imagen */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
              {isOutOfStock ? (
                <span className="px-3 py-1 rounded-xl bg-slate-900 text-white text-[11px] font-black uppercase shadow-xs">
                  Agotado por hoy
                </span>
              ) : product.badge ? (
                <span className="px-3 py-1 rounded-xl bg-valette-red text-white text-[11px] font-black uppercase shadow-xs">
                  {product.badge}
                </span>
              ) : null}

              {priceInfo.tienePromo && (
                <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 text-[11px] font-black uppercase shadow-xs flex items-center gap-1">
                  <Sparkles className="size-3 stroke-[2.5]" />
                  <span>¡Descuento por volumen activo!</span>
                </span>
              )}
            </div>

            {/* Puntos Club Valette */}
            <span className="absolute bottom-3 left-3 pl-1 pr-2 py-1 rounded-lg bg-yellow-500/70 border border-amber-400 text-slate-900 text-[11px] font-black shadow-xs flex items-center gap-2">
              <HandCoins className="size-5.5 stroke-[2.5] text-amber-500 bg-white border border-amber-400 rounded-md p-1" />
              <span>
                Sumás{" "}
                <span className="text-amber-900">+{product.puntos || 15}</span>{" "}
                Puntos
              </span>
            </span>
          </div>

          {/* 2. Nombre, Precio Base y Descripción única llamativa */}
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {product.nombre}
              </h2>

              {/* Tag sutil de precio de lista / referencia por unidad o kilo */}
              <div className="inline-flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/80 px-2.5 py-1 rounded-xl">
                <span className="text-[11px] font-bold text-slate-500">
                  {esUnidad ? "Unidad" : "Por kilo"}
                </span>
                <span className="text-sm font-black text-slate-900 font-num">
                  {formatPrecio(product.precio)}
                </span>
                {product.precio_anterior > product.precio && (
                  <span className="text-[11px] text-slate-400 line-through font-num ml-0.5">
                    {formatPrecio(product.precio_anterior)}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
              {product.descripcion}
            </p>
          </div>

          {/* 3. Ficha Técnica Rápida (Rendimiento, Cocción & Información Nutricional de PostgreSQL) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-2">
            {product.metodos_coccion && product.metodos_coccion.length > 0 && (
              <div className="flex items-center gap-2.5">
                <Flame className="size-4 text-orange-500 shrink-0" />
                <div className="-space-y-0.5 min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Cocción
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 truncate block">
                    {product.metodos_coccion.join(", ")}
                  </span>
                </div>
              </div>
            )}

            {product.rinde_personas && (
              <div className="flex items-center gap-2.5">
                <Users className="size-4 text-slate-500 shrink-0" />
                <div className="-space-y-0.5 min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Rendimiento
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 truncate block">
                    {product.rinde_personas}
                  </span>
                </div>
              </div>
            )}

            {/* Proteínas & Grasas de PostgreSQL */}
            <div className="flex items-center gap-2.5">
              <Info className="size-4 text-[#003366] shrink-0" />
              <div className="-space-y-0.5 min-w-0">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Proteínas / Grasas
                </span>
                <span className="text-xs font-extrabold text-slate-800 truncate block font-num">
                  {product.proteinas || 20}g{" "}
                  <span className="text-slate-300">|</span>{" "}
                  {product.grasas || 15}g
                </span>
              </div>
            </div>
          </div>

          {/* 4. Selector de Cantidad Simple en Unidades o Kilogramos Enteros (sin topes ni piezas) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="-space-y-0.5">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Cantidad
                </label>
                <span className="text-[11px] text-slate-500">
                  {esUnidad ? "Venta por unidad" : "Venta por kilogramo entero"}
                </span>
              </div>

              {/* Stepper +/- de 1 en 1 (sin tope máximo) */}
              <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={isOutOfStock || selectedKg <= 1}
                  className="size-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black active:scale-95 disabled:opacity-40 cursor-pointer transition-colors"
                  title={`Restar 1 ${unidadMedida}`}
                >
                  <Minus className="size-4 stroke-[2.5]" />
                </button>
                <span className="text-sm font-black text-slate-900 min-w-12.5 text-center font-num">
                  {selectedKg} {unidadMedida}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={isOutOfStock}
                  className="size-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black active:scale-95 disabled:opacity-50 cursor-pointer transition-colors"
                  title={`Sumar 1 ${unidadMedida}`}
                >
                  <Plus className="size-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Chips rápidos de selección enteros (1 a 5) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              {[1, 2, 3, 4, 5].map((qty) => {
                const isSelected = selectedKg === qty;
                return (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => handleSelectPredefinedKg(qty)}
                    className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer font-num ${
                      isSelected
                        ? "bg-[#003366] text-white shadow-2xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {qty} {unidadMedida}
                  </button>
                );
              })}
            </div>

            {/* Promociones por volumen si existen */}
            {product.promos && product.promos.length > 0 && (
              <div className="mt-3.5 pt-3 border-t border-slate-200/70 space-y-1.5">
                {product.promos.map((promo) => {
                  const activa = selectedKg >= promo.cantidad_kg;
                  return (
                    <div
                      key={promo.id || promo.cantidad_kg}
                      className={`flex items-center justify-between text-xs p-2.5 rounded-xl border transition-colors ${
                        activa
                          ? "bg-amber-50 border-amber-200 text-amber-950 font-bold"
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles
                          className={`size-3.5 ${
                            activa ? "text-amber-600" : "text-slate-400"
                          }`}
                        />
                        <span>
                          Llevando {promo.cantidad_kg} {unidadMedida} o más:{" "}
                          <strong className="text-slate-900 font-num">
                            {formatPrecioPorUnidad(
                              promo.precio_promocional,
                              unidadMedida,
                            )}
                          </strong>
                        </span>
                      </div>
                      {activa ? (
                        <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                          ¡Promo aplicada!
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-num">
                          Faltan {promo.cantidad_kg - selectedKg} {unidadMedida}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Personalización del Carnicero (Cortes y Preparación) */}
          {hasCutOptions && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Beef className="size-3.5 text-[#003366]" />
                  <span>¿Cómo lo preparamos?</span>
                </label>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Sin cargo
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.opciones_corte.map((opc) => {
                  const isSelected = selectedCut === opc;
                  return (
                    <button
                      key={opc}
                      type="button"
                      onClick={() => setSelectedCut(opc)}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "border-[#003366] bg-[#003366]/5 text-[#003366]"
                          : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                      }`}
                    >
                      <span>{opc}</span>
                      {isSelected && (
                        <Check className="size-3.5 text-[#003366] stroke-3" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Indicaciones / Notas al Cortador o de Entrega */}
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1.5 block">
              {!hasCutOptions
                ? "Indicaciones o aclaraciones:"
                : "Indicaciones especiales para el cortador:"}
            </label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder={
                !hasCutOptions
                  ? "Ej: dejar en recepción, empaquetar por separado..."
                  : "Ej: sacar el cuerito, dividir en dos bolsitas, desgrasar..."
              }
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs focus:ring-1 focus:ring-[#003366]/20 transition-all outline-none"
            />
          </div>
        </div>

        {/* Footer Fijo con Total y Botón CTA */}
        <div className="border-t border-slate-100 px-5 py-3.5 sm:px-7 sm:py-4 bg-white shrink-0 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Total ({selectedKg} {unidadMedida})
              </span>
              {priceInfo.ahorro > 0 && (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md leading-none">
                  Ahorrás {formatPrecio(priceInfo.ahorro)}
                </span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#003366] font-num leading-tight mt-0.5">
              {formatPrecio(priceInfo.total)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`px-5 sm:px-7 py-3.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer shrink-0 ${
              isOutOfStock
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-[#003366] hover:bg-valette-dark text-white"
            }`}
          >
            <ShoppingCart className="size-4" />
            <span>Agregar al Carrito</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
