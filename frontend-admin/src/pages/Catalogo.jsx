// frontend-admin/src/pages/Catalogo.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Layers, RefreshCw, Filter } from "lucide-react";

import { VITE_API_URL } from "../config/api";
import { useAppContext } from "../context/AppContext";
import BasicDropdown from "../components/ui/BasicDropdown";
import ProductCardAdmin from "../components/ProductCardAdmin";

const QUICK_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "inactivos", label: "Inactivos" },
  { value: "destacados", label: "Destacados" },
  { value: "favoritos", label: "⭐ Con favoritos" },
  { value: "ofertas", label: "En oferta" },
  { value: "puntos", label: "Ganan puntos" },
];

const CATEGORY_FILTERS = [
  { value: "todas", label: "Todas las categorías" },
  { value: "vacuno", label: "🥩 Vacuno" },
  { value: "cerdo", label: "🐷 Cerdo" },
  { value: "pollo", label: "🍗 Pollo" },
  { value: "preparados", label: "🍲 Preparados" },
  { value: "almacen", label: "🧂 Almacén" },
];

const SORT_OPTIONS = [
  { value: "recientes", label: "Más recientes" },
  { value: "favoritos_desc", label: "⭐ Más favoritos de clientes" },
  { value: "nombre_asc", label: "Nombre (A-Z)" },
  { value: "precio_asc", label: "Precio: menor a mayor" },
  { value: "precio_desc", label: "Precio: mayor a menor" },
];

const matchesQuickFilter = (product, quickFilter) => {
  switch (quickFilter) {
    case "activos":
      return Boolean(product.activo);
    case "inactivos":
      return !product.activo;
    case "destacados":
      return Boolean(product.destacar);
    case "favoritos":
      return Number(product.total_favoritos || 0) > 0;
    case "ofertas": {
      const anterior = Number(product.precio_anterior);
      const actual = Number(product.precio);
      return anterior > 0 && anterior > actual;
    }
    case "puntos":
      return Boolean(product.gana_puntos) && Number(product.puntos) > 0;
    default:
      return true;
  }
};

const sortProducts = (list, sortBy) => {
  const sorted = [...list];

  switch (sortBy) {
    case "favoritos_desc":
      sorted.sort(
        (a, b) =>
          Number(b.total_favoritos || 0) - Number(a.total_favoritos || 0),
      );
      break;
    case "nombre_asc":
      sorted.sort((a, b) =>
        (a.nombre_producto || "").localeCompare(b.nombre_producto || ""),
      );
      break;
    case "precio_asc":
      sorted.sort((a, b) => Number(a.precio) - Number(b.precio));
      break;
    case "precio_desc":
      sorted.sort((a, b) => Number(b.precio) - Number(a.precio));
      break;
    case "recientes":
    default:
      sorted.sort(
        (a, b) => new Date(b.creado_en ?? 0) - new Date(a.creado_en ?? 0),
      );
      break;
  }

  return sorted;
};

const Catalogo = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState("todos");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [sortBy, setSortBy] = useState("recientes");
  const { setNavbarTitle } = useAppContext();

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const [catRes, favRankingRes] = await Promise.all([
        fetch(`${VITE_API_URL}/catalogo`),
        fetch(`${VITE_API_URL}/catalogo/favoritos/ranking`).catch(() => null),
      ]);

      const data = await catRes.json();
      const favMap = {};
      if (favRankingRes && favRankingRes.ok) {
        const favList = await favRankingRes.json();
        if (Array.isArray(favList)) {
          favList.forEach((f) => {
            favMap[f.id] = Number(f.total_favoritos) || 0;
          });
        }
      }

      const items = (Array.isArray(data) ? data : []).map((p) => ({
        ...p,
        total_favoritos:
          p.total_favoritos !== undefined && p.total_favoritos !== null
            ? Number(p.total_favoritos)
            : favMap[p.id] || 0,
      }));

      setProducts(items);
    } catch (error) {
      console.error("Error al cargar el catálogo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    setNavbarTitle("Catálogo de productos");
  }, []);

  const handleEstadoActualizado = (updated) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesSearch =
        term === "" ||
        product.nombre_producto?.toLowerCase().includes(term) ||
        product.descripcion?.toLowerCase().includes(term) ||
        product.id?.toString().includes(term);

      const matchesCat =
        categoryFilter === "todas" ||
        (product.categoria || "").toLowerCase() === categoryFilter ||
        (product.especie || "").toLowerCase() === categoryFilter;

      return (
        matchesSearch && matchesCat && matchesQuickFilter(product, quickFilter)
      );
    });

    return sortProducts(filtered, sortBy);
  }, [products, search, categoryFilter, quickFilter, sortBy]);

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* ─── Encabezado en formato módulo ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border bg-white border-neutral-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="size-10 aspect-square rounded-lg bg-main-blue/10 flex items-center justify-center text-main-blue font-black shrink-0">
            <Layers className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base sm:text-lg text-neutral-900 tracking-tight">
                Catálogo de Productos
              </h1>
              <span className="text-[11px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200">
                {products.length} productos
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Gestión global de cortes, precios por kilo, promociones y estados
              de la tienda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadProducts}
            disabled={isLoading}
            title="Refrescar catálogo"
            className="p-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-700"
          >
            <RefreshCw
              className={`size-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>

          <Link
            to="/catalogo/nuevo-producto"
            className="inline-flex items-center justify-center rounded-lg bg-main-blue px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-main-blue/90 gap-1.5 cursor-pointer"
          >
            <Plus className="shrink-0 size-4" />
            <span>Nuevo producto</span>
          </Link>
        </div>
      </div>

      {/* ─── Barra de Búsqueda y Ordenamiento ─── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex flex-1 sm:max-w-md items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 shadow-2xs focus-within:border-main-blue focus-within:ring-2 focus-within:ring-main-blue/20 transition-all">
          <Search className="size-4 shrink-0 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por corte, especie o código..."
            className="w-full border-none bg-transparent text-base sm:text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
            aria-label="Buscar producto en el catálogo"
          />
        </div>

        <div className="w-full sm:w-56">
          <BasicDropdown
            id="sortBy"
            items={SORT_OPTIONS}
            value={sortBy}
            onChange={(val) => setSortBy(val)}
            buttonClassName="py-2 text-xs font-bold shadow-2xs"
          />
        </div>
      </div>

      {/* ─── Categorías Oficiales ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {CATEGORY_FILTERS.map((cat) => {
          const isSelected = cat.value === categoryFilter;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategoryFilter(cat.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? "border-neutral-900 bg-neutral-900 text-white shadow-2xs"
                  : "border-neutral-200/80 bg-white text-neutral-600 hover:bg-neutral-50 shadow-2xs"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ─── Filtros Rápidos (Estado / Ofertas / Puntos) ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
        {QUICK_FILTERS.map((filter) => {
          const isSelected = filter.value === quickFilter;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setQuickFilter(filter.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? "border-main-blue bg-main-blue text-white shadow-2xs"
                  : "border-neutral-200/80 bg-white text-neutral-700 hover:bg-neutral-50 shadow-2xs"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* ─── Grilla de Productos ─── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white border border-neutral-200 p-3 rounded-lg h-64"
            />
          ))}
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="text-center py-16 rounded-lg border bg-white border-neutral-200/80 shadow-2xs">
          <Layers className="size-12 mx-auto mb-3 opacity-40 stroke-1 text-neutral-400" />
          <h3 className="font-bold text-base text-neutral-800">
            No se encontraron productos
          </h3>
          <p className="text-xs opacity-60 mt-1">
            Probá con otro término de búsqueda o cambiá el filtro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {visibleProducts.map((product) => (
            <ProductCardAdmin
              key={product.id}
              product={product}
              onEstadoActualizado={handleEstadoActualizado}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Catalogo;
