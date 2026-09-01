// frontend-admin/src/components/ProductCardAdmin.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Star, Tag, Edit2 } from "lucide-react";
import { VITE_API_URL } from "../config/api";

const DUMMY_IMAGE =
  "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=800";

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

  const hasDiscount = previousPriceRaw > 0 && previousPriceRaw > price;
  const discountPercent = hasDiscount
    ? Math.round(100 - (price / previousPriceRaw) * 100)
    : 0;

  const earnsPoints =
    Boolean(product.gana_puntos) && Number(product.puntos) > 0;
  const isActivo = Boolean(product.activo);

  const promos = Array.isArray(product.promos) ? product.promos : [];
  const tienePromo = promos.length > 0;

  const handleToggleActivo = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isToggling) return;

    setIsToggling(true);
    try {
      const res = await fetch(`${VITE_API_URL}/catalogo/${product.id}/estado`, {
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
      className={`group flex flex-col h-full rounded-lg border bg-white shadow-2xs transition-all hover:border-main-blue/60 hover:shadow-xs ${
        isActivo
          ? "border-neutral-200/80"
          : "border-neutral-200 opacity-60 bg-neutral-50/50"
      }`}
    >
      <div className="relative w-full aspect-square shrink-0 overflow-hidden bg-neutral-100 rounded-t-lg">
        <img
          src={product.imagen_url || DUMMY_IMAGE}
          alt={product.nombre_producto}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Badges superiores */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {hasDiscount && (
            <span className="w-fit rounded px-2 py-0.5 text-[11px] font-bold text-white bg-main-red shadow-2xs">
              {discountPercent}% OFF
            </span>
          )}
          {product.destacar && (
            <span className="flex w-fit items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold text-white bg-amber-500 shadow-2xs">
              <Star className="size-3 fill-white" />
              Destacado
            </span>
          )}
          {Number(product.total_favoritos) > 0 && (
            <span className="flex w-fit items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300 shadow-2xs">
              <Star className="size-3 fill-amber-500 text-amber-600" />
              {product.total_favoritos} favs
            </span>
          )}
          {tienePromo && (
            <span className="flex w-fit items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold text-white bg-emerald-600 shadow-2xs">
              <Tag className="size-3" />
              Promo
            </span>
          )}
        </div>

        {/* Botón rápido Activo / Inactivo */}
        <button
          type="button"
          onClick={handleToggleActivo}
          disabled={isToggling}
          title={isActivo ? "Desactivar producto" : "Activar producto"}
          className={`absolute top-2 right-2 rounded-md px-2.5 py-0.5 text-[11px] font-bold border transition-colors shadow-2xs ${
            isActivo
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : "bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200"
          } ${isToggling ? "cursor-wait opacity-60" : "cursor-pointer"}`}
        >
          {isActivo ? "Activo" : "Inactivo"}
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between p-3 sm:p-3.5">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 line-clamp-1 group-hover:text-main-blue transition-colors">
            {product.nombre_producto}
          </h2>

          <p className="text-[11px] text-neutral-500 capitalize mt-0.5">
            {product.especie} · {product.categoria}
          </p>

          {/* Promo por cantidad */}
          {tienePromo && (
            <div className="mt-1.5 flex flex-col bg-emerald-50/70 border border-emerald-100 rounded px-2 py-1">
              {promos.map((promo) => (
                <p
                  key={promo.id}
                  className="text-xs font-black text-emerald-800"
                >
                  {Number(promo.cantidad_kg)} {product.unidad_medida} x{" "}
                  {formatPrecio(Number(promo.precio_promocional))}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black text-neutral-900">
              {formatPrecio(price)}
            </span>
            <span className="text-[11px] font-medium text-neutral-400">
              /{product.unidad_medida}
            </span>
            {hasDiscount && (
              <span className="text-[11px] text-neutral-400 line-through">
                {formatPrecio(previousPriceRaw)}
              </span>
            )}
          </div>

          <span className="text-neutral-400 group-hover:text-main-blue transition-colors">
            <Edit2 className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCardAdmin;
