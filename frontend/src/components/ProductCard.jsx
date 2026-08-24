import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Sparkles } from "lucide-react";
import { formatPrecio, formatCantidad } from "../utils/formatters";

const DUMMY_IMAGE =
  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800";

const ProductCard = ({ product }) => {
  const name =
    product.nombre_producto || product.nombre || product.name || "Producto";

  const categoriaSlug = (product.categoria || "productos")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

  const especieSlug = (product.especie || "general")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

  const productSlug = product.slug || product.id;
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

  // Calcular stock mínimo admitiendo propiedad o array de paquetes
  const minPaquetePeso =
    Array.isArray(product.paquetes) && product.paquetes.length > 0
      ? Math.min(...product.paquetes.map((p) => Number(p.peso)))
      : null;
  const stockFrom = product.min_peso ?? product.stockFrom ?? minPaquetePeso;

  // --- NORMALIZACIÓN ROBUSTA DE PUNTOS ---
  const rawGanaPuntos =
    product.gana_puntos ??
    product.ganaPuntos ??
    product.inventario?.gana_puntos ??
    product.inventario?.ganaPuntos;

  const rawPuntos =
    product.puntos ??
    product.points ??
    product.puntos_ganados ??
    product.inventario?.puntos ??
    0;

  const points = Number(rawPuntos) || 0;

  // Se considera desactivado solo si viene explícitamente false, "false", 0 o "0"
  const isExplicitlyDisabled =
    rawGanaPuntos === false ||
    rawGanaPuntos === "false" ||
    rawGanaPuntos === 0 ||
    rawGanaPuntos === "0";

  const isGanaPuntosActive =
    rawGanaPuntos === true ||
    rawGanaPuntos === "true" ||
    rawGanaPuntos === 1 ||
    rawGanaPuntos === "1";

  // Muestra el badge si tiene puntos > 0 y no está explícitamente desactivado
  const earnsPoints =
    !isExplicitlyDisabled && (isGanaPuntosActive || points > 0) && points > 0;

  const [isFavorite, setIsFavorite] = useState(Boolean(product.isFavorite));

  const hasDiscount = previousPrice && previousPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(100 - (price / previousPrice) * 100)
    : 0;

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite((prev) => !prev);
  };

  return (
    <div className="group relative flex flex-col">
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

        <p className="text-base font-bold text-gray-900">
          {formatPrecio(price)} /{unidadMedida}
        </p>

        {earnsPoints && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
            <Sparkles className="size-3 text-amber-600" />
            Ganá {points} puntos
          </span>
        )}

        {stockFrom && (
          <p className="text-xs text-gray-500">
            Disponible desde {formatCantidad(stockFrom, unidadMedida)}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
