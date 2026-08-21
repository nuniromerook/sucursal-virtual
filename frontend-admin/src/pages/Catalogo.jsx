import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";

import { API_URL } from "../config/api";
import { useAppContext } from "../context/AppContext";

const DUMMY_IMAGE =
  "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=800";

// TODO: reemplazar por datos reales de inventario/paquetes por sucursal
// una vez que el endpoint de stock esté listo. Determinístico por id de
// producto para que no cambie en cada render.
const SUCURSALES_DUMMY = ["Luis Guillon"];

const getStockPorSucursalDummy = (product) => {
  return SUCURSALES_DUMMY.map((sucursal, index) => {
    const seed = (product.id || 0) * 7 + index * 13;
    const stockKg = (seed % 15) + 1;
    const paquetes = seed % 12;
    const precioPorKg = 9000 + ((seed * 53) % 15000);
    const slug = "luis-guillon";

    return { sucursal, stockKg, paquetes, precioPorKg, slug };
  });
};

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

      <div className="flex w-full sm:max-w-xs h-10 items-center gap-1 rounded-md border border-neutral-200 bg-white p-0.5">
        <Search className="size-4 shrink-0 text-gray-400 ml-2" />
        <input
          type="search"
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
        <div className="grid grid-cols-2 gap-x-1 lg:gap-x-2 gap-y-3 sm:gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => {
            const stockPorSucursal = getStockPorSucursalDummy(product);

            return (
              <div
                key={product.id}
                className="group flex flex-col h-fit overflow-hidden rounded border border-gray-200 bg-white transition-shadow hover:shadow-md"
              >
                <Link
                  to={`/catalogo/editar/${product.slug}`}
                  className="w-full aspect-square shrink-0 overflow-hidden bg-gray-100"
                >
                  <img
                    src={product.imagen_url || DUMMY_IMAGE}
                    alt={product.nombre_producto}
                    className="h-full w-full object-cover object-center"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <Link to={`/catalogo/editar/${product.slug}`}>
                      <h2 className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {product.nombre_producto}
                      </h2>

                      <p className="text-xs text-gray-500 capitalize">
                        {product.especie} / {product.categoria} ·{" "}
                        {product.unidad_medida}
                      </p>
                    </Link>

                    <div className="overflow-x-auto scrollbar-none mt-2">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="text-left">
                          <tr className="font-medium text-gray-900 text-[13.5px] whitespace-nowrap">
                            <th className="py-1">Sucursal</th>
                            <th className="px-2">Stock</th>
                            <th className="px-2">Paquetes</th>
                            <th className="px-2">Precio /kg</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-sm">
                          {stockPorSucursal.map((s) => (
                            <tr
                              key={s.sucursal}
                              className="text-gray-600 whitespace-nowrap"
                            >
                              <td className="py-1 text-neutral-900">
                                <Link
                                  key={s.sucursal}
                                  to={`/sucursal/${s.slug}`}
                                >
                                  {s.sucursal}
                                </Link>
                              </td>
                              <td className="px-2">{s.stockKg} kg</td>
                              <td className="px-2">{s.paquetes} paq.</td>
                              <td className="px-2">
                                $ {s.precioPorKg.toLocaleString("es-AR")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Catalogo;
