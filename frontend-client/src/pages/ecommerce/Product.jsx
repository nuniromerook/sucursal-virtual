// frontend/src/pages/ecommerce/Product.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Check,
  ChevronRight,
  Info,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import { API_URL } from "../../config/api";
import { formatPrecio } from "../../utils/formatters";
import { useCart } from "../../context/CartContext";
import { useSocket } from "../../context/SocketContext";
import { useFavorites } from "../../context/FavoritesContext";
import FormattedDescription from "../../components/FormattedDescription";
import RelatedProducts from "../../components/RelatedProducts";
import NotFound from "../NotFound";

export default function Product() {
  // Desestructuramos los parámetros definidos en App.jsx (:categoria/:especie/:slug)
  const { categoria, especie, slug } = useParams();
  const { catalogoVersion } = useSocket();
  const { addToCart, openCart } = useCart();
  const { isFavorite: checkIsFavorite, toggleFavorite } = useFavorites();

  const [productData, setProductData] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchProducto = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const res = await fetch(`${API_URL}/catalogo/${slug}`);
        if (!res.ok) throw new Error("Producto no encontrado");

        const data = await res.json();
        setProductData(data);
      } catch (err) {
        console.error("Error cargando detalle del producto:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) fetchProducto();
  }, [slug, catalogoVersion]);

  const handleDecrement = () => {
    setCantidad((prev) => Math.max(1, Number(prev) - 1));
  };

  const handleIncrement = () => {
    setCantidad((prev) => Number(prev) + 1);
  };

  // Dejamos escribir libremente (incluso vacío mientras tipea) y recién
  // forzamos un mínimo válido al perder el foco, en handleCantidadBlur.
  const handleCantidadInput = (e) => {
    const { value } = e.target;

    if (value === "") {
      setCantidad("");
      return;
    }

    // Por ahora solo enteros (1kg, 2kg, 3kg...) — cuando habiliten
    // fracciones de kg, este es el único lugar que hay que tocar.
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      setCantidad(parsed);
    }
  };

  const handleCantidadBlur = () => {
    if (cantidad === "" || Number(cantidad) < 1) {
      setCantidad(1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <p className="text-sm font-medium text-gray-500 animate-pulse">
          Cargando detalle del producto...
        </p>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <NotFound
        title="Producto no encontrado"
        message="El corte o producto que estás buscando no existe, fue dado de baja o no se encuentra disponible."
        showHomeButton={true}
        showProfileButton={false}
      />
    );
  }

  const {
    nombre_producto,
    precio,
    precio_anterior,
    imagen_url,
    categoria: categoriaProducto,
    descripcion,
    unidad_medida = "kg",
    proteinas,
    calorias,
    grasas,
    gana_puntos,
    puntos,
    promos = [],
  } = productData;

  // Reemplaza los guiones por espacios para mostrar nombres limpios en el Breadcrumb
  const formatBreadcrumb = (str) => (str ? str.replace(/-/g, " ") : "");

  const breadcrumbs = [
    { id: 1, name: "Inicio", href: "/" },
    {
      id: 2,
      name: formatBreadcrumb(categoriaProducto) || "Categoría",
      href: `/${categoriaProducto?.toLowerCase()}`,
    },
  ];

  const priceNum = Number(precio ?? 0);
  const previousPriceRaw = Number(precio_anterior ?? 0);

  // Misma regla que en Home.jsx y ProductCard.jsx: hay oferta cuando el
  // precio anterior existe y es mayor al precio actual.
  const hasDiscount = previousPriceRaw > 0 && previousPriceRaw > priceNum;

  const earnsPoints = Boolean(gana_puntos) && Number(puntos) > 0;

  const cantidadNum = Number(cantidad) || 0;

  // catalogo.controller.js ya devuelve solo las promos activas, ordenadas
  // por cantidad_kg ascendente. Si la cantidad elegida calza exacto con un
  // tramo, ese es el precio real a cobrar (no precio × cantidad).
  const promoActiva = promos.find(
    (promo) => Number(promo.cantidad_kg) === cantidadNum,
  );

  const totalEstimado = promoActiva
    ? Number(promoActiva.precio_promocional)
    : priceNum * cantidadNum;

  // Cuadros de info nutricional: solo se arma con los datos que existan.
  const nutricion = [
    proteinas != null
      ? { label: "Proteína", valor: `${Number(proteinas)}g` }
      : null,
    calorias != null
      ? { label: "Calorías", valor: `${Number(calorias)} kcal` }
      : null,
    grasas != null ? { label: "Grasas", valor: `${Number(grasas)}g` } : null,
  ].filter(Boolean);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cantidadFinal = Number(cantidad) || 1;
    addToCart(productData, cantidadFinal);
    openCart();
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="flex flex-col pt-6 lg:max-w-6xl gap-4 p-4 mx-auto">
        {/* Breadcrumb dinámico */}
        <nav aria-label="Breadcrumb">
          <ol role="list" className="flex items-center flex-wrap gap-y-1">
            {breadcrumbs.map((breadcrumb) => (
              <li key={breadcrumb.id}>
                <div className="flex items-center">
                  <Link
                    to={breadcrumb.href}
                    className="text-sm lg:text-base font-medium text-gray-900 hover:text-main-blue capitalize"
                  >
                    {breadcrumb.name}
                  </Link>
                  <ChevronRight className="size-4 shrink-0 text-gray-400 mx-1" />
                </div>
              </li>
            ))}
            <li className="text-sm lg:text-base">
              <span className="font-medium text-gray-500 capitalize">
                {nombre_producto}
              </span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Imagen principal */}
          <div className="flex lg:col-span-1">
            <img
              alt={nombre_producto}
              src={
                imagen_url ||
                "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800"
              }
              className="rounded-lg w-full object-cover aspect-square h-fit border border-gray-100"
            />
          </div>

          <div className="flex flex-col lg:col-span-2">
            <div className="flex flex-col">
              {/* Nombre, Favorito y Precio */}
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  {nombre_producto}
                </h1>
                <button
                  type="button"
                  onClick={() => toggleFavorite(productData.id)}
                  className={`p-2.5 rounded-full border transition-all cursor-pointer shadow-2xs shrink-0 ${
                    checkIsFavorite(productData.id)
                      ? "bg-amber-50 border-amber-300 text-amber-500 hover:bg-amber-100"
                      : "bg-white border-neutral-200 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50"
                  }`}
                  title={checkIsFavorite(productData.id) ? "Quitar de favoritos" : "Guardar en favoritos"}
                  aria-label="Favorito"
                >
                  <Star className={`size-5 transition-transform active:scale-125 ${checkIsFavorite(productData.id) ? "fill-amber-400 text-amber-400" : ""}`} />
                </button>
              </div>

              <div className="flex items-baseline gap-3 mt-2">
                <p className="text-3xl font-bold tracking-tight text-gray-900">
                  {formatPrecio(priceNum)} /{unidad_medida}
                </p>

                {hasDiscount && (
                  <p className="text-lg text-gray-400 line-through">
                    {formatPrecio(previousPriceRaw)}
                  </p>
                )}
              </div>

              {unidad_medida == "kg" ? (
                <p className="mt-1 text-xs text-gray-500">
                  Precio aproximado por {unidad_medida}. El peso final lo define
                  el cortador al preparar tu pedido.
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">Precio por unidad.</p>
              )}

              {earnsPoints && (
                <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                  <Sparkles className="size-3 text-amber-600" />
                  Ganá {Number(puntos)} puntos con este producto
                </span>
              )}

              {/* Selector de cantidad (stepper) */}
              <form onSubmit={handleSubmit} className="mt-6">
                {/* Chips de promo: tocar uno salta el stepper directo a esa
                    cantidad. Mismo color que usamos en las cards para no
                    confundir esto con la oferta de precio_anterior. */}
                {promos.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {promos.map((promo) => {
                      const promoCantidad = Number(promo.cantidad_kg);
                      const isSelected = promoCantidad === cantidadNum;

                      return (
                        <button
                          key={promo.id}
                          type="button"
                          onClick={() => setCantidad(promoCantidad)}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {promoCantidad}
                          {unidad_medida} x{" "}
                          {formatPrecio(Number(promo.precio_promocional))}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex w-full items-center gap-3 border border-gray-200 bg-gray-50 p-3 justify-between">
                  {/* Stepper selector de cantidad */}
                  <div className="flex flex-col w-full">
                    <h3 className="text-sm font-medium text-gray-900 text-center lg:text-start">
                      Cantidad a pedir ({unidad_medida})
                    </h3>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDecrement}
                        disabled={cantidadNum <= 1}
                        className="flex size-10 items-center justify-center rounded-md border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                        aria-label={`Restar un ${unidad_medida}`}
                      >
                        <Minus className="size-4" />
                      </button>

                      <input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={cantidad}
                        onChange={handleCantidadInput}
                        onBlur={handleCantidadBlur}
                        className={`w-16 rounded-md border py-2 text-center text-base font-semibold focus:outline-none transition-colors ${
                          promoActiva
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-gray-300 text-gray-900 focus:border-main-blue bg-white"
                        }`}
                      />

                      <button
                        type="button"
                        onClick={handleIncrement}
                        className="flex size-10 items-center justify-center rounded-md border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50 bg-white"
                        aria-label={`Sumar un ${unidad_medida}`}
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Precio final */}
                  <div className="flex flex-col w-full rounded-md border border-gray-200 bg-white p-3">
                    <p className="text-sm text-gray-600">Total estimado</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatPrecio(totalEstimado)}{" "}
                      <span className="text-sm font-normal text-gray-500">
                        aprox.
                      </span>
                    </p>
                  </div>
                </div>

                {promoActiva && (
                  <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <Check className="size-3.5" />
                    ¡Estás llevando el precio promocional!
                  </p>
                )}

                <button
                  type="submit"
                  disabled={cantidadNum < 1}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-main-blue px-8 py-3 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ShoppingBag className="size-5" />
                  Agregar al carrito
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Descripción del producto con formato enriquecido */}
        {descripcion && (
          <div className="pt-8 border-t border-neutral-100 mt-6">
            <h3 className="text-sm uppercase tracking-wider font-extrabold text-neutral-900 mb-3 flex items-center gap-2">
              Detalle y Preparación
            </h3>
            <div className="rounded-2xl bg-neutral-50/60 border border-neutral-200/70 p-4 sm:p-6 shadow-2xs">
              <FormattedDescription content={descripcion} />
            </div>
          </div>
        )}

        {/* Información nutricional */}
        {nutricion.length > 0 && (
          <div className="py-10">
            <h3 className="text-sm uppercase tracking-wider font-extrabold text-neutral-900 mb-3 flex items-center gap-2">
              Información nutricional
              <span
                className="font-normal text-gray-400"
                title="Valores aproximados cada 100g de producto"
              >
                ~
              </span>
            </h3>

            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${nutricion.length}, minmax(0, 1fr))`,
              }}
            >
              {nutricion.map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-gray-200 bg-gray-50 p-3 text-center"
                >
                  <p className="text-xs font-medium text-gray-500">
                    {item.label}
                  </p>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {item.valor}
                  </p>
                  <p className="text-[11px] text-gray-400">por 100g</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Productos Relacionados */}
        {productData && <RelatedProducts currentProduct={productData} />}
      </div>
    </div>
  );
}
