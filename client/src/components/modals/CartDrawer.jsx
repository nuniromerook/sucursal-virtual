// src/components/modals/CartDrawer.jsx
import React from "react";
import {
  X,
  ChevronLeft,
  Trash2,
  ArrowRight,
  Plus,
  Minus,
  Truck,
  Sparkles,
  Package,
  StickyNote,
  ShoppingBag,
  CheckCircle2,
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

export const CartDrawer = ({ isOpen, onClose, onBack, onOpenCheckout }) => {
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
    registerFunnelStep,
  } = useCart();

  const updateQty = updateItemCantidad || updateItemKg;

  const handleBackDrawer = () => {
    if (cartItems.length > 0 && registerFunnelStep) {
      registerFunnelStep("carrito_abierto", "cierre_carrito");
    }
    (onBack || onClose)();
  };

  const handleCloseDrawer = () => {
    if (cartItems.length > 0 && registerFunnelStep) {
      registerFunnelStep("carrito_abierto", "cierre_carrito");
    }
    onClose();
  };

  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    handleBackDrawer,
  );

  if (!isOpen) return null;

  const freeShippingThreshold = 30000;
  const progressPercent = Math.min(
    100,
    Math.round((totalEstimado / freeShippingThreshold) * 100),
  );
  const missingForFreeShipping = Math.max(
    0,
    freeShippingThreshold - totalEstimado,
  );
  const hasFreeShipping = missingForFreeShipping === 0;

  const handleCheckoutClick = () => {
    if (registerFunnelStep) {
      registerFunnelStep("checkout_datos", null);
    }
    onOpenCheckout();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      {/* Contenedor Modal / Bottom Sheet (88dvh en mobile para amplio espacio de scroll) */}
      <div
        ref={modalRef}
        className="bg-white w-full sm:max-w-xl md:max-w-2xl rounded-t-4xl sm:rounded-3xl shadow-2xl h-[88dvh] sm:h-auto sm:max-h-[88dvh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 overscroll-contain"
      >
        {/* Header uniforme con barra táctil de arrastre */}
        <div
          {...dragHandleProps}
          className="touch-none select-none shrink-0 px-5 sm:px-6 pt-3 pb-3 border-b border-slate-100 bg-white"
        >
          <div className="w-11 h-1 bg-slate-300 rounded-full mx-auto mb-2.5 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackDrawer}
              title="Volver"
              aria-label="Volver"
              className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronLeft
                className="size-4 stroke-[2.25]"
                aria-hidden="true"
              />
            </button>

            <div className="text-center">
              <h1
                id="cart-drawer-title"
                className="text-[15px] font-extrabold text-slate-900 tracking-tight leading-none"
              >
                Tu Carrito
              </h1>
              <span className="text-[11px] font-semibold text-slate-400 block mt-1 font-num">
                {totalItems} {totalItems === 1 ? "producto" : "productos"} ·{" "}
                {formatResumenCantidades(totalKg, totalUnidades)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCloseDrawer}
              title="Cerrar carrito"
              aria-label="Cerrar carrito"
              className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              <X className="size-4 stroke-[2.25]" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Cuerpo scrolleable con amplio espacio */}
        <div className="overflow-y-auto no-scrollbar flex-1 px-4 sm:px-6 py-3.5 space-y-3 overscroll-contain">
          {/* Barra compacta de Envío Bonificado */}
          <div
            className={`px-3.5 py-2.5 rounded-2xl border text-xs transition-colors ${
              hasFreeShipping
                ? "bg-emerald-50/90 border-emerald-200/80"
                : "bg-[#EFF4F9]/90 border-[#003366]/10"
            }`}
          >
            <div className="flex items-center justify-between gap-2 font-bold mb-1.5 font-num">
              <span
                className={`flex items-center gap-1.5 ${
                  hasFreeShipping ? "text-emerald-800" : "text-[#003366]"
                }`}
              >
                {hasFreeShipping ? (
                  <CheckCircle2
                    className="size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <Truck className="size-3.5 shrink-0" aria-hidden="true" />
                )}
                <span className="text-[11.5px] font-extrabold">
                  {hasFreeShipping
                    ? "Tenés envío bonificado"
                    : `Sumá ${formatPrecio(missingForFreeShipping)} para envío gratis`}
                </span>
              </span>
              <span className="text-[10.5px] font-bold text-slate-500 shrink-0">
                {progressPercent}%
              </span>
            </div>
            <div
              className={`w-full h-1.5 rounded-full overflow-hidden ${
                hasFreeShipping ? "bg-emerald-200/70" : "bg-slate-200/80"
              }`}
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  hasFreeShipping ? "bg-emerald-600" : "bg-[#003366]"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Lista de Cortes en el Carrito (cards conservadas intactas) */}
          {cartItems.length === 0 ? (
            <div className="py-14 text-center text-slate-400 flex flex-col items-center">
              <div className="size-14 rounded-2xl bg-[#EFF4F9] text-[#003366] flex items-center justify-center mb-3">
                <ShoppingBag
                  className="size-6 stroke-[1.9]"
                  aria-hidden="true"
                />
              </div>
              <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Tu carrito está vacío
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                Explorá el catálogo de cortes frescos y combos para armar tu
                pedido.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-5 py-2.5 rounded-2xl bg-[#003366] text-white font-extrabold text-xs hover:bg-valette-dark transition-colors cursor-pointer shadow-2xs"
              >
                Ver catálogo
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => {
                const itemCalc = calculateItemPrice(item);
                const itemImg =
                  item.imagen_url || item.imagenUrl || item.image || "";

                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/70 hover:border-slate-300 transition-colors shadow-2xs"
                  >
                    {/* Información del corte con foto */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 w-full">
                        {/* Miniatura de la foto */}
                        <div className="relative size-14 sm:size-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0 flex items-center justify-center text-slate-300">
                          {itemImg ? (
                            <img
                              src={itemImg}
                              alt={item.nombre}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <Package
                              className="size-6 stroke-[1.6]"
                              aria-hidden="true"
                            />
                          )}
                        </div>

                        {/* Detalle del producto y botón de eliminar */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-extrabold text-sm text-slate-900 leading-snug truncate">
                              {item.nombre}
                            </h3>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer shrink-0 rounded-lg hover:bg-red-50 -mr-1 -mt-1"
                              title="Eliminar corte del pedido"
                              aria-label={`Eliminar ${item.nombre}`}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              {item.corte || "Corte tradicional"}
                            </span>
                            <span>·</span>
                            <span className="font-num">
                              {formatPrecioPorUnidad(
                                item.precio,
                                item.unidad_medida,
                              )}
                            </span>
                          </div>

                          {item.items_combo && (
                            <p className="text-[10.5px] text-slate-500 line-clamp-1 mt-1 font-medium flex items-center gap-1">
                              <Package
                                className="size-3 text-slate-400 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="truncate">
                                Incluye: {item.items_combo}
                              </span>
                            </p>
                          )}

                          {item.notas && (
                            <p className="text-[11px] text-slate-600 mt-1 bg-amber-50/70 border border-amber-200/60 py-0.5 px-2 rounded-lg inline-flex items-center gap-1 max-w-full">
                              <StickyNote
                                className="size-3 text-amber-600 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="truncate">{item.notas}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Controles de Cantidad (Stepper de unidades / kg enteros) & Precio Total */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/80">
                        <button
                          type="button"
                          onClick={() =>
                            updateQty(
                              item.id,
                              (item.cantidad_kg || item.cantidad || 1) - 1,
                            )
                          }
                          className="size-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold active:scale-95 transition-transform shadow-2xs cursor-pointer"
                          title={`Restar 1 ${item.unidad_medida || "kg"}`}
                          aria-label={`Restar 1 ${item.unidad_medida || "kg"}`}
                        >
                          <Minus
                            className="size-3.5 stroke-[2.5]"
                            aria-hidden="true"
                          />
                        </button>
                        <span className="text-xs font-black text-slate-900 min-w-12 text-center px-2 font-num">
                          {formatCantidad(
                            item.cantidad_kg || item.cantidad || 1,
                            item.unidad_medida,
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQty(
                              item.id,
                              (item.cantidad_kg || item.cantidad || 1) + 1,
                            )
                          }
                          className="size-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold active:scale-95 transition-transform shadow-2xs cursor-pointer"
                          title={`Sumar 1 ${item.unidad_medida || "kg"}`}
                          aria-label={`Sumar 1 ${item.unidad_medida || "kg"}`}
                        >
                          <Plus
                            className="size-3.5 stroke-[2.5]"
                            aria-hidden="true"
                          />
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

        {/* Footer Fijo Compacto (libera más de 100px de scroll en mobile) */}
        {cartItems.length > 0 && (
          <div className="border-t border-slate-200/80 px-4 sm:px-6 py-3 bg-white shrink-0 space-y-2">
            {/* Línea compacta de beneficios (puntos + ahorro) */}
            {(totalPuntos > 0 || totalAhorro > 0) && (
              <div className="flex items-center justify-between gap-2 text-[11px] font-num">
                {totalPuntos > 0 && (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-full">
                    <Sparkles
                      className="size-3 text-amber-500 shrink-0"
                      aria-hidden="true"
                    />
                    <span>+{totalPuntos} pts Club</span>
                  </span>
                )}
                {totalAhorro > 0 && (
                  <span className="font-extrabold text-emerald-700 ml-auto">
                    Ahorrás {formatPrecio(totalAhorro)}
                  </span>
                )}
              </div>
            )}

            {/* Total + Botón CTA en una sola fila limpia */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-num leading-none">
                    {formatPrecio(totalEstimado)}
                  </span>
                  {totalAhorro > 0 && subtotal > totalEstimado && (
                    <span className="text-xs font-semibold text-slate-400 line-through font-num">
                      {formatPrecio(subtotal)}
                    </span>
                  )}
                </div>
                <span className="text-[10.5px] font-medium text-slate-400 block mt-0.5 truncate">
                  Total de tu compra
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="hidden sm:inline-flex py-3 px-4 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
                >
                  Seguir
                </button>
                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  className="py-3 px-5 sm:px-6 rounded-2xl bg-[#003366] hover:bg-valette-dark text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Finalizar Pedido</span>
                  <ArrowRight
                    className="size-4 stroke-[2.5]"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
