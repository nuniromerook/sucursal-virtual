import React, { useState } from "react";
import { Heart, Sparkles } from "lucide-react";

const ProductCard = ({ product }) => {
  const [isFavorite, setIsFavorite] = useState(product.isFavorite || false);

  const hasDiscount =
    product.previousPrice && product.previousPrice > product.price;

  const discountPercent = hasDiscount
    ? Math.round(100 - (product.price / product.previousPrice) * 100)
    : 0;

  const handleToggleFavorite = (e) => {
    // evita navegar al producto (el <a> del nombre estira su hitbox a toda la card)
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite((prev) => !prev);
    // TODO: persistir en backend/localStorage según usuario logueado
  };

  return (
    <div className="group relative flex flex-col">
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-200">
        <img
          alt={product.imageAlt}
          src={product.imageSrc}
          className="h-full w-full object-cover object-center aspect-square transition-opacity group-hover:opacity-90"
        />

        {hasDiscount && (
          <span className="absolute top-2 left-2 rounded bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
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
          <a href={`/producto/${product.slug}`}>
            <span aria-hidden="true" className="absolute inset-0" />
            {product.name}
          </a>
        </h3>

        {hasDiscount && (
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">
              {discountPercent}% OFF
            </span>
            <span className="text-xs text-gray-400 line-through">
              ${product.previousPrice.toLocaleString("es-AR")}
            </span>
          </div>
        )}

        <p className="text-base font-bold text-gray-900">
          ${product.price.toLocaleString("es-AR")}
        </p>

        {product.earnsPoints && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-main-blue/10 px-2 py-0.5 text-[11px] font-medium text-main-blue">
            <Sparkles className="size-3" />
            Ganá {product.points} puntos
          </span>
        )}

        <p className="text-xs text-gray-500">
          Disponible desde {product.stockFrom} {product.unidad_medida}
        </p>
      </div>
    </div>
  );
};

export default ProductCard;
