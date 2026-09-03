// frontend-client/src/pages/ecommerce/Home.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EnvioNavbar from "../../components/EnvioNavbar";
import SearchInput from "../../components/SearchInput";
import { categories } from "../../assets/assets.js";
import ProductCard from "../../components/ProductCard.jsx";
import BannerCarousel from "../../components/BannerCarousel.jsx";
import { VITE_API_URL } from "../../config/api.js";
import { useSocket } from "../../context/SocketContext";
import { Sparkles, Flame, Tag, ArrowRight, Layers, ChevronDown } from "lucide-react";

export default function Home() {
  const { catalogoVersion } = useSocket();
  const [data, setData] = useState({
    destacados: [],
    ofertas: [],
    todos: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCountTodos, setVisibleCountTodos] = useState(10);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await fetch(`${VITE_API_URL}/catalogo?activo=true`);
        if (!res.ok) throw new Error(`Error: ${res.status}`);

        const productos = await res.json();

        const destacados = productos.filter((p) => p.destacar);

        const ofertas = productos.filter((p) => {
          const anterior = Number(p.precio_anterior);
          const actual = Number(p.precio);
          const hasPromos = Array.isArray(p.promos) && p.promos.length > 0;
          return (anterior > 0 && anterior > actual) || hasPromos;
        });

        setData({
          destacados,
          ofertas,
          todos: productos,
        });
      } catch (error) {
        console.error("Error al cargar la portada:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, [catalogoVersion]);

  const SkeletonGrid = () => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-white border border-neutral-200/80 p-3 rounded-lg h-64"
        />
      ))}
    </div>
  );

  return (
    <div className="w-full min-h-screen pb-12">
      {/* Header Mobile */}
      <div className="flex flex-col lg:hidden pt-4 px-4">
        <div className="flex justify-center sm:justify-start pb-2">
          <EnvioNavbar />
        </div>
        <div className="py-2 w-full">
          <SearchInput />
        </div>
      </div>

      {/* Carrusel Publicitario Responsivo */}
      <div className="w-full max-w-7xl mx-auto px-4 pt-3 sm:pt-5">
        <BannerCarousel />
      </div>

      {/* 1. SECCIÓN DE PRODUCTOS DESTACADOS */}
      {(isLoading || data.destacados.length > 0) && (
        <section className="mx-auto max-w-6xl px-4 pt-8 sm:pt-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-amber-500 fill-amber-400" />
              <h2 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                Cortes Destacados
              </h2>
            </div>
            <Link
              to="/productos"
              className="text-xs font-bold text-main-blue hover:underline flex items-center gap-1"
            >
              <span>Ver catálogo</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <SkeletonGrid />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {data.destacados.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 2. SECCIÓN DE OFERTAS & PROMOS */}
      {(isLoading || data.ofertas.length > 0) && (
        <section className="mx-auto max-w-6xl px-4 pt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="size-5 text-main-red" />
              <h2 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                Ofertas & Promos
              </h2>
              <span className="hidden lg:block bg-main-red text-white text-[11px] font-black px-2 py-0.5 rounded uppercase shadow-2xs">
                Promo
              </span>
            </div>
            <Link
              to="/ofertas"
              className="text-xs font-bold text-main-blue hover:underline flex items-center gap-1"
            >
              <span>Ver todas las ofertas</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="rounded-lg border border-main-blue/20 bg-blue-50/40 p-1.5 sm:p-6 shadow-2xs">
            {isLoading ? (
              <SkeletonGrid />
            ) : (
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-5">
                {data.ofertas.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. SECCIÓN DE CATEGORÍAS */}
      <section className="mx-auto max-w-6xl px-4 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-main-blue" />
            <h2 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
              Especies & Categorías
            </h2>
          </div>
          <Link
            to="/productos"
            className="text-xs font-bold text-main-blue hover:underline flex items-center gap-1"
          >
            <span>Ver todas</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category, index) => (
            <Link
              key={index}
              to={`/${category.nameId?.toLowerCase() || ""}`}
              className="group relative flex aspect-4/3 sm:aspect-video w-full overflow-hidden rounded-lg border border-neutral-200/80 bg-neutral-100 shadow-2xs transition-all hover:shadow-xs hover:border-main-blue/50"
            >
              <img
                src={category.image}
                alt={category.name || category.nameId}
                className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 flex flex-col justify-end">
                <span className="text-sm sm:text-base font-black text-white uppercase tracking-wide group-hover:text-blue-200 transition-colors">
                  {category.nameId || category.name}
                </span>
                <span className="text-[11px] text-neutral-300 font-bold mt-0.5">
                  Ver cortes →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. SECCIÓN DE TODOS LOS PRODUCTOS */}
      <section className="mx-auto max-w-6xl px-4 pt-8 sm:pt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
            Todos los Cortes & Elaborados
          </h2>
          <span className="text-xs font-bold text-neutral-500">
            {data.todos.length} disponibles
          </span>
        </div>

        {isLoading ? (
          <SkeletonGrid />
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {data.todos.slice(0, visibleCountTodos).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {visibleCountTodos < data.todos.length && (
              <div className="mt-8 flex flex-col items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibleCountTodos((prev) => prev + 10)}
                  className="px-6 py-3 bg-white hover:bg-neutral-50 text-neutral-900 font-extrabold text-xs sm:text-sm rounded-xl border border-neutral-300 shadow-2xs hover:border-main-blue hover:text-main-blue transition-all cursor-pointer flex items-center gap-2 group active:scale-98"
                >
                  <span>Cargar más cortes</span>
                  <ChevronDown className="size-4 text-neutral-400 group-hover:text-main-blue group-hover:translate-y-0.5 transition-all" />
                </button>
                <p className="text-xs text-neutral-400 font-medium">
                  Mostrando {Math.min(visibleCountTodos, data.todos.length)} de {data.todos.length} cortes
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
