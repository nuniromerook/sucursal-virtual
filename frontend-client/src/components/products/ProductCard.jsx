// src/components/products/ProductCard.jsx
import { useState } from "react";
import { Heart, Plus, Bell, Minus, CirclePercent, Percent } from "lucide-react";
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

export const ProductCard = ({ product, onOpenCustomizer }) => {
  const unidadMedida = formatUnidadMedida(product.unidad_medida);
  const [selectedKg, setSelectedKg] = useState(1);
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();

  const isFav = isFavorite(product.id);
  const isOutOfStock = product.sin_stock || product.activo === false;

  // Cálculo reactivo de precio según cantidad seleccionada (sin tope máximo)
  const priceInfo = calculateItemPrice({
    ...product,
    cantidad_kg: selectedKg,
  });

  const primaryPromo =
    !isOutOfStock && product.promos && product.promos.length > 0
      ? product.promos[0]
      : null;

  const promoInfo = primaryPromo
    ? (() => {
        const cant = primaryPromo.cantidad_kg;
        const rawPromoPrice = parseFloat(primaryPromo.precio_promocional);
        const precioBase = parseFloat(product.precio || 0);
        const unitPrice =
          primaryPromo.precio_unitario_promo !== undefined
            ? parseFloat(primaryPromo.precio_unitario_promo)
            : rawPromoPrice >= precioBase && cant > 0
              ? Math.round(rawPromoPrice / cant)
              : rawPromoPrice;
        return {
          cant,
          unitPrice,
        };
      })()
    : null;

  const handleAdd = (e) => {
    e?.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, selectedKg, {
      corte:
        product.opciones_corte?.[0] ||
        (unidadMedida === "u" ? "Estándar" : "Corte tradicional"),
      unidad_medida: unidadMedida,
    });
    showToast(
      `Sumaste ${formatCantidad(selectedKg, unidadMedida)} de ${product.nombre} al pedido`,
    );
  };

  const handleOpenDetail = () => {
    if (onOpenCustomizer) {
      onOpenCustomizer(product, priceInfo.total);
    }
  };

  return (
    <div
      className={`h-full w-full bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-native flex flex-col justify-between hover:border-slate-300 transition-all ${
        isOutOfStock ? "opacity-85" : ""
      }`}
    >
      <div>
        {/* Imagen con badges nativos y favorito */}
        <div
          onClick={handleOpenDetail}
          className={`relative aspect-square w-full bg-slate-100 mb-3 cursor-pointer group ${
            isOutOfStock ? "grayscale-30" : ""
          }`}
        >
          <img
            src={
              product.imagen_url ||
              "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800"
            }
            alt={product.nombre}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            loading="lazy"
          />

          {/* Badges superiores */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start max-w-[calc(100%-3.25rem)]">
            {isOutOfStock ? (
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-white text-[10px] font-black uppercase shadow-xs">
                Agotado por Hoy
              </span>
            ) : promoInfo ? (
              <span className="px-2 py-1 rounded-lg bg-red-600/80 border border-red-400 text-white text-[11px] font-bold shadow-xs flex items-center gap-1 max-w-full">
                <Percent className="size-[13.5px] stroke-2" />
                <span>
                  Llevando {promoInfo.cant}
                  {unidadMedida} o más:
                </span>
                <strong className="text-amber-200 font-black">
                  {formatPrecio(promoInfo.unitPrice)}/{unidadMedida}
                </strong>
              </span>
            ) : product.badge ? (
              <span className="px-2.5 py-1 rounded-lg bg-valette-red text-white text-[10px] font-black uppercase shadow-xs">
                {product.badge}
              </span>
            ) : product.precio_anterior > product.precio ? (
              <span className="px-2.5 py-1 rounded-lg bg-valette-red text-white text-[10px] font-black uppercase shadow-xs">
                Oferta Especial
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-[#003366] text-white text-[10px] font-black uppercase shadow-xs">
                Corte Tradición
              </span>
            )}
          </div>

          {/* Botón Favorito reactivo */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product.id, product.nombre);
            }}
            className={`absolute top-2.5 right-2.5 size-9 rounded-full bg-white flex items-center justify-center transition-colors duration-400 shadow-xs cursor-pointer border border-neutral-100 ${
              isFav ? "text-red-500" : "text-neutral-400 hover:text-red-500"
            }`}
          >
            <Heart
              className={`size-5 stroke-1.1 ${isFav ? "fill-red-500 text-red-500" : ""}`}
            />
          </button>

          {/* Puntos Club flotantes */}
          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-amber-300/90 border border-amber-500 text-amber-700 text-[10px] font-bold">
            Sumás +{product.puntos || 15} pts Club Valette
          </span>
        </div>

        {/* Título y Metadata */}
        <div className="px-4">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-0.5">
            <span>{product.categoria_label || "Vacuno"}</span>
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                isOutOfStock
                  ? "text-rose-600 bg-rose-50"
                  : "text-emerald-700 bg-emerald-50"
              }`}
            >
              {isOutOfStock ? "Sin Stock" : "En Stock"}
            </span>
          </div>

          <h3
            onClick={handleOpenDetail}
            className="text-base font-extrabold text-slate-900 leading-snug cursor-pointer hover:text-[#003366] transition-colors"
          >
            {product.nombre}
          </h3>

          {/* Descripción llamativa expuesta en la card */}
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            {product.descripcion}
          </p>
        </div>
      </div>

      {/* Bottom: Precio y Acciones Duales con Stepper de unidades/kg enteros */}
      <div className="py-3 px-4 border-t border-slate-100 mt-3 flex items-center justify-between gap-3">
        <div>
          <span className="text-xl font-black text-slate-900 font-num">
            {formatPrecio(priceInfo.total)}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1 font-num">
            {priceInfo.tienePromo ? (
              <div className="flex flex-col">
                <span className="text-emerald-700 font-bold">
                  {formatPrecioPorUnidad(
                    priceInfo.precioUnitario,
                    unidadMedida,
                  )}
                </span>
                <span className="line-through text-slate-400 text-[10px]">
                  {formatPrecio(product.precio)}
                </span>
              </div>
            ) : (
              <span>{formatPrecioPorUnidad(product.precio, unidadMedida)}</span>
            )}
          </span>
        </div>

        {isOutOfStock ? (
          <button
            type="button"
            onClick={() =>
              showToast(
                "Te notificaremos por WhatsApp cuando reingrese stock.",
                "info",
              )
            }
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Bell className="size-3.5" />
            <span>Avisarme</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            {/* Stepper en unidades o kg enteros (1, 2, 3...) sin tope máximo */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/80 whitespace-nowrap">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedKg((prev) => Math.max(1, prev - 1));
                }}
                disabled={selectedKg <= 1}
                className="size-7 rounded-lg bg-white hover:bg-slate-200 disabled:opacity-30 text-slate-700 flex items-center justify-center font-bold active:scale-95 transition-transform shadow-2xs cursor-pointer"
                title={`Restar 1 ${unidadMedida}`}
              >
                <Minus className="size-3.5 stroke-[2.5]" />
              </button>
              <span className="text-sm font-black text-slate-800 px-2 min-w-15 text-center font-num">
                {selectedKg} {unidadMedida}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedKg((prev) => prev + 1);
                }}
                className="size-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold active:scale-95 transition-transform shadow-2xs cursor-pointer"
                title={`Sumar 1 ${unidadMedida}`}
              >
                <Plus className="size-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Botón rápido para sumar al changuito */}
            <button
              type="button"
              onClick={handleAdd}
              className="size-8.5 rounded-xl bg-[#003366] hover:bg-valette-dark text-white flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Agregar al carrito"
            >
              <Plus className="size-4 stroke-[3]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
