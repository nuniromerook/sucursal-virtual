import React, { useEffect, useState } from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { Tag, ArrowRight } from "lucide-react";
import { API_URL } from "../../../config/api";
import { formatCantidad } from "../../../utils/formatters";

const DUMMY_IMAGE =
  "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=800";

const Stock = () => {
  const { sucursal } = useOutletContext();
  // En Sucursal.jsx
  const { slug, id } = useParams();

  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStock = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/inventario?sucursal_id=${sucursal.id}`,
      );
      const data = await res.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sucursal?.id) loadStock();
  }, [sucursal?.id]);

  if (isLoading)
    return <p className="text-sm text-gray-500">Cargando stock...</p>;

  return (
    <div className="flex flex-col gap-y-3">
      {productos.map((producto) => {
        const tienePrecio = Boolean(producto.inventario_id);
        const disponibles =
          producto.paquetes?.filter((p) => p.estado === "disponible") || [];

        // CÁLCULO DE OFERTA
        const enOferta =
          producto.precio_anterior &&
          producto.precio_anterior > producto.precio_por_kg;
        const porcentajeDescuento = enOferta
          ? Math.round(
              ((producto.precio_anterior - producto.precio_por_kg) /
                producto.precio_anterior) *
                100,
            )
          : 0;

        return (
          <div
            key={producto.catalogo_id}
            onClick={() =>
              navigate(`/sucursal/${slug}/stock/${producto.slug}/paquetes`)
            }
            className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-emerald-600 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={producto.imagen_url || DUMMY_IMAGE}
                alt={producto.nombre_producto}
                className="size-16 shrink-0 rounded-lg object-cover"
              />

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                    {producto.nombre_producto}
                  </h3>

                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium capitalize">
                    {producto.unidad_medida || "kg"}
                  </span>

                  {enOferta && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700">
                      <Tag className="size-3" />
                      {porcentajeDescuento}% OFF
                    </span>
                  )}
                </div>

                {/* VISTA RÁPIDA DE PAQUETES DE ESTE PRODUCTO */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {disponibles.length === 0 ? (
                    <span className="text-xs font-medium text-amber-600">
                      Sin stock cargado
                    </span>
                  ) : (
                    disponibles.map((paquete) => (
                      <span
                        key={paquete.id}
                        className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-800"
                      >
                        {formatCantidad(
                          Number(paquete.peso),
                          producto.unidad_medida,
                        )}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* PRECIOS Y ACCIONES */}
            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
              {tienePrecio ? (
                <div className="text-right">
                  {enOferta && (
                    <span className="block text-xs text-gray-400 line-through">
                      $
                      {Number(producto.precio_anterior).toLocaleString("es-AR")}
                    </span>
                  )}
                  <span className="text-base font-bold text-gray-900">
                    ${Number(producto.precio_por_kg).toLocaleString("es-AR")}
                    <span className="text-xs text-gray-500 font-normal">
                      {" "}
                      / {producto.unidad_medida || "kg"}
                    </span>
                  </span>
                </div>
              ) : (
                <span className="text-xs font-medium text-red-500 bg-red-50 px-2.5 py-1 rounded-md">
                  Sin precio configurado
                </span>
              )}

              <ArrowRight className="size-5 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Stock;
