// frontend/src/pages/ecommerce/Home.jsx
import React, { useEffect, useState } from "react";
import EnvioNavbar from "../../components/EnvioNavbar";
import SearchInput from "../../components/SearchInput";
import { categories } from "../../assets/assets.js";
import ProductCard from "../../components/ProductCard.jsx";
import { API_URL } from "../../config/api.js";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        // 1. Verificá si la URL requiere /api/productos o /productos según tu backend
        const res = await fetch(`${API_URL}/products`);

        if (!res.ok) {
          throw new Error(
            `Error en la petición: ${res.status} ${res.statusText}`,
          );
        }

        const data = await res.json();

        // 2. Extrae el array ya sea que venga directo o envuelto en una propiedad
        const rawList = Array.isArray(data)
          ? data
          : data.productos || data.products || data.data || [];

        const mappedProducts = rawList.map((item) => ({
          id: item.id,
          name: item.nombre_producto || item.nombre,
          slug: item.slug,
          imageSrc:
            item.imagen_url ||
            "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800",
          imageAlt: item.nombre_producto || item.nombre,
          price: Number(item.precio_por_kg || item.precio || 0),
          previousPrice: item.precio_anterior
            ? Number(item.precio_anterior)
            : null,
          earnsPoints: Boolean(item.puntos),
          points: item.puntos || 10,
          isFavorite: Boolean(item.isFavorite),
          unidad_medida: item.unidad_medida || "Kg",
          stockFrom: item.min_peso ? Number(item.min_peso) : 0.5,
        }));

        setProducts(mappedProducts);
      } catch (error) {
        console.error("Error al obtener los productos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductos();
  }, []);

  return (
    <div className="w-full bg-gray-50/50 min-h-screen">
      {/* Header Mobile */}
      <div className="flex flex-col lg:hidden">
        <div className="bg-main-blue pt-4 pb-2 px-4">
          <EnvioNavbar />
        </div>
        <div className="py-4 w-11/12 mx-auto">
          <SearchInput />
        </div>
      </div>

      {/* Banners Promocionales */}
      <div className="w-full">
        <img
          src="/dummy-promo-mobile.jpg"
          alt="Promoción Abastecedora Valette"
          className="flex lg:hidden w-11/12 mx-auto aspect-[12/4] object-cover rounded-xl shadow-sm"
        />
        <img
          src="/dummy-promo-desktop.jpg"
          alt="Promoción Abastecedora Valette"
          className="hidden lg:flex w-full h-[380px] object-cover object-center"
        />
      </div>

      {/* SECCIÓN DE PRODUCTOS DESTACADOS */}
      <section className="mx-auto max-w-304 px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">
          Productos destacados
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col gap-3">
                <div className="bg-gray-200 aspect-square rounded-md w-full" />
                <div className="bg-gray-200 h-4 rounded w-3/4" />
                <div className="bg-gray-200 h-4 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-6">
            {products.map((product) => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECCIÓN DE CATEGORÍAS */}
      <section className="mx-auto max-w-304 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Categorías
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {categories.map((category, index) => (
            <a
              key={index}
              href={`/categoria/${category.nameId?.toLowerCase() || ""}`}
              className="group relative flex aspect-4/3 sm:aspect-video w-full overflow-hidden rounded-md bg-gray-100 shadow-sm transition-all hover:shadow-md"
            >
              <img
                src={category.image}
                alt={category.name || category.nameId}
                className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end">
                <span className="text-base sm:text-lg font-bold text-white uppercase tracking-wide group-hover:text-blue-200 transition-colors">
                  {category.nameId || category.name}
                </span>
                <span className="text-xs text-gray-300 font-medium">
                  Ver productos →
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
