import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  Tag,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useCart, calculateItemPrice } from "../context/CartContext";
import { formatPrecio, formatCantidad } from "../utils/formatters";
import CartAlerts from "./CartAlerts";

const DUMMY_IMAGE =
  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800";

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    cartItems,
    isCartOpen,
    isSyncing,
    cartAlerts,
    closeCart,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    removeFromCart,
    clearCart,
    dismissAlert,
    clearAlerts,
    refetchCarrito,
    subtotal,
    totalEstimado,
    totalAhorro,
    totalKg,
    totalUnidades,
    resumenCantidad,
    totalItems,
    totalPuntos,
  } = useCart();

  const drawerRef = useRef(null);

  // Swipe to close
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance < -minSwipeDistance) {
      closeCart();
    }
  };

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Prevenir scroll en body cuando el drawer está abierto
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen]);

  return (
    <div
      className={`fixed inset-0 z-101 overflow-hidden transition-all duration-300 ${
        isCartOpen
          ? "pointer-events-auto visible"
          : "pointer-events-none invisible"
      }`}
    >
      {/* Backdrop oscuro con fade transition */}
      <div
        aria-hidden="true"
        onClick={closeCart}
        className={`fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isCartOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10 pointer-events-none">
        <div
          ref={drawerRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEndEvent}
          className={`w-full max-w-xs bg-white shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out pointer-events-auto ${
            isCartOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 bg-neutral-50/70">
            <div className="flex items-center gap-2">
              <div>
                <h2 className="text-base font-bold text-neutral-900 leading-tight">
                  Tu Carrito
                </h2>
                <p className="text-xs text-neutral-500">
                  {totalItems === 0
                    ? "Vacío"
                    : `${totalItems} ${
                        totalItems === 1 ? "producto" : "productos"
                      } (${resumenCantidad || "0 kg"})`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-neutral-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                >
                  Vaciar
                </button>
              )}
              <button
                type="button"
                onClick={refetchCarrito}
                disabled={isSyncing}
                aria-label="Actualizar carrito"
                title="Actualizar carrito"
                className="rounded-lg p-1.5 text-neutral-400 hover:text-main-blue hover:bg-main-blue/8 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw
                  className={`size-4 ${isSyncing ? "animate-spin" : ""}`}
                />
              </button>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Cerrar carrito"
                className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Alertas de sincronización */}
          {isSyncing && (
            <div className="flex items-center gap-2 px-5 py-2 bg-main-blue/5 border-b border-main-blue/10">
              <svg
                className="animate-spin size-3.5 text-main-blue"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              <p className="text-[11px] text-main-blue font-medium">
                Actualizando tu carrito…
              </p>
            </div>
          )}

          <CartAlerts
            alerts={cartAlerts}
            onDismiss={dismissAlert}
            onClearAll={clearAlerts}
          />

          {/* Lista de Items (Scrollable) */}
          <div className="flex-1 overflow-y-auto px-5 py-4 divide-y divide-neutral-100">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="size-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
                  <ShoppingBag className="size-8 stroke-1" />
                </div>
                <h3 className="text-base font-semibold text-neutral-800 mb-1">
                  Tu carrito está vacío
                </h3>
                <p className="text-sm text-neutral-500 max-w-xs mb-6">
                  Descubrí nuestros mejores cortes de carne vacuna, cerdo, pollo
                  y embutidos.
                </p>
                <button
                  type="button"
                  onClick={closeCart}
                  className="px-5 py-2.5 rounded-lg bg-main-blue text-white font-medium text-sm hover:bg-main-blue/90 shadow-sm transition-all"
                >
                  Explorar catálogo
                </button>
              </div>
            ) : (
              cartItems.map((item) => {
                const itemCalc = calculateItemPrice(item);
                const qty = Number(item.cantidad_kg) || 1;
                const unidad = item.unidad_medida || "kg";
                const categoriaSlug = (item.categoria || "productos")
                  .toLowerCase()
                  .trim()
                  .replace(/\s+/g, "-");
                const especieSlug = (item.especie || "general")
                  .toLowerCase()
                  .trim()
                  .replace(/\s+/g, "-");
                const productSlug = item.slug || item.id;

                // Sugerencia de siguiente tramo de promo si existe
                const nextPromo = Array.isArray(item.promos)
                  ? item.promos.find(
                      (p) => p.activa !== false && Number(p.cantidad_kg) > qty,
                    )
                  : null;

                return (
                  <div key={item.id} className="py-4 flex gap-3.5 group">
                    {/* Imagen del corte */}
                    <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100 border border-neutral-200">
                      <img
                        src={item.imagen_url || DUMMY_IMAGE}
                        alt={item.nombre_producto}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>

                    {/* Info y Controles */}
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <Link
                            to={`/${categoriaSlug}/${especieSlug}/${productSlug}`}
                            onClick={closeCart}
                            className="text-sm font-bold text-neutral-900 hover:text-main-blue transition-colors line-clamp-1"
                          >
                            {item.nombre_producto}
                          </Link>
                          <p className="text-xs text-neutral-500 capitalize">
                            {item.especie} • {formatPrecio(item.precio)} /
                            {unidad}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          aria-label="Eliminar producto"
                          className="text-neutral-400 hover:text-red-500 p-1 rounded transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      {/* Promoción aplicada badge */}
                      {itemCalc.hasPromo && (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit my-1 border border-emerald-200/60">
                          <CheckCircle2 className="size-3" />
                          <span>
                            Promo aplicada (Ahorrás{" "}
                            {formatPrecio(itemCalc.ahorro)})
                          </span>
                        </div>
                      )}

                      {/* Sugerencia de próxima promo */}
                      {nextPromo && !itemCalc.hasPromo && (
                        <div className="flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-fit my-1 border border-blue-100">
                          <Tag className="size-3" />
                          <span>
                            Llevá {Number(nextPromo.cantidad_kg)} {unidad} a{" "}
                            {formatPrecio(Number(nextPromo.precio_promocional))}
                          </span>
                        </div>
                      )}

                      {/* Selector de cantidad y precio */}
                      <div className="flex items-center justify-between mt-2 pt-1">
                        <div className="flex items-center border border-neutral-300 rounded-lg bg-neutral-50 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => decrementQuantity(item.id)}
                            className="size-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors"
                            aria-label="Disminuir cantidad"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-12 text-center text-xs font-semibold text-neutral-900 select-none">
                            {formatCantidad(qty, unidad)}
                          </span>
                          <button
                            type="button"
                            onClick={() => incrementQuantity(item.id)}
                            className="size-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>

                        {/* Precios */}
                        <div className="text-right">
                          {itemCalc.hasPromo && (
                            <span className="text-xs text-neutral-400 line-through block">
                              {formatPrecio(itemCalc.regularTotal)}
                            </span>
                          )}
                          <span className="text-sm font-bold text-neutral-900">
                            {formatPrecio(itemCalc.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer con Resumen y Checkout */}
          {cartItems.length > 0 && (
            <div className="border-t border-neutral-200 bg-neutral-50/90 p-5 flex flex-col gap-3">
              {/* Puntos acumulados */}
              {totalPuntos > 0 && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-amber-600" />
                    <span>Con esta compra sumás:</span>
                  </div>
                  <span className="text-amber-800 font-bold">
                    +{totalPuntos} pts
                  </span>
                </div>
              )}

              {/* Desglose de importes */}
              <div className="space-y-1 text-sm text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrecio(subtotal)}</span>
                </div>

                {totalAhorro > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Ahorro por promociones</span>
                    <span>-{formatPrecio(totalAhorro)}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                  <span>Total</span>
                  <span className="text-lg text-main-blue">
                    {formatPrecio(totalEstimado)}
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    closeCart();
                    navigate("/checkout");
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-main-blue hover:bg-main-blue/95 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Iniciar compra</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={closeCart}
                  className="w-full py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors text-center"
                >
                  Seguir comprando
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
