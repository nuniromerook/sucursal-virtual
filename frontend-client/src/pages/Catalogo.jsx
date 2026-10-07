// src/pages/Catalogo.jsx
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { CORTES_MOCK } from "@/services/catalogo.service";

const CATEGORIES = [
  { id: "todos", label: "Todos", count: 12 },
  { id: "asado", label: "Especial Asado 🔥", special: true },
  { id: "vacuno", label: "Carne Vacuna", count: 4 },
  { id: "cerdo", label: "Cerdo", count: 2 },
  { id: "pollo", label: "Granja & Pollo", count: 2 },
  { id: "preparados", label: "Preparados", count: 1 },
  { id: "embutidos", label: "Embutidos", count: 2 },
  { id: "achuras", label: "Achuras", count: 1 },
  { id: "combos", label: "Combos Ahorro", tag: "Promo", special: true },
];

export const Catalogo = ({ onOpenProduct, onOpenCustomizer }) => {
  const [searchParams, setSearchParams] = useSearchParams();

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
    let list = [...CORTES_MOCK];

    if (selectedCategory !== "todos") {
      if (selectedCategory === "asado") {
        list = list.filter(
          (p) =>
            p.categoria === "vacuno" ||
            p.categoria === "cerdo" ||
            p.categoria === "embutidos" ||
            p.categoria === "achuras"
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
          p.nombre.toLowerCase().includes(q) ||
          p.descripcion.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q)
      );
    }

    return list;
  }, [selectedCategory, searchQuery]);

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
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Catálogo de Carnicería & Frigorífico
          </h1>
          <p className="text-xs text-slate-500">
            Explorá todos nuestros cortes cárnicos, preparados, achuras y embutidos de calidad de campo.
          </p>
        </div>

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
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Categorías Horizontales con scroll nativo */}
      <section className="bg-white lg:bg-transparent p-2 sm:px-6 mt-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-1">
          {CATEGORIES.map((cat) => {
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
        </div>
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

        {filteredProducts.length === 0 ? (
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
              className="mt-4 px-4 py-2 rounded-xl bg-[#003366] text-white text-xs font-bold cursor-pointer"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
