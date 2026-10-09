// src/pages/Home.jsx
import { useState, useMemo } from "react";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { CombosSection } from "@/components/home/CombosSection";
import { BranchesSection } from "@/components/home/BranchesSection";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";
import { useCatalogo } from "@/context/CatalogoContext";
import { useLocation } from "@/context/LocationContext";
import { ChevronDown, MapPin, Store } from "lucide-react";

export const Home = ({
  onOpenProduct,
  onOpenCustomizer,
  onOpenBranchModal,
}) => {
  const { productos, isLoading } = useCatalogo();
  const { customerAddress, deliveryMode, selectedBranch } = useLocation();

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
      {/* Selector de Entrega / Retiro & Dirección Mobile */}
      <div className="sm:hidden -mt-1">
        <button
          type="button"
          onClick={onOpenBranchModal}
          className="w-full p-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-native flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer hover:border-slate-300 group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-9 rounded-xl bg-[#003366]/5 border border-[#003366]/15 text-[#003366] flex items-center justify-center shrink-0">
              {deliveryMode === "pickup" ? (
                <Store className="size-4.5 stroke-[2.2]" />
              ) : (
                <MapPin className="size-4.5 stroke-[2.2]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[#003366]">
                  {deliveryMode === "pickup"
                    ? "Retiro en Mostrador"
                    : "Envío a Domicilio"}
                </span>
              </div>
              <p className="text-xs font-black text-slate-900 truncate mt-0.5 group-hover:text-[#003366] transition-colors">
                {deliveryMode === "pickup"
                  ? `Sucursal ${selectedBranch?.nombre || "Luis Guillón"}`
                  : customerAddress || "J. Tarulli 1474, Luis Guillón"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 pl-1">
            <span className="text-[10px] font-extrabold text-[#003366] bg-[#003366]/5 px-2 py-0.5 rounded-lg border border-[#003366]/10">
              Cambiar
            </span>
            <ChevronDown className="size-3.5 text-slate-400 group-hover:text-[#003366] transition-colors stroke-[2.5]" />
          </div>
        </button>
      </div>

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
