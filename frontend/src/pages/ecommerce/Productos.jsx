// frontend/src/pages/ecommerce/Productos.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  Sparkles,
  Package,
  Tag,
  Search,
  SlidersHorizontal,
  X,
  Flame,
} from "lucide-react";
import { API_URL } from "../../config/api";
import ProductCard from "../../components/ProductCard";
import BasicDropdown from "../../components/ui/BasicDropdown";
import SearchInput from "../../components/SearchInput";
import { useSocket } from "../../context/SocketContext";

const CATEGORIA_DROPDOWN_ITEMS = [
  { value: "todos", label: "Todas las categorías" },
  { value: "vacuno", label: "🥩 Carne Vacuna" },
  { value: "cerdo", label: "🐷 Cortes de Cerdo" },
  { value: "pollo", label: "🍗 Pollo & Granja" },
  { value: "embutidos", label: "🌭 Embutidos & Achuras" },
  { value: "preparados", label: "🍲 Elaborados & Caseros" },
  { value: "combos", label: "📦 Packs & Combos" },
  { value: "almacen", label: "🧂 Almacén" },
];

const ORDEN_ITEMS = [
  { value: "relevancia", label: "Relevancia" },
  { value: "precio_asc", label: "Menor precio" },
  { value: "precio_desc", label: "Mayor precio" },
  { value: "puntos_desc", label: "Más puntos" },
];

export default function Productos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const { catalogoVersion } = useSocket();

  // Estados de datos
  const [productos, setProductos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filtros interactivos
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todos");
  const [filtroOfertas, setFiltroOfertas] = useState(false);
  const [filtroPuntos, setFiltroPuntos] = useState(false);
  const [filtroCombos, setFiltroCombos] = useState(false);
  const [orden, setOrden] = useState("relevancia");

  // Cargar catálogo desde la API
  useEffect(() => {
    const fetchProductos = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const res = await fetch(`${API_URL}/catalogo?activo=true`);
        if (!res.ok) throw new Error("Error al consultar productos");
        const data = await res.json();
        setProductos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al cargar productos:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductos();
  }, [catalogoVersion]);

  // Filtrado reactivo en memoria (incluyendo el texto gestionado por SearchInput)
  const filteredProducts = useMemo(() => {
    let result = productos.filter((prod) => {
      const prodCategoria = (prod.categoria || "").toLowerCase().trim();
      const prodEspecie = (prod.especie || "").toLowerCase().trim();
      const prodNombre = (prod.nombre_producto || "").toLowerCase().trim();
      const prodDesc = (prod.descripcion || "").toLowerCase().trim();

      // 1. Filtro por búsqueda de texto (desde URL ?q=...)
      if (queryParam.trim()) {
        const q = queryParam.toLowerCase().trim();
        const matchQ =
          prodNombre.includes(q) ||
          prodDesc.includes(q) ||
          prodCategoria.includes(q) ||
          prodEspecie.includes(q);
        if (!matchQ) return false;
      }

      // 2. Filtro por categoría seleccionada
      if (categoriaSeleccionada !== "todos") {
        if (categoriaSeleccionada === "combos") {
          const isCombo =
            prodCategoria.includes("combo") ||
            prodCategoria.includes("pack") ||
            prodNombre.includes("combo") ||
            prodNombre.includes("pack");
          if (!isCombo) return false;
        } else {
          const matchCat =
            prodCategoria.includes(categoriaSeleccionada) ||
            prodEspecie.includes(categoriaSeleccionada);
          if (!matchCat) return false;
        }
      }

      // 3. Filtro de ofertas
      if (filtroOfertas) {
        const anterior = Number(prod.precio_anterior);
        const actual = Number(prod.precio);
        const hasDiscount = anterior > 0 && anterior > actual;
        const hasPromos = Array.isArray(prod.promos) && prod.promos.length > 0;
        if (!hasDiscount && !hasPromos) return false;
      }

      // 4. Filtro de puntos
      if (filtroPuntos) {
        if (!prod.gana_puntos || Number(prod.puntos) <= 0) return false;
      }

      // 5. Filtro de combos
      if (filtroCombos) {
        const isCombo =
          prodCategoria.includes("combo") ||
          prodCategoria.includes("pack") ||
          prodNombre.includes("combo") ||
          prodNombre.includes("pack");
        if (!isCombo) return false;
      }

      return true;
    });

    // Ordenamiento
    if (orden === "precio_asc") {
      result.sort((a, b) => Number(a.precio) - Number(b.precio));
    } else if (orden === "precio_desc") {
      result.sort((a, b) => Number(b.precio) - Number(a.precio));
    } else if (orden === "puntos_desc") {
      result.sort((a, b) => Number(b.puntos || 0) - Number(a.puntos || 0));
    }

    return result;
  }, [
    productos,
    queryParam,
    categoriaSeleccionada,
    filtroOfertas,
    filtroPuntos,
    filtroCombos,
    orden,
  ]);

  // Contadores globales
  const totalOfertas = useMemo(
    () =>
      productos.filter((p) => {
        const hasDiscount = Number(p.precio_anterior) > Number(p.precio);
        const hasPromos = Array.isArray(p.promos) && p.promos.length > 0;
        return hasDiscount || hasPromos;
      }).length,
    [productos],
  );

  const totalPuntosCount = useMemo(
    () => productos.filter((p) => p.gana_puntos && Number(p.puntos) > 0).length,
    [productos],
  );

  const handleClearQuery = () => {
    searchParams.delete("q");
    setSearchParams(searchParams);
  };

  const handleResetAllFilters = () => {
    handleClearQuery();
    setCategoriaSeleccionada("todos");
    setFiltroOfertas(false);
    setFiltroPuntos(false);
    setFiltroCombos(false);
    setOrden("relevancia");
  };

  return (
    <div className="w-full bg-neutral-50/60 min-h-screen pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {/* ─── SearchInput en Mobile (desplegado en la vista para acceso rápido) ─── */}
        <div className="block lg:hidden mb-4">
          <SearchInput />
        </div>

        {/* ─── Breadcrumb ─── */}
        <nav aria-label="Navegación secundaria" className="mb-4">
          <ol className="flex items-center flex-wrap gap-y-1 text-sm lg:text-base">
            <li className="flex items-center">
              <Link to="/" className="hover:text-main-blue transition-colors">
                Inicio
              </Link>
              <ChevronRight className="size-4 shrink-0 text-gray-400 mx-1" />
            </li>
            <li className="font-medium text-gray-500 capitalize">
              {queryParam ? "Búsqueda" : "Catálogo de Productos"}
            </li>
          </ol>
        </nav>

        {/* ─── Header de Vista de Productos ─── */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-neutral-200/80 shadow-2xs mb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  {queryParam ? (
                    <span className="flex items-center gap-2">
                      <span>Resultados para</span>
                      <span className="text-main-blue">"{queryParam}"</span>
                    </span>
                  ) : (
                    "Catálogo de Productos"
                  )}
                </h1>
                <span className="text-xs font-bold text-main-blue bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/60">
                  {isLoading
                    ? "..."
                    : `${filteredProducts.length} ${filteredProducts.length === 1 ? "corte" : "cortes"}`}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-500">
                {queryParam
                  ? "Buscando en todos los cortes, elaborados y especialidades de la tienda."
                  : "Explorá todas las categorías, ofertas y cortes disponibles con entrega directa."}
              </p>
            </div>

            {/* Chip de búsqueda activa con botón para limpiar */}
            {queryParam && (
              <button
                type="button"
                onClick={handleClearQuery}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-700 transition-colors cursor-pointer shrink-0"
              >
                <Search className="size-3.5 text-neutral-500" />
                <span>Limpiar búsqueda</span>
                <X className="size-3.5 text-neutral-400 hover:text-red-600" />
              </button>
            )}
          </div>
        </div>

        {/* ─── Barra de Filtros, Categorías y Ordenamiento ─── */}
        <div className="bg-white rounded-xl p-3.5 border border-neutral-200/80 shadow-2xs mb-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Dropdown de Categoría */}
          <div className="w-full lg:w-56 shrink-0">
            <BasicDropdown
              items={CATEGORIA_DROPDOWN_ITEMS}
              value={categoriaSeleccionada}
              onChange={setCategoriaSeleccionada}
              buttonClassName="py-1.5 text-xs"
            />
          </div>

          {/* Chips de filtro rápido */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 flex-1">
            <button
              type="button"
              onClick={() => {
                setFiltroOfertas(false);
                setFiltroPuntos(false);
                setFiltroCombos(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                !filtroOfertas && !filtroPuntos && !filtroCombos
                  ? "bg-main-blue text-white shadow-2xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              Todos ({productos.length})
            </button>

            {totalOfertas > 0 && (
              <button
                type="button"
                onClick={() => setFiltroOfertas(!filtroOfertas)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  filtroOfertas
                    ? "bg-red-500 text-white shadow-2xs"
                    : "bg-red-50 text-red-700 border border-red-200/60 hover:bg-red-100"
                }`}
              >
                <Tag className="size-3" />
                <span>Ofertas ({totalOfertas})</span>
              </button>
            )}

            {totalPuntosCount > 0 && (
              <button
                type="button"
                onClick={() => setFiltroPuntos(!filtroPuntos)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  filtroPuntos
                    ? "bg-amber-500 text-white shadow-2xs"
                    : "bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100"
                }`}
              >
                <Sparkles className="size-3" />
                <span>Con Puntos ({totalPuntosCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setFiltroCombos(!filtroCombos)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                filtroCombos
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-blue-50 text-main-blue border border-blue-200/60 hover:bg-blue-100"
              }`}
            >
              <Package className="size-3" />
              <span>Packs & Combos</span>
            </button>
          </div>

          {/* Ordenamiento con BasicDropdown UI */}
          <div className="w-full lg:w-48 shrink-0">
            <BasicDropdown
              items={ORDEN_ITEMS}
              value={orden}
              onChange={setOrden}
              buttonClassName="py-1.5 text-xs"
            />
          </div>
        </div>

        {/* ─── Grilla de Productos ─── */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-1.5 gap-y-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white border border-neutral-200/60 p-3 rounded-lg flex flex-col gap-3"
              >
                <div className="bg-neutral-200 aspect-square rounded-md w-full" />
                <div className="bg-neutral-200 h-4 rounded w-3/4" />
                <div className="bg-neutral-200 h-4 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl p-8 text-center border border-red-200/80 shadow-2xs max-w-md mx-auto">
            <p className="text-sm font-bold text-red-600 mb-1">
              Hubo un problema al cargar los productos
            </p>
            <p className="text-xs text-neutral-500 mb-4">
              Revisá tu conexión a internet o intentá recargar la vista.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-main-blue text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Recargar
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-neutral-200/80 shadow-2xs max-w-lg mx-auto">
            <div className="size-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
              <Package className="size-6 stroke-1" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-neutral-900">
              No encontramos cortes que coincidan con tu búsqueda
            </h3>
            <p className="text-xs text-neutral-500 mt-1 mb-4">
              {queryParam
                ? `No hay resultados para "${queryParam}".`
                : "No hay cortes disponibles con los filtros actuales."}
            </p>
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-main-blue text-white font-bold text-xs shadow-2xs hover:bg-main-blue/90 transition-all cursor-pointer"
            >
              <span>Ver todo el catálogo</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-1.5 gap-y-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
