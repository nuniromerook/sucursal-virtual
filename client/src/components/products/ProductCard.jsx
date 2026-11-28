// src/components/products/ProductCard.jsx
import {
  Heart,
  Plus,
  Bell,
  Minus,
  Percent,
  ShoppingBasket,
  Sparkles,
  Package,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useToast } from "@/context/ToastContext";
import {
  formatPrecio,
  formatUnidadMedida,
  formatPrecioPorUnidad,
} from "@/utils/formatters";
import { calculateItemPrice } from "@/utils/priceCalculator";

export const ProductCard = ({ product, onOpenCustomizer }) => {
  const unidadMedida = formatUnidadMedida(product.unidad_medida);
  const { cartItems, addToCart, updateItemCantidad, removeFromCart } =
    useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();

  const isFav = isFavorite(product.id);
  const isOutOfStock = product.sin_stock || product.activo === false;
  const productName = product.nombre || product.nombre_producto || "Corte";

  // Cantidad derivada directamente del carrito (sin useEffect ni desfase de estado)
  const cartItem = cartItems.find((item) => item.id === product.id);
  const currentQty = cartItem
    ? Number(cartItem.cantidad_kg || cartItem.cantidad || 0)
    : 0;

  // Cálculo reactivo de precio según cantidad seleccionada (o 1 unidad si aún está en 0)
  const displayKg = currentQty > 0 ? currentQty : 1;
  const priceInfo = calculateItemPrice({
    ...product,
    cantidad_kg: displayKg,
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

  // Manejo de suma directa al carrito con el botón (+)
  const handleIncrement = (e) => {
    e?.stopPropagation();
    if (isOutOfStock) return;

    if (currentQty === 0) {
      const defaultCorte =
        product.opciones_corte?.[0] ||
        (unidadMedida === "u" ? "Estándar" : "Corte tradicional");

      addToCart(product, 1, {
        corte: defaultCorte,
        unidad_medida: unidadMedida,
      });

      showToast(`Sumaste 1 ${unidadMedida} de ${productName} al pedido`);
    } else {
      updateItemCantidad(product.id, currentQty + 1);
      showToast(`Llevas ${currentQty + 1} ${unidadMedida} de ${productName}`);
    }
  };

  // Manejo de resta o eliminación del carrito con el botón (-)
  const handleDecrement = (e) => {
    e?.stopPropagation();
    if (isOutOfStock || currentQty <= 0) return;

    if (currentQty === 1) {
      removeFromCart(product.id);
      showToast(`Eliminaste ${productName} del carrito`, "info");
    } else {
      updateItemCantidad(product.id, currentQty - 1);
      showToast(`Llevas ${currentQty - 1} ${unidadMedida} de ${productName}`);
    }
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
        {/* Imagen con badges limpios y favorito */}
        <div
          onClick={handleOpenDetail}
          className={`relative aspect-square w-full bg-slate-100 mb-3 cursor-pointer group overflow-hidden ${
            isOutOfStock ? "grayscale-30" : ""
          }`}
        >
          {product.imagen_url ? (
            <img
              src={product.imagen_url}
              alt={productName}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <Package className="size-9 stroke-[1.5]" aria-hidden="true" />
            </div>
          )}

          {/* Badges superiores limpios y legibles sobre cualquier foto */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex flex-wrap gap-1.5 items-start pointer-events-none">
            {isOutOfStock ? (
              <span className="px-2.5 py-1 rounded-xl bg-slate-900/90 text-white text-[10.5px] font-extrabold tracking-tight shadow-xs">
                Agotado por hoy
              </span>
            ) : promoInfo ? (
              <span className="px-2.5 py-1 rounded-xl bg-white/95 border border-slate-200/80 text-slate-700 text-[11px] font-bold shadow-xs inline-flex items-center gap-1 max-w-full font-num">
                <span className="truncate">
                  Desde {promoInfo.cant}
                  {unidadMedida}
                </span>
                <strong className="text-[#003366] font-black shrink-0">
                  {formatPrecio(promoInfo.unitPrice)}/{unidadMedida}
                </strong>
              </span>
            ) : product.precio_anterior > product.precio ? (
              <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white text-[10.5px] font-extrabold tracking-tight shadow-xs font-num">
                {Math.round(
                  ((product.precio_anterior - product.precio) /
                    product.precio_anterior) *
                    100,
                ) >= 5
                  ? `-${Math.round(
                      ((product.precio_anterior - product.precio) /
                        product.precio_anterior) *
                        100,
                    )}% OFF`
                  : "Oferta"}
              </span>
            ) : null}
          </div>

          {/* Botón Favorito reactivo */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product.id, productName);
            }}
            aria-label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
            className={`absolute bottom-2.5 right-2.5 size-9 rounded-full bg-white flex items-center justify-center transition-colors duration-300 shadow-xs cursor-pointer border border-slate-200/70 ${
              isFav ? "text-red-500" : "text-slate-400 hover:text-red-500"
            }`}
          >
            <Heart
              className={`size-4.5 stroke-[2] ${isFav ? "fill-red-500 text-red-500" : ""}`}
              aria-hidden="true"
            />
          </button>

          {/* Puntos Club Valette (unificado con ProductDetailModal y ComboDetailModal) */}
          {product.gana_puntos !== false && Number(product.puntos || 15) > 0 && (
            <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/95 border border-slate-200/70 text-amber-900 text-[10.5px] font-black font-num shadow-xs">
              <Sparkles
                className="size-3 text-amber-500 shrink-0"
                aria-hidden="true"
              />
              <span>+{Number(product.puntos || 15)} pts</span>
            </span>
          )}
        </div>

        {/* Título y Metadata */}
        <div className="px-4">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-0.5">
            <span>{product.categoria_label || "Vacuno"}</span>
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                isOutOfStock ? "block text-rose-600 bg-rose-50" : "hidden"
              }`}
            >
              {isOutOfStock && "Sin Stock"}
            </span>
          </div>

          <h3
            onClick={handleOpenDetail}
            className="text-base font-extrabold text-slate-900 leading-snug cursor-pointer hover:text-[#003366] transition-colors"
          >
            {productName}
          </h3>
        </div>
      </div>

      {/* Bottom: Precio y Stepper directo */}
      <div className="py-3 px-4 border-t border-slate-100 mt-3 flex items-center justify-between gap-3">
        <div className="flex flex-col -space-y-0.5">
          <span className="text-lg font-black text-slate-900 font-num">
            {formatPrecio(priceInfo.total)}
          </span>
          <span className="text-[11px] text-slate-400 flex items-center">
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
              <span>
                {formatPrecioPorUnidad(product.precio, unidadMedida)}{" "}
              </span>
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
          /* Stepper dinámico: botón (-) deshabilitado en 0, 'Sumar' en el centro, botón (+) que agrega directo al carrito */
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/80 whitespace-nowrap shadow-2xs">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={currentQty === 0}
              className="size-7 rounded-lg bg-white hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-white text-slate-700 flex items-center justify-center font-bold active:scale-95 transition-all shadow-2xs cursor-pointer disabled:cursor-not-allowed"
              title={
                currentQty > 0 ? `Restar 1 ${unidadMedida}` : "Sin unidades"
              }
              aria-label="Restar 1"
            >
              <Minus className="size-3.5 stroke-[2.5]" />
            </button>

            <span
              onClick={(e) => {
                if (currentQty === 0) handleIncrement(e);
              }}
              className={`px-2 min-w-[60px] text-center select-none transition-colors ${
                currentQty === 0
                  ? "text-xs font-black text-slate-700 hover:text-[#003366] cursor-pointer"
                  : "text-sm font-black text-slate-900 font-num"
              }`}
            >
              {currentQty === 0 ? (
                <ShoppingBasket className="size-5 mx-auto shrink-0" />
              ) : (
                `${currentQty} ${unidadMedida}`
              )}
            </span>

            <button
              type="button"
              onClick={handleIncrement}
              className="size-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold active:scale-95 transition-all shadow-2xs cursor-pointer"
              title={`Sumar 1 ${unidadMedida}`}
              aria-label="Sumar 1"
            >
              <Plus className="size-3.5 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
