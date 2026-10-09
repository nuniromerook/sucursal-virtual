// src/components/modals/CartDrawer.jsx
import React from "react";
import {
  X,
  Trash2,
  ArrowRight,
  Plus,
  Minus,
  Truck,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import {
  formatPrecio,
  formatCantidad,
  formatPrecioPorUnidad,
  formatResumenCantidades,
} from "@/utils/formatters";
import { calculateItemPrice } from "@/utils/priceCalculator";
import { useModalBehavior } from "@/hooks/useModalBehavior";

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800";

export const CartDrawer = ({ isOpen, onClose, onOpenCheckout }) => {
  const {
    cartItems,
    totalItems,
    totalKg,
    totalUnidades,
    subtotal,
    totalAhorro,
    totalEstimado,
    totalPuntos,
    updateItemKg,
    updateItemCantidad,
    removeFromCart,
  } = useCart();

  const updateQty = updateItemCantidad || updateItemKg;

  // Estandarización de comportamiento: bloqueo de scroll, escape y backdrop + gesto táctil de cierre
  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    onClose
  );

  if (!isOpen) return null;

  const freeShippingThreshold = 30000;
  const progressPercent = Math.min(
    100,
    Math.round((totalEstimado / freeShippingThreshold) * 100)
  );
  const missingForFreeShipping = Math.max(
    0,
    freeShippingThreshold - totalEstimado
  );

  const handleCheckoutClick = () => {
    onClose();
    onOpenCheckout();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
    >
      {/* Contenedor Modal / Bottom Sheet */}
      <div
        ref={modalRef}
        className="bg-white w-full sm:max-w-xl md:max-w-2xl rounded-t-4xl sm:rounded-3xl shadow-2xl h-[80vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Zona táctil de arrastre (barra + header superior) */}
        <div {...dragHandleProps} className="touch-none select-none shrink-0">
          {/* Barra táctil para deslizar en celulares */}
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-3 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />

          {/* Header Superior del Carrito */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-none">
                Tu Carrito
              </h3>
              <span className="text-[11px] font-bold text-slate-400 block mt-0.5 font-num">
                {totalItems}{" "}
                {totalItems === 1
                  ? "producto seleccionado"
                  : "productos seleccionados"}{" "}
                ({formatResumenCantidades(totalKg, totalUnidades)})
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Cerrar carrito"
              className="size-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center font-bold transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Carrito con scroll fluido */}
        <div className="overflow-y-auto no-scrollbar flex-1 px-5 sm:px-7 py-4 space-y-4">
          {/* Barra de Cadena de Frío y Envío Bonificado */}
          <div className="p-3.5 rounded-2xl bg-blue-50/90 border border-blue-200/80 text-xs">
            <div className="flex items-center justify-between font-black text-blue-950 mb-1.5 font-num">
              <span className="flex items-center gap-1.5">
                <Truck className="size-4 text-[#003366]" />
                <span>Envío gratis</span>
              </span>
              <span>
                {formatPrecio(totalEstimado)} /{" "}
                {formatPrecio(freeShippingThreshold)}
              </span>
            </div>
            <div className="w-full h-2 bg-blue-200/70 rounded-full overflow-hidden">
              <div
                className="bg-[#003366] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-blue-900 font-semibold mt-1.5 font-num">
              {missingForFreeShipping === 0
                ? "🎉 ¡Felicitaciones! Tenés envío 100% bonificado."
                : `Sumá ${formatPrecio(missingForFreeShipping)} más para bonificar el envío.`}
            </p>
          </div>

          {/* Lista de Cortes en el Carrito */}
          {cartItems.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center">
              <div className="size-16 rounded-2xl bg-slate-100 text-3xl flex items-center justify-center mb-3">
                🥩
              </div>
              <h4 className="font-extrabold text-slate-800 text-base">
                Tu carrito está vacío
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Explorá nuestro catálogo de carnicería y frigorífico para sumar
                cortes frescos.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#003366] text-white font-bold text-xs hover:bg-valette-dark transition-colors cursor-pointer"
              >
                Ver Catálogo de Cortes
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 space-y-3">
              {cartItems.map((item) => {
                const itemCalc = calculateItemPrice(item);
                const itemImg =
                  item.imagen_url ||
                  item.imagenUrl ||
                  item.image ||
                  DEFAULT_FALLBACK_IMAGE;

                return (
                  <div
                    key={item.id}
                    className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/70 hover:border-slate-300 transition-colors shadow-2xs"
                  >
                    {/* Información del corte con foto */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 w-full">
                        {/* Miniatura de la foto con contenedor y fallback */}
                        <div className="relative size-14 sm:size-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0">
                          <img
                            src={itemImg}
                            alt={item.nombre}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                            }}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* Detalle del producto y botón de eliminar */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-extrabold text-sm text-slate-900 leading-snug truncate">
                              {item.nombre}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer shrink-0 rounded-lg hover:bg-red-50 -mr-1 -mt-1"
                              title="Eliminar corte del pedido"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              {item.corte || "Corte tradicional"}
                            </span>
                            <span>•</span>
                            <span className="font-num">
                              {formatPrecioPorUnidad(
                                item.precio,
                                item.unidad_medida
                              )}
                            </span>
                          </div>

                          {item.items_combo && (
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-1 font-medium">
                              📦 Incluye: {item.items_combo}
                            </p>
                          )}

                          {item.notas && (
                            <p className="text-[11px] text-slate-500 italic mt-1 bg-amber-50/70 border border-amber-200/60 p-1 px-2 rounded-lg inline-block">
                              📝 {item.notas}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Controles de Cantidad (Stepper de unidades / kg enteros) & Precio Total */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Stepper dinámico por unidad / kg */}
                      <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/80">
                        <button
                          type="button"
                          onClick={() =>
                            updateQty(
                              item.id,
                              (item.cantidad_kg || item.cantidad || 1) - 1
                            )
                          }
                          className="size-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold active:scale-95 transition-transform shadow-2xs cursor-pointer"
                          title={`Restar 1 ${item.unidad_medida || "kg"}`}
                        >
                          <Minus className="size-3.5 stroke-[2.5]" />
                        </button>
                        <span className="text-xs font-black text-slate-900 min-w-12 text-center px-2 font-num">
                          {formatCantidad(
                            item.cantidad_kg || item.cantidad || 1,
                            item.unidad_medida
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQty(
                              item.id,
                              (item.cantidad_kg || item.cantidad || 1) + 1
                            )
                          }
                          className="size-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold active:scale-95 transition-transform shadow-2xs cursor-pointer"
                          title={`Sumar 1 ${item.unidad_medida || "kg"}`}
                        >
                          <Plus className="size-3.5 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Total individual del corte */}
                      <div className="text-right">
                        <span className="text-base font-black text-[#003366] block leading-tight font-num">
                          {formatPrecio(itemCalc.total)}
                        </span>
                        {itemCalc.ahorro > 0 && (
                          <span className="text-[10px] text-emerald-700 font-bold block font-num">
                            Ahorro: -{formatPrecio(itemCalc.ahorro)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Fijo con Desglose Financiero y CTA */}
        {cartItems.length > 0 && (
          <div className="border-t border-slate-200/80 p-4 sm:p-5 bg-white shrink-0 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="text-amber-600 font-bold font-num">
                <span>Ganás +{totalPuntos} puntos Club Valette</span>
              </div>

              <div className="flex justify-between text-slate-500 mt-2 font-num">
                <span>
                  Subtotal estimado (
                  {formatResumenCantidades(totalKg, totalUnidades)}):
                </span>
                <span className="font-bold text-slate-800">
                  {formatPrecio(subtotal)}
                </span>
              </div>

              {totalAhorro > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold font-num">
                  <span>Ahorro por Promociones:</span>
                  <span>-{formatPrecio(totalAhorro)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100 items-baseline">
                <div>
                  <span className="block leading-none">Total Estimado:</span>
                  <span className="text-[10px] font-normal text-slate-400 block mt-0.5">
                    Precios sujetos a pesaje final en mostrador
                  </span>
                </div>
                <span className="text-2xl font-black text-[#003366] font-num">
                  {formatPrecio(totalEstimado)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer hidden sm:block text-center"
              >
                Seguir Comprando
              </button>

              <button
                type="button"
                onClick={handleCheckoutClick}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#003366] hover:bg-valette-dark text-white font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer sm:col-span-1"
              >
                <span>Finalizar Pedido ({formatPrecio(totalEstimado)})</span>
                <ArrowRight className="size-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
