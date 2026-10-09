// src/pages/Catalogo.jsx
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";
import { useCatalogo } from "@/context/CatalogoContext";

export const Catalogo = ({ onOpenProduct, onOpenCustomizer }) => {
  const { productos, isLoading, categoryCounts } = useCatalogo();
  const [searchParams, setSearchParams] = useSearchParams();

  // Categorías con conteos dinámicos oficiales de PostgreSQL
  const categoriesList = useMemo(
    () => [
      { id: "todos", label: "Todos", count: categoryCounts.todos },
      {
        id: "asado",
        label: "Especial Asado 🔥",
        special: true,
        count: categoryCounts.asado,
      },
      { id: "combos", label: "Combos Ahorro", tag: "Promo", special: true },
      { id: "vacuno", label: "Carne Vacuna", count: categoryCounts.vacuno },
      { id: "cerdo", label: "Cerdo", count: categoryCounts.cerdo },
      { id: "pollo", label: "Granja & Pollo", count: categoryCounts.pollo },
      {
        id: "preparados",
        label: "Preparados",
        count: categoryCounts.preparados,
      },
      { id: "embutidos", label: "Embutidos", count: categoryCounts.embutidos },
      { id: "achuras", label: "Achuras", count: categoryCounts.achuras },
      {
        id: "almacen",
        label: "Almacén Parrillero",
        count: categoryCounts.almacen,
      },
    ],
    [categoryCounts],
  );

  // Derivado directo de la URL (Single Source of Truth)
  const selectedCategory = searchParams.get("categoria") || "todos";
  const searchQuery = searchParams.get("q") || "";

  const handleSelectCategory = (catId) => {
    const newParams = new URLSearchParams(searchParams);
    if (catId === "todos") {
      newParams.delete("categoria");
    } else {
      newParams.set("categoria", catId);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (val) => {
    const newParams = new URLSearchParams(searchParams);
    if (!val.trim()) {
      newParams.delete("q");
    } else {
      newParams.set("q", val);
    }
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("categoria");
    newParams.delete("q");
    setSearchParams(newParams);
  };

  const filteredProducts = useMemo(() => {
    let list = [...productos];

    if (selectedCategory !== "todos") {
      if (selectedCategory === "asado") {
        list = list.filter(
          (p) =>
            p.categoria === "vacuno" ||
            p.categoria === "cerdo" ||
            p.categoria === "embutidos" ||
            p.categoria === "achuras",
        );
      } else if (selectedCategory === "milanesas") {
        list = list.filter((p) => p.categoria === "preparados");
      } else {
        list = list.filter((p) => p.categoria === selectedCategory);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.nombre && p.nombre.toLowerCase().includes(q)) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
          (p.categoria && p.categoria.toLowerCase().includes(q)) ||
          (p.especie && p.especie.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [productos, selectedCategory, searchQuery]);

  const handleProductClick = (product) => {
    if (onOpenProduct) {
      onOpenProduct(product);
    } else if (onOpenCustomizer) {
      onOpenCustomizer(product);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 flex flex-col">
      {/* Header y Buscador Mobile */}
      <div className="bg-white lg:bg-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6 pt-6">
        {/* Buscador Mobile */}
        <div className="relative flex w-full md:hidden items-center">
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Search className="size-4 stroke-[2.5]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar vacío, asado, bondiola, pollo..."
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#F1F4F8] border-none text-xs font-medium placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#003366]/20 transition-all outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
            >
              <X className="size-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Categorías Horizontales con scroll nativo */}
      <section className="bg-white lg:bg-transparent p-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {categoriesList.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          if (cat.special) {
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-[#c53030] text-white shadow-2xs"
                    : "bg-red-50 text-[#c53030] border border-red-200/70 hover:bg-red-100/80"
                }`}
              >
                <span>{cat.label}</span>
                {cat.count !== undefined && cat.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-num ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-red-200/70 text-[#c53030]"
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            );
          }

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? "bg-[#003366] text-white shadow-2xs"
                  : "bg-white lg:bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 lg:border-none"
              }`}
            >
              <span>{cat.label}</span>
              {cat.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-num ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {cat.count}
                </span>
              )}
              {cat.tag && (
                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {cat.tag}
                </span>
              )}
            </button>
          );
        })}
      </section>

      {/* Grilla de Productos */}
      <div className="mt-4 px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-500">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1
              ? "corte encontrado"
              : "cortes encontrados"}
          </span>
        </div>

        {/* Estado de carga con Skeleton Loaders */}
        {isLoading && productos.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center text-slate-500 shadow-native">
            <p className="text-3xl mb-2">🔍</p>
            <h3 className="font-black text-base text-slate-800">
              No encontramos cortes para esa categoría o término
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Intentá seleccionando "Todos" o buscando otro nombre
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-[#003366] text-white text-xs font-bold cursor-pointer hover:bg-valette-dark transition-colors"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onOpenCustomizer={() => handleProductClick(prod)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalogo;
