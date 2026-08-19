import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

import { API_URL } from "../config/api";
import { useAppContext } from "../context/AppContext";

const DUMMY_IMAGE =
  "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=800";

const Catalogo = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { setNavbarTitle } = useAppContext();

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/catalog`);
      const data = await response.json();

      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    setNavbarTitle("Catálogo de productos");
  }, []);

  const filteredProducts = products.filter(
    (product) =>
      product.nombre_producto?.toLowerCase().includes(search.toLowerCase()) ||
      product.id?.toString().includes(search.toString()),
  );

  return (
    <div className="flex flex-col gap-y-4 lg:gap-y-6 p-2 lg:p-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="hidden lg:block text-2xl font-bold text-gray-900 py-6">
          Catálogo de productos
        </h1>

        <Link
          to="/catalogo/nuevo-producto"
          className="inline-flex items-center justify-center rounded-md bg-main-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-main-blue/80"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="flex w-full sm:max-w-xs h-10 items-center gap-1 rounded-md border border-neutral-200 bg-white p-0.5">
        <Search className="size-4 shrink-0 text-gray-400 ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto..."
          className="h-full w-full border-none bg-transparent px-2 focus:outline-none focus:ring-0"
          aria-label="Buscar producto en el catálogo"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Cargando productos...</p>
      ) : filteredProducts.length === 0 ? (
        <p className="text-sm text-gray-500">No se encontraron productos.</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-2 lg:gap-x-4 gap-y-3 sm:gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            return (
              <Link
                key={product.id}
                to={`/catalogo/editar/${product.slug}`}
                className="group flex overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
              >
                <div className="h-32 w-32 shrink-0 overflow-hidden bg-gray-100 sm:h-36 sm:w-36">
                  <img
                    src={product.imagen_url || DUMMY_IMAGE}
                    alt={product.nombre_producto}
                    className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-gray-900 line-clamp-1">
                      {product.nombre_producto}
                    </h2>

                    <p className="text-xs text-gray-500 capitalize">
                      {product.especie} / {product.categoria} ·{" "}
                      {product.unidad_medida}
                    </p>

                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                      {product.descripcion || "Sin descripción"}
                    </p>
                  </div>

                  <div className="flex w-full overflow-x-auto gap-x-1 gap-y-1 text-[11px] text-white whitespace-nowrap scrollbar-none">
                    <span className="bg-neutral-500 px-1 py-0.5 rounded">
                      Calorías: {Number(product.calorias) ?? "0"} kcal
                    </span>
                    <span className="bg-neutral-500 px-1 py-0.5 rounded">
                      Proteínas: {Number(product.proteinas) ?? "2"} g
                    </span>
                    <span className="bg-neutral-500 px-1 py-0.5 rounded">
                      Grasas: {Number(product.grasas) ?? "2"} g
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Catalogo;
