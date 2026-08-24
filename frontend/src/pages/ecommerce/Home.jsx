// frontend/src/pages/ecommerce/Home.jsx
import React, { useEffect, useState } from "react";
import EnvioNavbar from "../../components/EnvioNavbar";
import SearchInput from "../../components/SearchInput";
import { categories } from "../../assets/assets.js";
import ProductCard from "../../components/ProductCard.jsx";
import { API_URL } from "../../config/api.js";

export default function Home() {
  const [data, setData] = useState({
    destacados: [],
    ofertas: [],
    todos: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await fetch(`${API_URL}/products/home?sucursal_id=1`);
        if (!res.ok) throw new Error(`Error: ${res.status}`);

        const result = await res.json();
        setData({
          destacados: result.destacados || [],
          ofertas: result.ofertas || [],
          todos: result.todos || [],
        });
      } catch (error) {
        console.error("Error al cargar la portada:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const SkeletonGrid = () => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse flex flex-col gap-3">
          <div className="bg-gray-200 aspect-square rounded-md w-full" />
          <div className="bg-gray-200 h-4 rounded w-3/4" />
          <div className="bg-gray-200 h-4 rounded w-1/2" />
        </div>
      ))}
    </div>
  );

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
          className="flex lg:hidden w-11/12 mx-auto aspect-12/4 object-cover rounded-xl shadow-sm"
        />
        <img
          src="/dummy-promo-desktop.jpg"
          alt="Promoción Abastecedora Valette"
          className="hidden lg:flex w-full h-95 object-cover object-center"
        />
      </div>

      {/* 1. SECCIÓN DE PRODUCTOS DESTACADOS */}
      {(isLoading || data.destacados.length > 0) && (
        <section className="mx-auto max-w-304 px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">
            Productos destacados
          </h2>
          {isLoading ? (
            <SkeletonGrid />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-6">
              {data.destacados.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 2. SECCIÓN DE OFERTAS */}
      {(isLoading || data.ofertas.length > 0) && (
        <section className="mx-auto max-w-304 px-4 sm:px-6 lg:px-8 py-8 bg-blue-50/40 rounded-2xl my-4">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Ofertas imperdibles
            </h2>
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase">
              Promo
            </span>
          </div>
          {isLoading ? (
            <SkeletonGrid />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-6">
              {data.ofertas.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      )}

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

      {/* 3. SECCIÓN DE TODOS LOS PRODUCTOS */}
      <section className="mx-auto max-w-304 px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">
          Todos los productos
        </h2>
        {isLoading ? (
          <SkeletonGrid />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-6">
            {data.todos.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
