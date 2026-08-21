import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { API_URL } from "../../../config/api";

const DUMMY_IMAGE =
  "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=800";

const Stock = () => {
  const { sucursal } = useOutletContext();
  const [productos, setProductos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // catalogo_id del producto que tiene un mini-form abierto ahora mismo
  const [openForm, setOpenForm] = useState(null);
  const [precioNuevo, setPrecioNuevo] = useState("");
  const [paqueteForm, setPaqueteForm] = useState({
    peso: "",
    precio_final: "",
  });

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

  const closeForm = () => {
    setOpenForm(null);
    setPrecioNuevo("");
    setPaqueteForm({ peso: "", precio_final: "" });
  };

  const handleCargarPrecio = async (catalogo_id) => {
    if (!precioNuevo) return;

    setIsSaving(true);
    try {
      await fetch(`${API_URL}/inventario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogo_id,
          sucursal_id: sucursal.id,
          precio_por_kg: Number(precioNuevo),
        }),
      });

      closeForm();
      loadStock();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAgregarPaquete = async (inventario_id) => {
    if (!paqueteForm.peso || !paqueteForm.precio_final) return;

    setIsSaving(true);
    try {
      await fetch(`${API_URL}/paquetes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventario_id,
          peso: Number(paqueteForm.peso),
          precio_final: Number(paqueteForm.precio_final),
        }),
      });

      closeForm();
      loadStock();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500">Cargando stock...</p>;
  }

  return (
    <div className="flex flex-col gap-y-3">
      {productos.map((producto) => {
        const tienePrecio = Boolean(producto.inventario_id);
        const isFormOpen = openForm === producto.catalogo_id;
        const disponibles = producto.paquetes.filter(
          (p) => p.estado === "disponible",
        );

        return (
          <div
            key={producto.catalogo_id}
            className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-start"
          >
            <img
              src={producto.imagen_url || DUMMY_IMAGE}
              alt={producto.nombre_producto}
              className="size-16 shrink-0 rounded-md object-cover"
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  {producto.nombre_producto}
                </h3>

                {tienePrecio && (
                  <span className="shrink-0 text-sm font-medium text-gray-700">
                    $ {producto.precio_por_kg.toLocaleString("es-AR")}/kg
                  </span>
                )}
              </div>

              {!tienePrecio ? (
                // Este producto todavía no tiene precio cargado en esta
                // sucursal — hay que darlo de alta antes de poder sumarle
                // paquetes (así lo pide el schema: paquetes cuelga de
                // inventario, e inventario necesita catalogo_id + sucursal_id).
                <div className="mt-2">
                  {isFormOpen ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        placeholder="Precio por kg"
                        value={precioNuevo}
                        onChange={(e) => setPrecioNuevo(e.target.value)}
                        className="w-32 rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleCargarPrecio(producto.catalogo_id)}
                        className="rounded bg-emerald-700 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={closeForm}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOpenForm(producto.catalogo_id)}
                      className="text-xs font-medium text-main-blue hover:underline"
                    >
                      + Cargar precio en esta sucursal
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {disponibles.length === 0 && (
                    <span className="text-xs text-red-600">
                      Sin paquetes disponibles
                    </span>
                  )}

                  {disponibles.map((paquete) => (
                    <span
                      key={paquete.id}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                    >
                      {paquete.peso} kg · $
                      {paquete.precio_final.toLocaleString("es-AR")}
                    </span>
                  ))}

                  {isFormOpen ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Kg"
                        value={paqueteForm.peso}
                        onChange={(e) =>
                          setPaqueteForm((prev) => ({
                            ...prev,
                            peso: e.target.value,
                          }))
                        }
                        className="w-16 rounded border border-gray-300 px-1.5 py-0.5 text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Precio"
                        value={paqueteForm.precio_final}
                        onChange={(e) =>
                          setPaqueteForm((prev) => ({
                            ...prev,
                            precio_final: e.target.value,
                          }))
                        }
                        className="w-20 rounded border border-gray-300 px-1.5 py-0.5 text-xs"
                      />
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() =>
                          handleAgregarPaquete(producto.inventario_id)
                        }
                        className="rounded bg-emerald-700 px-2 py-0.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                      >
                        <Plus className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={closeForm}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOpenForm(producto.catalogo_id)}
                      className="flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-500 hover:border-main-blue hover:text-main-blue"
                    >
                      <Plus className="size-3" /> Paquete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Stock;
