// frontend-admin/src/components/ProductCardAdmin.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Star, Tag } from "lucide-react";
import { API_URL } from "../config/api";

const DUMMY_IMAGE =
  "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=800";

// No encontré un formatPrecio ya armado en frontend-admin/src/utils/formatters.js
// (solo lo vi en el proyecto de ecommerce). Si ya existe uno acá, avisame y
// reemplazo esto por el import en vez de duplicar la lógica.
const formatPrecio = (value) =>
  Number(value ?? 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

const ProductCardAdmin = ({ product, onEstadoActualizado }) => {
  const [isToggling, setIsToggling] = useState(false);

  const price = Number(product.precio ?? 0);
  const previousPriceRaw = Number(product.precio_anterior ?? 0);

  // Misma regla de "oferta" que usamos en el ecommerce: fuente de verdad única.
  const hasDiscount = previousPriceRaw > 0 && previousPriceRaw > price;
  const discountPercent = hasDiscount
    ? Math.round(100 - (price / previousPriceRaw) * 100)
    : 0;

  const earnsPoints =
    Boolean(product.gana_puntos) && Number(product.puntos) > 0;
  const isActivo = Boolean(product.activo);

  // catalogo.controller.js ya devuelve solo las promos activas, ordenadas
  // por cantidad_kg ascendente.
  const promos = Array.isArray(product.promos) ? product.promos : [];
  const tienePromo = promos.length > 0;

  // Usa el endpoint liviano que armamos en catalogo.controller.js — no hace
  // falta reenviar el producto entero solo para prender/apagar "activo".
  const handleToggleActivo = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isToggling) return;

    setIsToggling(true);
    try {
      const res = await fetch(`${API_URL}/catalogo/${product.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !isActivo }),
      });

      if (!res.ok) throw new Error("No se pudo actualizar el estado");

      const updated = await res.json();
      onEstadoActualizado?.(updated);
    } catch (error) {
      console.error("Error al cambiar el estado del producto:", error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Link
      to={`/catalogo/editar/${product.slug}`}
      className={`group flex flex-col h-fit overflow-hidden rounded-md border border-gray-200 bg-white transition-all hover:border-main-blue/50 ${
        isActivo ? "" : "opacity-60"
      }`}
    >
      <div className="relative w-full aspect-square shrink-0 overflow-hidden bg-gray-100">
        <img
          src={product.imagen_url || DUMMY_IMAGE}
          alt={product.nombre_producto}
          className="h-full w-full object-cover object-center"
        />

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <span className="w-fit rounded bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
              {discountPercent}% OFF
            </span>
          )}
          {product.destacar && (
            <span className="flex w-fit items-center gap-1 rounded bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-white">
              <Star className="size-3 fill-white" />
              Destacado
            </span>
          )}
          {/* Badge extra solo para el admin: le permite detectar de un
              vistazo qué productos tienen promos por cantidad cargadas,
              sin tener que entrar a cada uno. El ecommerce no necesita esto
              porque ahí la promo ya se ve directo en el precio. */}
          {tienePromo && (
            <span className="flex w-fit items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
              <Tag className="size-3" />
              Promo
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleToggleActivo}
          disabled={isToggling}
          title={isActivo ? "Desactivar producto" : "Activar producto"}
          className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors ${
            isActivo
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          } ${isToggling ? "cursor-wait opacity-60" : "cursor-pointer"}`}
        >
          {isActivo ? "Activo" : "Inactivo"}
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
        <h2 className="text-sm font-semibold text-gray-900 line-clamp-1">
          {product.nombre_producto}
        </h2>

        <p className="text-xs text-gray-500 capitalize">
          {product.especie} / {product.categoria}
        </p>

        {/* Mismo criterio que en el ProductCard del ecommerce: la promo por
            cantidad es un concepto distinto a la oferta (precio_anterior),
            con su propio color, y pueden convivir. */}
        {tienePromo && (
          <div className="mt-1 flex flex-col">
            {promos.map((promo) => (
              <p key={promo.id} className="text-sm font-bold text-emerald-700">
                {Number(promo.cantidad_kg)}
                {product.unidad_medida} x{" "}
                {formatPrecio(Number(promo.precio_promocional))}
              </p>
            ))}
          </div>
        )}

        <div className="mt-1 flex items-baseline gap-2">
          <p
            className={
              tienePromo
                ? "text-xs text-gray-500"
                : "text-base font-bold text-gray-900"
            }
          >
            {formatPrecio(price)}{" "}
            <span className="text-xs font-normal text-gray-500">
              /{product.unidad_medida}
            </span>
          </p>

          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrecio(previousPriceRaw)}
            </span>
          )}
        </div>

        {earnsPoints && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
            <Sparkles className="size-3 text-amber-600" />
            {product.puntos} puntos
          </span>
        )}
      </div>
    </Link>
  );
};

export default ProductCardAdmin;
