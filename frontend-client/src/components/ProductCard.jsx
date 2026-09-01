// frontend-client/src/components/ProductCard.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Star,
  ShoppingBag,
  Tag,
  ShoppingCart,
  Flame,
} from "lucide-react";
import { formatPrecio } from "../utils/formatters";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { VITE_API_URL } from "../config/api";

const DUMMY_IMAGE =
  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800";

const ProductCard = ({ product }) => {
  const { addToCart, openCart } = useCart();
  const { isFavorite: checkIsFavorite, toggleFavorite } = useFavorites();

  const name = product.nombre_producto;
  const price = Number(product.precio);
  const previousPrice = Number(product.precio_anterior);
  const productSlug = product.slug;
  const categoriaSlug = (product.categoria || product.especie || "productos")
    .toLowerCase()
    .trim();
  const imageSrc = product.imagen_url || DUMMY_IMAGE;
  const imageAlt = product.descripcion || name;
  const earnsPoints =
    Boolean(product.gana_puntos) && Number(product.puntos) > 0;
  const points = product.puntos || 0;
  const unidadMedida = product.unidad_medida || "kg";

  const promos = Array.isArray(product.promos) ? product.promos : [];

  const hasDiscount = previousPrice > 0 && previousPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(100 - (price / previousPrice) * 100)
    : 0;

  const isFavorite = checkIsFavorite(product.id);

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    openCart();
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-lg border border-neutral-200/80 bg-white p-2.5 shadow-2xs hover:border-main-blue/50 hover:shadow-xs transition-all duration-200">
      <div className="flex flex-col h-full">
        {/* Imagen del corte */}
        <Link
          to={`/${categoriaSlug}/${productSlug}`}
          className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-100"
        >
          <img
            alt={imageAlt}
            src={imageSrc}
            className={`h-full w-full object-cover object-center aspect-square transition-transform duration-300 group-hover:scale-105 ${!product.en_stock ? "opacity-50 grayscale" : ""}`}
            loading="lazy"
          />

          {!product.en_stock && (
            <div className="absolute inset-0 bg-neutral-900/10 flex items-center justify-center z-10">
              <span className="bg-neutral-900/80 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm shadow-md">
                Sin Stock
              </span>
            </div>
          )}

          {/* Badges superiores */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {hasDiscount && (
              <span className="w-fit rounded px-2 py-0.5 text-[11px] font-bold text-white bg-main-red shadow-2xs">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Botón Favorito */}
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-label={
              isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
            }
            aria-pressed={isFavorite}
            className="absolute top-2 right-2 z-10 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-2xs backdrop-blur-xs transition-colors hover:bg-white cursor-pointer"
          >
            <Star
              className={`size-4 ${
                isFavorite
                  ? "fill-amber-400 text-amber-400"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            />
          </button>
        </Link>

        {/* Info del Producto */}
        <div className="mt-2.5 flex flex-col gap-1">
          <h3
            className={`flex text-sm ${
              product.destacar ? "text-amber-600" : "text-neutral-900"
            }`}
          >
            <Link
              to={`/${categoriaSlug}/${productSlug}`}
              className="flex items-center gap-0.5"
              title="Producto destacado"
            >
              {name}
            </Link>
          </h3>

          {/* Categoría / Especie */}
          <p className="text-[11px] text-neutral-500 capitalize">
            {product.categoria === "preparados" && product.especie
              ? `Preparados · ${product.especie}`
              : product.categoria || product.especie}
          </p>

          {/* Promos por cantidad */}
          {promos.length > 0 && (
            <div className="mt-1 flex flex-col bg-emerald-50/70 border border-emerald-100 rounded px-2 py-1">
              {promos.map((promo) => (
                <p
                  key={promo.id}
                  className="text-xs font-black text-emerald-800"
                >
                  {Number(promo.cantidad_kg)} {unidadMedida} x{" "}
                  {formatPrecio(Number(promo.precio_promocional))}
                </p>
              ))}
            </div>
          )}

          {/* Precio y Oferta */}
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-black text-neutral-900">
              {formatPrecio(price)}
            </span>
            <span className="text-[11px] font-medium text-neutral-400">
              /{unidadMedida}
            </span>
            {hasDiscount && (
              <span className="text-[11px] text-neutral-400 line-through">
                {formatPrecio(previousPrice)}
              </span>
            )}
          </div>

          {earnsPoints && (
            <span className="inline-flex w-fit items-center gap-1 rounded bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[11px] font-bold text-amber-800 mt-0.5">
              <Sparkles className="size-3 text-amber-600" />
              Ganá {points} puntos
            </span>
          )}
        </div>

        {/* Botón de Agregar Rápido */}
        <div className="mt-auto pt-2 border-t border-neutral-100 z-10 relative">
          {!product.en_stock ? (
            <div className="w-full py-2 px-3 bg-neutral-100 text-neutral-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed">
              <span>Sin Stock</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleQuickAdd}
              aria-label={`Agregar 1 ${unidadMedida} de ${name} al carrito`}
              className="w-full py-2 px-3 bg-main-blue/10 hover:bg-main-blue text-main-blue hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <ShoppingCart className="size-3.5" />
              <span>Agregar 1{unidadMedida}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
