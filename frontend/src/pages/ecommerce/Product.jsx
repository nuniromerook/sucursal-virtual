// frontend/src/pages/ecommerce/Product.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Info, ShoppingBag } from "lucide-react";
import { API_URL } from "../../config/api";
import { formatPrecio, formatCantidad } from "../../utils/formatters";

export default function Product() {
  // Desestructuramos los parámetros definidos en App.jsx (:categoria/:especie/:slug)
  const { categoria, especie, slug } = useParams();

  const [productData, setProductData] = useState(null);
  const [selectedPresentacion, setSelectedPresentacion] = useState(null);
  const [selectedPaquete, setSelectedPaquete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchProducto = async () => {
      setIsLoading(true);
      setError(false);
      try {
        // Consultamos la API enviando el slug del producto
        const res = await fetch(`${API_URL}/products/${slug}?sucursal_id=1`);
        if (!res.ok) throw new Error("Producto no encontrado");

        const data = await res.json();
        setProductData(data);

        if (data.presentaciones && data.presentaciones.length > 0) {
          setSelectedPresentacion(data.presentaciones[0]);
        }

        const paquetesDisponibles = data.paquetes?.filter(
          (p) => !p.reservado && p.estado !== "reservado",
        );
        if (paquetesDisponibles && paquetesDisponibles.length > 0) {
          setSelectedPaquete(paquetesDisponibles[0]);
        }
      } catch (err) {
        console.error("Error cargando detalle del producto:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) fetchProducto();
  }, [slug]);

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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-base font-semibold text-red-600">
          El producto solicitado no existe o no se encuentra disponible.
        </p>
        <Link
          to="/"
          className="text-sm font-medium text-main-blue hover:underline"
        >
          ← Volver al inicio
        </Link>
      </div>
    );
  }

  const {
    nombre_producto,
    precio_por_kg,
    precio_anterior,
    imagen_url,
    categoria_nombre,
    descripcion,
    detalles,
    presentaciones = [],
    paquetes = [],
    unidad_medida = "kg",
  } = productData;

  // Reemplaza los guiones por espacios para mostrar nombres limpios en el Breadcrumb
  const formatBreadcrumb = (str) => (str ? str.replace(/-/g, " ") : "");

  const breadcrumbs = [
    { id: 1, name: "Inicio", href: "/" },
    {
      id: 2,
      name: formatBreadcrumb(categoria) || categoria_nombre || "Categoría",
      href: `/${categoria || "general"}`,
    },
    {
      id: 3,
      name: formatBreadcrumb(especie) || "Especie",
      href: `/${categoria || "general"}/${especie || "general"}`,
    },
  ];

  const priceNum = Number(precio_por_kg || 0);
  const lastPriceNum = precio_anterior ? Number(precio_anterior) : null;

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
              <div className="flex w-full flex-col lg:flex-row gap-8">
                {/* Nombre y Precio */}
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    {nombre_producto}
                  </h1>

                  <div className="flex items-baseline gap-3 mt-2">
                    <p className="text-3xl font-bold tracking-tight text-gray-900">
                      {formatPrecio(priceNum)} /{unidad_medida}
                    </p>

                    {lastPriceNum && lastPriceNum > priceNum && (
                      <p className="text-lg text-gray-400 line-through">
                        {formatPrecio(lastPriceNum)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Presentaciones opcionales */}
                {presentaciones.length > 0 && (
                  <fieldset className="flex flex-col w-full space-y-3 mt-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      Elegir presentación
                    </h3>

                    <div className="flex w-full gap-2 flex-wrap sm:flex-nowrap">
                      {presentaciones.map((pres) => {
                        const isSelected = selectedPresentacion?.id === pres.id;
                        return (
                          <button
                            key={pres.id}
                            type="button"
                            onClick={() => setSelectedPresentacion(pres)}
                            className={`flex flex-col lg:flex-row lg:px-4 w-full items-center justify-between rounded border py-2 px-3 text-sm font-medium transition-all ${
                              isSelected
                                ? "border-main-blue ring-1 ring-main-blue bg-blue-50/50 text-main-blue"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>{pres.nombre || pres.name}</span>
                            {pres.precio > 0 && (
                              <span className="text-xs text-gray-500">
                                + ${Number(pres.precio).toLocaleString("es-AR")}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}
              </div>

              {/* Selección de paquetes en stock */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!selectedPaquete) return;
                  alert(
                    `Paquete de ${selectedPaquete.peso || selectedPaquete.value} ${unidad_medida} agregado al carrito.`,
                  );
                }}
                className="mt-6"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      Stock disponible (Seleccionar paquete)
                    </h3>
                    <div title="Cada pieza tiene un peso único por fraccionamiento">
                      <Info className="size-4 shrink-0 text-neutral-400 cursor-pointer" />
                    </div>
                  </div>

                  <fieldset aria-label="Elegir paquete" className="mt-4">
                    {paquetes.length === 0 ? (
                      <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md border border-gray-200">
                        Sin paquetes en stock por el momento.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                        {paquetes.map((paquete) => {
                          const pesoVal = paquete.peso || paquete.value;
                          const isReservado =
                            paquete.reservado || paquete.estado === "reservado";
                          const isSelected = selectedPaquete?.id === paquete.id;

                          return (
                            <button
                              key={paquete.id}
                              type="button"
                              disabled={isReservado}
                              onClick={() => setSelectedPaquete(paquete)}
                              className={`relative flex items-center justify-center rounded-md border p-3 text-sm font-medium transition-all ${
                                isReservado
                                  ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                                  : isSelected
                                    ? "border-main-blue bg-main-blue text-white shadow-xs"
                                    : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                              }`}
                            >
                              <span>
                                {formatCantidad(pesoVal, unidad_medida)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </fieldset>
                </div>

                <button
                  type="submit"
                  disabled={!selectedPaquete || paquetes.length === 0}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-md bg-main-blue px-8 py-3 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ShoppingBag className="size-5" />
                  Agregar al carrito
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Descripción y Detalles */}
        <div className="py-10 border-t border-gray-100 mt-6">
          {descripcion && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                Descripción
              </h3>
              <p className="text-base text-gray-700 leading-relaxed">
                {descripcion}
              </p>
            </div>
          )}

          {detalles && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                Detalles del corte
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {detalles}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
