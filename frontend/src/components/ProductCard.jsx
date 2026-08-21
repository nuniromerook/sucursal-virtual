import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Sparkles } from "lucide-react";

const DUMMY_IMAGE =
  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800";

const ProductCard = ({ product }) => {
  // Normalización de datos para soportar tanto la API directa como las props mapeadas
  const name =
    product.nombre_producto || product.nombre || product.name || "Producto";
  const slug = product.slug || "";
  const imageSrc = product.imagen_url || product.imageSrc || DUMMY_IMAGE;
  const imageAlt = product.imageAlt || name;

  const price = Number(
    product.precio_por_kg ?? product.precio ?? product.price ?? 0,
  );
  const previousPrice =
    product.precio_anterior || product.previousPrice
      ? Number(product.precio_anterior || product.previousPrice)
      : null;

  const unidadMedida = product.unidad_medida || "kg";
  const stockFrom = product.min_peso ?? product.stockFrom ?? null;
  const points = product.puntos ?? product.points ?? 10;
  const earnsPoints =
    product.earnsPoints !== undefined ? product.earnsPoints : Boolean(points);

  const [isFavorite, setIsFavorite] = useState(Boolean(product.isFavorite));

  const hasDiscount = previousPrice && previousPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(100 - (price / previousPrice) * 100)
    : 0;

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite((prev) => !prev);
    // TODO: Persistir favorito en backend/localStorage
  };

  return (
    <div className="group relative flex flex-col">
      {/* Contenedor de Imagen */}
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

      {/* Información del Producto */}
      <div className="mt-3 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-gray-800">
          <Link to={`/producto/${slug}`}>
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
              ${previousPrice.toLocaleString("es-AR")}
            </span>
          </div>
        )}

        <p className="text-base font-bold text-gray-900">
          ${price.toLocaleString("es-AR")}
        </p>

        {earnsPoints && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-main-blue/10 px-2 py-0.5 text-[11px] font-medium text-main-blue">
            <Sparkles className="size-3" />
            Ganá {points} puntos
          </span>
        )}

        {stockFrom && (
          <p className="text-xs text-gray-500">
            Disponible desde {stockFrom} {unidadMedida}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
