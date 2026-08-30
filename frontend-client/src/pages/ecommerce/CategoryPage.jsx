// frontend/src/pages/ecommerce/CategoryPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronRight,
  Sparkles,
  Package,
  Tag,
  Flame,
  ArrowRight,
} from "lucide-react";
import { API_URL } from "../../config/api";
import ProductCard from "../../components/ProductCard";
import BasicDropdown from "../../components/ui/BasicDropdown";
import { useSocket } from "../../context/SocketContext";
import NotFound from "../NotFound";

/**
 * Metadatos y descripciones temáticas de categorías
 */
const CATEGORY_META = {
  vacuno: {
    title: "Carne Vacuna",
    subtitle:
      "Cortes seleccionados de novillo y ternera de primera calidad, frescos de mostrador.",
    emoji: "🥩",
    badge: "Vacuno",
  },
  cerdo: {
    title: "Cortes de Cerdo",
    subtitle:
      "Bondiola, pechito, matambrito, costillitas y cortes tiernos para la parrilla o el horno.",
    emoji: "🐷",
    badge: "Cerdo",
  },
  embutidos: {
    title: "Embutidos & Achuras",
    subtitle:
      "Chorizos artesanales, morcillas, salchicha parrillera y embutidos de máxima frescura.",
    emoji: "🌭",
    badge: "Embutidos",
  },
  pollo: {
    title: "Pollo & Granja",
    subtitle:
      "Supremas, pata muslo, alitas, huevos frescos y derivados de granja.",
    emoji: "🍗",
    badge: "Pollo",
  },
  preparados: {
    title: "Preparados & Elaborados",
    subtitle:
      "Milanesas caseras de carne, pollo y cerdo, hamburguesas y arrollados listos para cocinar.",
    emoji: "🍲",
    badge: "Preparados",
  },
  combos: {
    title: "Combos & Packs de Ahorro",
    subtitle:
      "Ahorrá llevando packs familiares y combos parrilleros listos para compartir.",
    emoji: "📦",
    badge: "Combos",
    isCombo: true,
  },
  almacen: {
    title: "Almacén & Acompañamientos",
    subtitle:
      "Carbón, sales, salsas, especias, aderezos y todo lo necesario para completar tu comida.",
    emoji: "🧂",
    badge: "Almacén",
  },
  ofertas: {
    title: "Ofertas & Descuentos",
    subtitle:
      "Aprovechá los mejores cortes y productos seleccionados con precios especiales y descuentos por tiempo limitado.",
    emoji: "🔥",
    badge: "Ofertas",
  },
};

const ORDEN_ITEMS = [
  { value: "relevancia", label: "Relevancia" },
  { value: "precio_asc", label: "Menor precio" },
  { value: "precio_desc", label: "Mayor precio" },
  { value: "puntos_desc", label: "Más puntos" },
];

export default function CategoryPage() {
  const { categoria } = useParams();
  const { catalogoVersion } = useSocket();

  // Estados de datos
  const [productos, setProductos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filtros rápidos dentro de la categoría
  const [filtroOfertas, setFiltroOfertas] = useState(false);
  const [filtroPuntos, setFiltroPuntos] = useState(false);
  const [filtroCombos, setFiltroCombos] = useState(false);
  const [orden, setOrden] = useState("relevancia");

  // Identificador de la sección actual
  const currentKey = (categoria || "productos").toLowerCase().trim();
  const meta = CATEGORY_META[currentKey] || {
    title: currentKey.charAt(0).toUpperCase() + currentKey.slice(1),
    subtitle: `Explorá todos los productos disponibles en la sección de ${currentKey}.`,
    emoji: "🥩",
    badge: currentKey,
  };

  const isComboCategory = meta.isCombo || currentKey === "combos";

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
        console.error("Error al cargar productos de categoría:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductos();
  }, [categoria, catalogoVersion]);

  // 1. Filtrar los productos que pertenecen a esta categoría
  const categoryProducts = useMemo(() => {
    return productos.filter((prod) => {
      const prodCategoria = (prod.categoria || "").toLowerCase().trim();
      const prodEspecie = (prod.especie || "").toLowerCase().trim();
      const prodNombre = (prod.nombre_producto || "").toLowerCase().trim();
      const target = currentKey;

      if (target === "productos") return true;
      if (target === "vacuno") {
        return prodCategoria === "vacuno" || prodEspecie === "vacuno";
      }
      if (target === "cerdo") {
        return prodCategoria === "cerdo" || prodEspecie === "cerdo";
      }
      if (target === "embutidos") {
        return (
          prodCategoria === "embutidos" ||
          prodNombre.includes("chorizo") ||
          prodNombre.includes("morcilla") ||
          prodNombre.includes("salchicha") ||
          prodNombre.includes("embutido")
        );
      }
      if (target === "pollo") {
        return prodCategoria === "pollo" || prodEspecie === "pollo";
      }
      if (target === "preparados") {
        return (
          prodCategoria === "preparados" ||
          prodCategoria === "elaborados" ||
          prodNombre.includes("milanesa") ||
          prodNombre.includes("hamburguesa")
        );
      }
      if (target === "almacen") {
        return prodCategoria === "almacen" || prodCategoria === "despensa";
      }
      if (target === "ofertas") {
        const anterior = Number(prod.precio_anterior);
        const actual = Number(prod.precio);
        const hasDiscount = anterior > 0 && anterior > actual;
        const hasPromos = Array.isArray(prod.promos) && prod.promos.length > 0;
        const hasDescuentoPorcentaje = Number(prod.descuento_porcentaje) > 0;
        return hasDiscount || hasPromos || hasDescuentoPorcentaje || prod.en_oferta === true;
      }
      if (target === "combos") {
        return (
          prodCategoria.includes("combo") ||
          prodCategoria.includes("pack") ||
          prodNombre.includes("combo") ||
          prodNombre.includes("pack") ||
          (Array.isArray(prod.promos) && prod.promos.length > 0)
        );
      }

      return prodCategoria === target || prodEspecie === target;
    });
  }, [productos, currentKey]);

  // 2. Aplicar micro-filtros (Ofertas, Puntos, Combos) sobre los productos de esta categoría
  const filteredProducts = useMemo(() => {
    let result = categoryProducts.filter((prod) => {
      if (filtroOfertas) {
        const anterior = Number(prod.precio_anterior);
        const actual = Number(prod.precio);
        const hasDiscount = anterior > 0 && anterior > actual;
        const hasPromos = Array.isArray(prod.promos) && prod.promos.length > 0;
        if (!hasDiscount && !hasPromos) return false;
      }

      if (filtroPuntos) {
        if (!prod.gana_puntos || Number(prod.puntos) <= 0) return false;
      }

      if (filtroCombos) {
        const isCombo =
          (prod.categoria || "").toLowerCase().includes("combo") ||
          (prod.categoria || "").toLowerCase().includes("pack") ||
          (prod.nombre_producto || "").toLowerCase().includes("combo") ||
          (prod.nombre_producto || "").toLowerCase().includes("pack") ||
          (Array.isArray(prod.promos) && prod.promos.length > 0);
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
  }, [categoryProducts, filtroOfertas, filtroPuntos, filtroCombos, orden]);

  // Conteo exacto dentro de la categoría
  const totalOfertas = useMemo(
    () =>
      categoryProducts.filter((p) => {
        const hasDiscount = Number(p.precio_anterior) > Number(p.precio);
        const hasPromos = Array.isArray(p.promos) && p.promos.length > 0;
        return hasDiscount || hasPromos;
      }).length,
    [categoryProducts],
  );

  const totalPuntosCount = useMemo(
    () =>
      categoryProducts.filter((p) => p.gana_puntos && Number(p.puntos) > 0)
        .length,
    [categoryProducts],
  );

  // Si la categoría no existe en los metadatos y no tiene productos cargados
  if (
    !isLoading &&
    !CATEGORY_META[currentKey] &&
    categoryProducts.length === 0
  ) {
    return (
      <NotFound
        title="Categoría no encontrada"
        message={`La sección o categoría '${categoria}' no existe o no se encuentra disponible.`}
        showHomeButton={true}
        showProfileButton={false}
      />
    );
  }

  return (
    <div className="w-full bg-neutral-50/60 min-h-screen pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7">
        {/* ─── Breadcrumb ─── */}
        <nav aria-label="Navegación secundaria" className="mb-4">
          <ol className="flex items-center flex-wrap gap-y-1 text-sm lg:text-base">
            <li className="flex items-center">
              <Link to="/" className="hover:text-main-blue transition-colors">
                Inicio
              </Link>
              <ChevronRight className="size-4 shrink-0 text-gray-400 mx-1" />
            </li>
            <li className="text-neutral-900 font-bold capitalize">
              {meta.title}
            </li>
          </ol>
        </nav>

        {/* ─── Banner Header de Categoría ─── */}
        <div className="bg-white rounded-lg p-4 sm:p-5 border border-neutral-200/80 shadow-2xs mb-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="size-12 sm:size-14 rounded-lg bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-2xl sm:text-3xl shadow-2xs shrink-0 select-none">
                {meta.emoji}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h1 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                    {meta.title}
                  </h1>
                  <span className="text-xs font-bold text-main-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                    {isLoading ? "..." : `${filteredProducts.length} productos`}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-500 max-w-xl leading-snug">
                  {meta.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Banner especial para Combos y Packs */}
          {isComboCategory && (
            <div className="mt-3.5 pt-3 border-t border-neutral-100 flex items-center gap-2 text-xs text-amber-900 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
              <Flame className="size-4 text-amber-600 shrink-0" />
              <span>
                <strong>Packs de Ahorro:</strong> Selecciones completas listas
                para la parrilla o la semana con precio especial.
              </span>
            </div>
          )}
        </div>

        {/* ─── Barra de Filtros Rápidos y Ordenamiento (con BasicDropdown) ─── */}
        <div className="bg-white rounded-lg p-3 sm:p-3.5 border border-neutral-200/80 shadow-2xs mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Chips de filtro rápido */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
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
              Todos ({categoryProducts.length})
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
                <span>Ganan Puntos ({totalPuntosCount})</span>
              </button>
            )}
          </div>

          {/* Selector de ordenamiento */}
          <div className="w-full sm:w-48 shrink-0">
            <BasicDropdown
              id="orden-catalogo"
              items={ORDEN_ITEMS}
              value={orden}
              onChange={(val) => setOrden(val)}
              buttonClassName="w-full py-1.5 text-xs font-bold bg-neutral-50 hover:bg-neutral-100 border-neutral-200"
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
              Hubo un problema al cargar los cortes
            </p>
            <p className="text-xs text-neutral-500 mb-4">
              Revisá tu conexión o intentá recargar.
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
              No encontramos cortes con los filtros seleccionados
            </h3>
            <p className="text-xs text-neutral-500 mt-1 mb-4">
              Probá limpiando los filtros para ver todos los productos de{" "}
              {meta.title.toLowerCase()}.
            </p>
            <button
              type="button"
              onClick={() => {
                setFiltroOfertas(false);
                setFiltroPuntos(false);
                setFiltroCombos(false);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-main-blue text-white font-bold text-xs shadow-2xs hover:bg-main-blue/90 transition-all cursor-pointer"
            >
              <span>Ver todos los de {meta.title}</span>
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
