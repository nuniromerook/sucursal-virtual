// src/pages/Home.jsx
import { useState, useMemo } from "react";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { CombosSection } from "@/components/home/CombosSection";
import { BranchesSection } from "@/components/home/BranchesSection";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";
import { useCatalogo } from "@/context/CatalogoContext";
import { useLocation } from "@/context/LocationContext";
import { ChevronDown, MapPin } from "lucide-react";

export const Home = ({ onOpenProduct, onOpenCustomizer }) => {
  const { productos, isLoading } = useCatalogo();
  const { customerAddress } = useLocation();

  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, _setSortBy] = useState("destacados");
  const [onlyStock, _setOnlyStock] = useState(false);

  // Filtrado reactivo de cortes oficiales desde PostgreSQL
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

    if (onlyStock) {
      list = list.filter((p) => !p.sin_stock && p.activo !== false);
    }

    if (sortBy === "precio-menor") {
      list.sort((a, b) => a.precio - b.precio);
    } else if (sortBy === "precio-mayor") {
      list.sort((a, b) => b.precio - a.precio);
    } else if (sortBy === "alfabetico") {
      list.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return list;
  }, [productos, selectedCategory, searchQuery, onlyStock, sortBy]);

  const handleProductClick = (product) => {
    if (onOpenProduct) {
      onOpenProduct(product);
    } else if (onOpenCustomizer) {
      onOpenCustomizer(product);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 gap-6 flex flex-col">
      {/* Selector rápido de dirección/sucursal mobile */}
      <button
        type="button"
        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer shrink-0 sm:hidden shadow-native"
      >
        <MapPin className="size-6 text-valette-blue stroke-2" />
        <div className="flex flex-col items-start">
          <p className="text-xs text-valette-blue">Enviar a:</p>
          <p className="text-sm text-valette-dark font-semibold truncate max-w-50">
            {customerAddress || "J. Tarulli 1474, Luis Guillón"}
          </p>
        </div>
        <ChevronDown className="size-4 text-slate-400 shrink-0 stroke-[2.5] ml-auto" />
      </button>

      {/* Carrusel de Banners Publicitarios Oficiales */}
      <BannerCarousel onSelectCategory={(cat) => setSelectedCategory(cat)} />

      {/* Sección de Combos (Visible si está en todos o combos) */}
      {(selectedCategory === "todos" || selectedCategory === "combos") && (
        <CombosSection onSelectCategory={(cat) => setSelectedCategory(cat)} />
      )}

      {/* Catálogo de Cortes Destacados */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Productos destacados
            </h2>
            <p className="text-xs text-slate-500">
              Cortes frescos de frigorífico seleccionados por calidad y
              rendimiento.
            </p>
          </div>
          <div className="text-xs text-slate-500 hidden sm:block">
            Mostrando{" "}
            <span className="font-bold text-slate-800">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "producto" : "productos"}
            </span>
          </div>
        </div>

        {/* Estado de carga con Skeleton Loaders estilo Uber / PedidosYa */}
        {isLoading && productos.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center text-slate-500 shadow-native">
            <p className="text-3xl mb-2">🔍</p>
            <h3 className="font-black text-base text-slate-800">
              No encontramos cortes para esa búsqueda
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Intentá buscando por especie como "asado", "vacio", "bondiola" o
              "pollo"
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("todos");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#003366] text-white text-xs font-bold cursor-pointer hover:bg-valette-dark transition-colors"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-3">
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

      {/* Fichas de Sucursales y Horarios */}
      <BranchesSection />
    </main>
  );
};

export default Home;
