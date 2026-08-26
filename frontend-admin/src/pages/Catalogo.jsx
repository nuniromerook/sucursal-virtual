// src/pages/Catalogo.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";

import { API_URL } from "../config/api";
import { useAppContext } from "../context/AppContext";
import BasicDropdown from "../components/ui/BasicDropdown";
import ProductCardAdmin from "../components/ProductCardAdmin";

const QUICK_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "inactivos", label: "Inactivos" },
  { value: "destacados", label: "Destacados" },
  { value: "ofertas", label: "En oferta" },
  { value: "puntos", label: "Ganan puntos" },
];

const SORT_OPTIONS = [
  { value: "recientes", label: "Más recientes" },
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
  const [sortBy, setSortBy] = useState("recientes");
  const { setNavbarTitle } = useAppContext();

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      // El panel admin pide todo sin filtrar (activos e inactivos), a
      // diferencia del ecommerce que pide ?activo=true.
      const response = await fetch(`${API_URL}/catalogo`);
      const data = await response.json();

      setProducts(data);
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

  // Actualiza el producto en memoria cuando ProductCardAdmin togglea
  // "activo" — evita recargar todo el catálogo por un solo cambio.
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

      return matchesSearch && matchesQuickFilter(product, quickFilter);
    });

    return sortProducts(filtered, sortBy);
  }, [products, search, quickFilter, sortBy]);

  return (
    <div className="flex min-h-dvh flex-col gap-y-4 lg:gap-y-6 p-2 lg:p-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="hidden lg:block text-2xl font-bold text-gray-900 py-6">
          Catálogo de productos
        </h1>

        <Link
          to="/catalogo/nuevo-producto"
          className="inline-flex items-center justify-center rounded-md bg-main-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-main-blue/80 gap-2"
        >
          <Plus className="shrink-0 size-4" /> Nuevo producto
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex h-10 w-full sm:max-w-xs items-center gap-1 rounded-md border border-gray-300 bg-white px-2">
          <Search className="size-4 shrink-0 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, descripción o ID..."
            className="h-full w-full border-none bg-transparent px-1 focus:outline-none focus:ring-0"
            aria-label="Buscar producto en el catálogo"
          />
        </div>

        <div className="w-full sm:w-56">
          <BasicDropdown
            id="sortBy"
            items={SORT_OPTIONS}
            value={sortBy}
            setOnChange={(e) => setSortBy(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((filter) => {
          const isSelected = filter.value === quickFilter;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setQuickFilter(filter.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isSelected
                  ? "border-main-blue bg-main-blue text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Cargando productos...</p>
      ) : visibleProducts.length === 0 ? (
        <p className="text-sm text-gray-500">No se encontraron productos.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
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
