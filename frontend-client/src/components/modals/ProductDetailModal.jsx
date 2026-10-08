// src/components/modals/ProductDetailModal.jsx
import React, { useState, useMemo } from "react";
import {
  X,
  Heart,
  ShoppingCart,
  Plus,
  Minus,
  Scale,
  Flame,
  Users,
  Check,
  Info,
  Sparkles,
  Beef,
  Coins,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useToast } from "@/context/ToastContext";
import { formatPrecio } from "@/utils/formatters";
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

  // Valores iniciales calculados en kg enteros según el corte
  const defaultKg = useMemo(() => {
    if (!product) return 1;
    if (product.es_pieza_entera && product.peso_promedio_pieza) {
      return Math.max(1, Math.round(product.peso_promedio_pieza));
    }
    return 1;
  }, [product]);

  const defaultCut = useMemo(() => {
    if (!product) return "Corte tradicional";
    return product.opciones_corte && product.opciones_corte.length > 0
      ? product.opciones_corte[0]
      : "Corte tradicional";
  }, [product]);

  const [selectedKg, setSelectedKg] = useState(defaultKg);
  const [selectedCut, setSelectedCut] = useState(defaultCut);
  const [notas, setNotas] = useState("");

  if (!isOpen || !product) return null;

  const isFav = isFavorite(product.id);
  const isOutOfStock = product.sin_stock || product.activo === false;

  // Cálculo financiero reactivo con promociones por volumen (estrictamente en kg enteros)
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
      corte: selectedCut,
      notas,
      es_pieza_entera: !!product.es_pieza_entera,
    });

    showToast(`Sumaste ${selectedKg} kg de ${product.nombre} al pedido`);
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
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-3 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />

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
          <div className="relative w-full h-52 sm:h-64 bg-slate-100 rounded-2xl overflow-hidden shadow-2xs">
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
              ) : product.es_pieza_entera ? (
                <span className="px-3 py-1 rounded-xl bg-[#003366] text-white text-[11px] font-black uppercase shadow-xs flex items-center gap-1">
                  <Scale className="size-3 stroke-[2.5]" />
                  <span>Venta x Pieza Entera</span>
                </span>
              ) : product.badge ? (
                <span className="px-3 py-1 rounded-xl bg-[#c53030] text-white text-[11px] font-black uppercase shadow-xs">
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
            <span className="absolute bottom-3 left-3 pl-1.5 pr-2.5 py-1 rounded-xl bg-amber-400 text-slate-900 text-[11px] font-black shadow-xs flex items-center gap-1">
              <Coins className="size-5.5 stroke-[2.5] text-amber-600 bg-white rounded-full p-1" />
              <span>
                Sumás{" "}
                <span className="text-amber-900">+{product.puntos || 15}</span>{" "}
                Puntos Club Valette
              </span>
            </span>
          </div>

          {/* 2. Nombre, Precio Base y Descripción */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {product.nombre}
              </h2>

              <div className="flex items-baseline gap-2 shrink-0">
                <span className="text-2xl sm:text-3xl font-black text-[#003366]">
                  {formatPrecio(product.precio)}
                </span>
                <span className="text-xs font-bold text-slate-400">/ kg</span>

                {product.precio_anterior > product.precio && (
                  <span className="text-xs text-slate-400 line-through ml-1">
                    {formatPrecio(product.precio_anterior)}/kg
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mt-4 leading-relaxed">
              {product.descripcion_larga || product.descripcion}
            </p>
          </div>

          {/* 3. Ficha Técnica Rápida (Rendimiento & Cocción) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:items-center lg:justify-around gap-2.5 pb-2">
            {product.metodos_coccion && product.metodos_coccion.length > 0 && (
              <div className="flex items-center gap-2.5 col-span-2">
                <Flame className="size-4 text-orange-500 shrink-0" />
                <div className="-space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Ideal para
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 truncate">
                    {product.metodos_coccion.join(", ")}
                  </span>
                </div>
              </div>
            )}

            {product.rinde_personas && (
              <div className="flex items-center gap-2.5">
                <Users className="size-4 text-slate-500 shrink-0" />
                <div className="-space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Rendimiento
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {product.rinde_personas}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <Info className="size-4 text-[#003366] shrink-0" />
              <div className="flex items-center justify-between flex-1 gap-4">
                <div className="-space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Proteínas ~
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    13.5g / 100g
                  </span>
                </div>
                <div className="-space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Grasas ~
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    7g / 100g
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Aclaración de Pieza Entera (Comportamiento Luis Guillón) */}
          {product.es_pieza_entera && (
            <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-950">
              <div className="p-2 rounded-xl bg-blue-100 text-[#003366] shrink-0 mt-0.5">
                <Scale className="size-4 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="font-extrabold text-[13px] text-[#003366]">
                  Corte por Pieza Entera en Frigorífico
                </h4>
                <p className="text-blue-900/85 mt-1 leading-normal">
                  El precio publicado es por kilo llevando la pieza completa
                  (peso estimado aprox.{" "}
                  <strong>
                    {Math.round(product.peso_min_pieza || 2)} kg a{" "}
                    {Math.round(product.peso_max_pieza || 3)} kg
                  </strong>
                  ). El importe final exacto se confirma con el pesaje en la
                  balanza al preparar tu pedido.
                </p>
              </div>
            </div>
          )}

          {/* 4. Selector de Cantidad en Kilogramos Enteros (1kg, 2kg, 3kg...) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="-space-y-1.5">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  {product.es_pieza_entera ? "cantidad" : "Cantidad en Kg"}
                </label>
                <span className="text-[11px] text-slate-500">
                  {product.es_pieza_entera
                    ? "Máximo 3kg"
                    : "Venta exclusiva por kilo entero"}
                </span>
              </div>

              {/* Stepper +/- estricto de 1 kg en 1 kg */}
              <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={isOutOfStock || selectedKg <= 1}
                  className="size-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black active:scale-95 disabled:opacity-40 cursor-pointer"
                  title="Restar 1 kg"
                >
                  <Minus className="size-4" />
                </button>
                <span className="text-sm font-black text-slate-900 min-w-[50px] text-center">
                  {selectedKg} kg
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={isOutOfStock}
                  className="size-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-black active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Sumar 1 kg"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            {/* Chips rápidos de peso entero */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              {product.es_pieza_entera ? (
                <>
                  {[
                    { label: "1 Pieza Chica", kg: 2 },
                    { label: "1 Pieza Estándar", kg: 3 },
                    { label: "1 Pieza Grande", kg: 4 },
                    { label: "2 Piezas", kg: 5 },
                  ].map((preset) => {
                    const isSelected = selectedKg === preset.kg;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleSelectPredefinedKg(preset.kg)}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#003366] text-white shadow-2xs"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span>{preset.label}</span>
                        <span className="text-[10px] opacity-80 block font-normal">
                          {preset.kg} kg
                        </span>
                      </button>
                    );
                  })}
                </>
              ) : (
                <>
                  {[1, 2, 3, 4, 5].map((kg) => {
                    const isSelected = selectedKg === kg;
                    return (
                      <button
                        key={kg}
                        type="button"
                        onClick={() => handleSelectPredefinedKg(kg)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#003366] text-white shadow-2xs"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {kg} kg
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Promociones por volumen si existen */}
            {product.promos && product.promos.length > 0 && (
              <div className="mt-3.5 pt-3 border-t border-slate-200/70 space-y-1.5">
                {product.promos.map((promo) => {
                  const activa = selectedKg >= promo.cantidad_kg;
                  return (
                    <div
                      key={promo.id || promo.cantidad_kg}
                      className={`text-xs p-2.5 rounded-xl border flex items-center justify-between ${
                        activa
                          ? "bg-emerald-50 border-emerald-200 text-emerald-950 font-bold"
                          : "bg-white border-slate-200/70 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-500">🔥</span>
                        <span>
                          Llevando {promo.cantidad_kg} kg o más:{" "}
                          <strong>
                            {formatPrecio(promo.precio_promocional)}/kg
                          </strong>
                        </span>
                      </div>
                      {activa ? (
                        <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md uppercase font-black">
                          Aplicado
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          Falta {promo.cantidad_kg - selectedKg} kg
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Personalización del Carnicero (Cortes y Preparación) */}
          {product.opciones_corte && product.opciones_corte.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Beef className="size-3.5 text-[#003366]" />
                  <span>Cómo lo preparamos?</span>
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
                        <Check className="size-3.5 text-[#003366] stroke-[3]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Indicaciones / Notas al Cortador */}
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1.5 block">
              Indicaciones especiales para el cortador:
            </label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: sacar el cuerito, dividir en dos bolsitas, desgrasar..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:ring-2 focus:ring-[#003366]/20 transition-all outline-none"
            />
          </div>
        </div>

        {/* Footer Fijo con Total y Botón CTA */}
        <div className="border-t border-slate-100 p-4 sm:p-5 bg-white shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                Total Estimado
              </span>
              {priceInfo.ahorro > 0 && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ml-auto">
                  Ahorrás {formatPrecio(priceInfo.ahorro)}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {formatPrecio(priceInfo.total)}
              </span>
              <span className="text-xs font-medium text-slate-400">
                ({selectedKg} kg)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer ${
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
