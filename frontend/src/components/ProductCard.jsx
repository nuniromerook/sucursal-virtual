// frontend/src/components/ProductCard.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Sparkles } from "lucide-react";
import { formatPrecio } from "../utils/formatters";

const DUMMY_IMAGE =
  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800";

const ProductCard = ({ product }) => {
  const name = product.nombre_producto || "Producto";

  const categoriaSlug = (product.categoria || "productos")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

  const especieSlug = (product.especie || "general")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

  const productSlug = product.slug || product.id;
  const imageSrc = product.imagen_url || DUMMY_IMAGE;
  const imageAlt = name;

  // Postgres devuelve las columnas "numeric" (precio, precio_anterior) como
  // string para no perder precisión, así que siempre convertimos con Number().
  const price = Number(product.precio ?? 0);
  const previousPriceRaw = Number(product.precio_anterior ?? 0);

  // "En oferta" no es una columna, es esta comparación — mismo criterio que
  // usamos en Home.jsx para separar la sección de ofertas.
  const hasDiscount = previousPriceRaw > 0 && previousPriceRaw > price;
  const previousPrice = hasDiscount ? previousPriceRaw : null;
  const discountPercent = hasDiscount
    ? Math.round(100 - (price / previousPriceRaw) * 100)
    : 0;

  const unidadMedida = product.unidad_medida || "kg";

  // gana_puntos y puntos ahora son columnas directas de "catalogo"
  // (boolean e integer respectivamente) — node-pg ya las entrega tipadas,
  // no hace falta normalizar strings ni buscar en objetos anidados.
  const earnsPoints =
    Boolean(product.gana_puntos) && Number(product.puntos) > 0;
  const points = Number(product.puntos ?? 0);

  // catalogo.controller.js ya devuelve solo las promos activas, ordenadas
  // por cantidad_kg ascendente — acá no hace falta filtrar ni ordenar.
  const promos = Array.isArray(product.promos) ? product.promos : [];

  const [isFavorite, setIsFavorite] = useState(Boolean(product.isFavorite));

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite((prev) => !prev);
  };

  return (
    <div className="group relative flex flex-col border border-neutral-200/50 p-2 bg-white hover:border-neutral-200 transition-all duration-200">
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-200">
        <img
          alt={imageAlt}
          src={imageSrc}
          className="h-full w-full object-cover object-center aspect-square transition-opacity group-hover:opacity-90"
        />

        {hasDiscount && (
          <span className="absolute top-2 left-2 rounded bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white z-10">
            SUPER PROMO
          </span>
        )}

        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-label={
            isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
          }
          aria-pressed={isFavorite}
          className="absolute top-2 right-2 z-10 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          <Heart
            className={`size-4 ${
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
            }`}
          />
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-gray-800">
          <Link to={`${categoriaSlug}/${especieSlug}/${productSlug}`}>
            <span aria-hidden="true" className="absolute inset-0" />
            {name}
          </Link>
        </h3>

        {hasDiscount && (
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">
              {discountPercent}% OFF
            </span>
            <span className="text-xs text-gray-400 line-through">
              {formatPrecio(previousPrice)}
            </span>
          </div>
        )}

        {/* Tramos de promo por cantidad (ej: "2kg x $1.234"). Es un concepto
            distinto a la oferta de arriba (esa compara precio_anterior vs
            precio; esto es un precio especial al llevar cierta cantidad),
            por eso usa su propio color y puede coexistir con la oferta. */}
        {promos.length > 0 && (
          <div className="flex flex-col">
            {promos.map((promo) => (
              <p key={promo.id} className="text-sm font-bold text-emerald-700">
                {Number(promo.cantidad_kg)}
                {unidadMedida} x{" "}
                {formatPrecio(Number(promo.precio_promocional))}
              </p>
            ))}
          </div>
        )}

        <p
          className={
            promos.length > 0
              ? "text-xs text-gray-500"
              : "text-base font-bold text-gray-900"
          }
        >
          {formatPrecio(price)} /{unidadMedida}
        </p>

        {earnsPoints && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
            <Sparkles className="size-3 text-amber-600" />
            Ganá {points} puntos
          </span>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
