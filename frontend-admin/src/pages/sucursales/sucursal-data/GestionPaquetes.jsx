import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Tag,
  Layers,
  Save,
  AlertCircle,
  Star,
  Coins,
} from "lucide-react";
import { API_URL } from "../../../config/api";
import { formatCantidad } from "../../../utils/formatters";
import { useAppContext } from "../../../context/AppContext";

const DUMMY_IMAGE =
  "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=800";

const GestionPaquetes = () => {
  const { slug, id, catalogoProducto } = useParams();
  const sucursalSlug = slug || id;
  const navigate = useNavigate();

  const [producto, setProducto] = useState(null);
  const [sucursalInfo, setSucursalInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { setNavbarTitle, setBreadcrumbExtra } = useAppContext();

  // Guardar/Actualizar precio general, oferta, destacado, puntos y activo
  const [precioForm, setPrecioForm] = useState({
    precio_por_kg: "",
    precio_anterior: "",
    en_oferta: false,
    destacado: false,
    gana_puntos: false,
    puntos: "",
    activo: true,
  });

  // Estado para la carga rápida de paquete individual
  const [nuevoPesoInput, setNuevoPesoInput] = useState("");

  // Estado para la carga en lote (Bulk)
  const [bulkInput, setBulkInput] = useState("");

  // Estado para edición en línea de un paquete existente
  const [editingPaqueteId, setEditingPaqueteId] = useState(null);
  const [editPesoValue, setEditPesoValue] = useState("");

  // Cargar información básica de la sucursal y del producto con sus paquetes
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Obtener datos de la sucursal por slug
      const resSuc = await fetch(`${API_URL}/sucursales/${sucursalSlug}`);
      const sucursalData = await resSuc.json();
      setSucursalInfo(sucursalData);

      if (!sucursalData?.id) return;

      // 2. Obtener el stock completo de la sucursal
      const resStock = await fetch(
        `${API_URL}/inventario?sucursal_id=${sucursalData.id}`,
      );
      const stockData = await resStock.json();

      // Buscamos el producto correspondiente a esta ruta
      const currentProd = stockData.find((p) => p.slug === catalogoProducto);

      if (currentProd) {
        setProducto(currentProd);
        setNavbarTitle(currentProd.nombre_producto);
        setBreadcrumbExtra({
          productName: currentProd.nombre_producto,
        });

        setPrecioForm({
          precio_por_kg: currentProd.precio_por_kg || "",
          precio_anterior: currentProd.precio_anterior || "",
          en_oferta: Boolean(
            currentProd.precio_anterior &&
            currentProd.precio_anterior > currentProd.precio_por_kg,
          ),
          destacado: Boolean(currentProd.destacado),
          gana_puntos: Boolean(currentProd.gana_puntos),
          puntos: currentProd.puntos || "",
          activo: currentProd.activo !== false,
        });
      }
    } catch (error) {
      console.error("Error al cargar la gestión de paquetes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug, catalogoProducto]);

  // Convierte las entradas del usuario (gramos o kg) a valor decimal en Kilos
  const normalizePesoInput = (rawVal) => {
    if (!rawVal) return 0;
    const cleanStr = rawVal.toString().replace(",", ".");
    const num = parseFloat(cleanStr);
    if (isNaN(num)) return 0;

    if (
      (!producto?.unidad_medida || producto?.unidad_medida === "kg") &&
      num >= 10
    ) {
      return Number((num / 1000).toFixed(3));
    }
    return Number(num.toFixed(3));
  };

  // Handler de guardado de configuración
  const handleGuardarPrecio = async (e) => {
    e.preventDefault();
    if (!precioForm.precio_por_kg || !sucursalInfo?.id) return;

    setIsSaving(true);
    const payload = {
      precio_por_kg: Number(precioForm.precio_por_kg),
      precio_anterior: precioForm.en_oferta
        ? Number(precioForm.precio_anterior)
        : null,
      destacado: precioForm.destacado,
      gana_puntos: precioForm.gana_puntos,
      puntos: precioForm.gana_puntos ? Number(precioForm.puntos) : 0,
      activo: precioForm.activo,
    };

    try {
      if (producto.inventario_id) {
        await fetch(`${API_URL}/inventario/precio`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inventario_id: producto.inventario_id,
            ...payload,
          }),
        });
      } else {
        await fetch(`${API_URL}/inventario`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            catalogo_id: producto.catalogo_id,
            sucursal_id: sucursalInfo.id,
            ...payload,
          }),
        });
      }
      await loadData();
    } catch (error) {
      console.error("Error al guardar configuración:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Agregar un único paquete
  const handleAgregarUnicoPaquete = async (e) => {
    e.preventDefault();
    if (!nuevoPesoInput || !producto?.inventario_id) return;

    const pesoNormalizado = normalizePesoInput(nuevoPesoInput);
    if (pesoNormalizado <= 0) return;

    const precioFinal = Number(
      (pesoNormalizado * producto.precio_por_kg).toFixed(2),
    );

    setIsSaving(true);
    try {
      await fetch(`${API_URL}/paquetes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventario_id: producto.inventario_id,
          peso: pesoNormalizado,
          precio_final: precioFinal,
        }),
      });

      setNuevoPesoInput("");
      await loadData();
    } catch (error) {
      console.error("Error al agregar paquete:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Carga masiva por lote (separado por comas o saltos de línea)
  const handleCargaMasiva = async (e) => {
    e.preventDefault();
    if (!bulkInput.trim() || !producto?.inventario_id) return;

    const items = bulkInput
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    setIsSaving(true);
    try {
      for (const item of items) {
        const peso = normalizePesoInput(item);
        if (peso > 0) {
          const precioFinal = Number(
            (peso * producto.precio_por_kg).toFixed(2),
          );
          await fetch(`${API_URL}/paquetes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inventario_id: producto.inventario_id,
              peso,
              precio_final: precioFinal,
            }),
          });
        }
      }

      setBulkInput("");
      await loadData();
    } catch (error) {
      console.error("Error en carga en lote:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Guardar edición de un paquete
  const handleGuardarEdicionPaquete = async (paqueteId) => {
    const peso = normalizePesoInput(editPesoValue);
    if (peso <= 0) return;

    setIsSaving(true);
    try {
      await fetch(`${API_URL}/paquetes/${paqueteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peso,
          estado: "disponible",
        }),
      });

      setEditingPaqueteId(null);
      await loadData();
    } catch (error) {
      console.error("Error al editar paquete:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar paquete
  const handleEliminarPaquete = async (paqueteId) => {
    if (!window.confirm("¿Seguro que querés eliminar este paquete?")) return;

    setIsSaving(true);
    try {
      await fetch(`${API_URL}/paquetes/${paqueteId}`, {
        method: "DELETE",
      });
      await loadData();
    } catch (error) {
      console.error("Error al eliminar paquete:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <p className="p-6 text-sm text-gray-500">Cargando editor de stock...</p>
    );
  }

  if (!producto) {
    return (
      <div className="p-6 flex flex-col items-start gap-4">
        <p className="text-red-600 font-medium">
          Producto no encontrado en el catálogo.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
        >
          <ArrowLeft className="size-4" /> Volver al listado
        </button>
      </div>
    );
  }

  const disponibles =
    producto.paquetes?.filter((p) => p.estado === "disponible") || [];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* CABECERA CON NAVEGACIÓN Y TÍTULO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/sucursal/${sucursalSlug}/stock`)}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
            title="Volver"
          >
            <ArrowLeft className="size-5" />
          </button>
          <img
            src={producto.imagen_url || DUMMY_IMAGE}
            alt={producto.nombre_producto}
            className="size-14 rounded-xl object-cover border border-gray-200"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {producto.nombre_producto}
            </h1>
            <p className="text-xs text-gray-500 capitalize">
              Sucursal:{" "}
              <span className="font-semibold text-gray-700">
                {sucursalInfo?.nombre}
              </span>{" "}
              · Unidad:{" "}
              <span className="font-semibold text-gray-700">
                {producto.unidad_medida || "kg"}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA IZQUIERDA: CONFIGURACIÓN DE PRECIO, OFERTA, DESTACADO Y PUNTOS */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-4">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Tag className="size-4 text-emerald-600" />
              Configuración en sucursal
            </h2>

            <form
              onSubmit={handleGuardarPrecio}
              className="flex flex-col gap-3"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Precio por {producto.unidad_medida || "kg"} ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ej: 8350"
                  value={precioForm.precio_por_kg}
                  onChange={(e) =>
                    setPrecioForm((prev) => ({
                      ...prev,
                      precio_por_kg: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-base sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              {/* CHECKBOX: EN OFERTA */}
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="en_oferta"
                  checked={precioForm.en_oferta}
                  onChange={(e) =>
                    setPrecioForm((prev) => ({
                      ...prev,
                      en_oferta: e.target.checked,
                    }))
                  }
                  className="size-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label
                  htmlFor="en_oferta"
                  className="text-xs font-medium text-gray-700 select-none cursor-pointer"
                >
                  Marcar este producto en Oferta
                </label>
              </div>

              {precioForm.en_oferta && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex flex-col gap-1">
                  <label className="block text-xs font-semibold text-red-800">
                    Precio anterior ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 10500"
                    value={precioForm.precio_anterior}
                    onChange={(e) =>
                      setPrecioForm((prev) => ({
                        ...prev,
                        precio_anterior: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-red-200 p-2 text-base sm:text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                  />
                  <p className="text-[11px] text-red-600 mt-0.5">
                    Se calculará el porcentaje de descuento en la card pública.
                  </p>
                </div>
              )}

              {/* CHECKBOX: DESTACADO */}
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="destacado"
                  checked={precioForm.destacado}
                  onChange={(e) =>
                    setPrecioForm((prev) => ({
                      ...prev,
                      destacado: e.target.checked,
                    }))
                  }
                  className="size-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label
                  htmlFor="destacado"
                  className="text-xs font-medium text-gray-700 select-none cursor-pointer flex items-center gap-1.5"
                >
                  <Star className="size-3.5 text-amber-500 fill-amber-500" />
                  Destacar este producto
                </label>
              </div>

              {/* CHECKBOX: ACTIVAR PUNTOS */}
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="gana_puntos"
                  checked={precioForm.gana_puntos}
                  onChange={(e) =>
                    setPrecioForm((prev) => ({
                      ...prev,
                      gana_puntos: e.target.checked,
                    }))
                  }
                  className="size-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label
                  htmlFor="gana_puntos"
                  className="text-xs font-medium text-gray-700 select-none cursor-pointer flex items-center gap-1.5"
                >
                  <Coins className="size-3.5 text-amber-600" />
                  Activar programa de puntos
                </label>
              </div>

              {/* INPUT: CANTIDAD DE PUNTOS */}
              {precioForm.gana_puntos && (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex flex-col gap-1">
                  <label className="block text-xs font-semibold text-amber-900">
                    Cantidad de puntos
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 50"
                    value={precioForm.puntos}
                    onChange={(e) =>
                      setPrecioForm((prev) => ({
                        ...prev,
                        puntos: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-amber-200 p-2 text-base sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  />
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Puntos acumulables o necesarios para este producto.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 w-full mt-2 rounded-lg bg-emerald-700 py-2.5 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors"
              >
                <Save className="size-4" />
                {producto.inventario_id
                  ? "Actualizar configuración"
                  : "Dar de alta configuración"}
              </button>
            </form>
          </div>

          {/* CÁLCULO / ALTA DE PAQUETE INDIVIDUAL */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-4">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Plus className="size-4 text-emerald-600" />
              Agregar un paquete
            </h2>

            {!producto.inventario_id ? (
              <p className="text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                <AlertCircle className="size-4 shrink-0" />
                Primero debés guardar la configuración base antes de agregar
                paquetes.
              </p>
            ) : (
              <form
                onSubmit={handleAgregarUnicoPaquete}
                className="flex flex-col gap-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cantidad / Peso ({producto.unidad_medida || "kg"} o gramos)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Ej: 950 (gramos) o 1.85 (kg)"
                    value={nuevoPesoInput}
                    onChange={(e) => setNuevoPesoInput(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-base sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Si ponés <span className="font-semibold">950</span> se
                    guardará como{" "}
                    <span className="font-semibold">0.95 kg (950g)</span>.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSaving || !nuevoPesoInput}
                  className="flex items-center justify-center gap-2 w-full rounded-lg bg-gray-900 py-2 px-4 text-xs font-semibold text-white hover:bg-black disabled:opacity-50 transition-colors"
                >
                  <Plus className="size-3.5" />
                  Agregar paquete
                </button>
              </form>
            )}
          </div>

          {/* CARGA EN LOTE (BULK IMPORT) */}
          {producto.inventario_id && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Layers className="size-4 text-emerald-600" />
                Carga masiva en lote
              </h2>

              <form
                onSubmit={handleCargaMasiva}
                className="flex flex-col gap-2"
              >
                <textarea
                  rows={3}
                  placeholder="Ejemplo: 950, 1.25, 1.85, 1200, 0.850"
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-base sm:text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
                <p className="text-[11px] text-gray-500">
                  Ingresá valores separados por comas o saltos de línea.
                </p>

                <button
                  type="submit"
                  disabled={isSaving || !bulkInput.trim()}
                  className="w-full rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 py-2 text-xs font-semibold text-gray-800 disabled:opacity-50 transition-colors"
                >
                  Procesar e ingresar lote
                </button>
              </form>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: GRILLA Y LISTADO DE PAQUETES ACTIVOS CON EDICIÓN */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900">
              Paquetes en Stock ({disponibles.length})
            </h2>
            {disponibles.length > 0 && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                Valor estimado: $
                {disponibles
                  .reduce((acc, curr) => acc + Number(curr.precio_final), 0)
                  .toLocaleString("es-AR")}
              </span>
            )}
          </div>

          {disponibles.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-2 text-gray-400">
              <Layers className="size-10 stroke-1" />
              <p className="text-sm font-medium text-gray-600">
                No hay paquetes activos cargados
              </p>
              <p className="text-xs text-gray-400 max-w-xs">
                Utilizá el formulario de la izquierda para dar de alta unidades
                en el inventario.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {disponibles.map((paquete) => {
                const isEditing = editingPaqueteId === paquete.id;

                return (
                  <div
                    key={paquete.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300 transition-all shadow-2xs"
                  >
                    {isEditing ? (
                      /* FORMULARIO DE EDICIÓN EN LÍNEA */
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="number"
                          step="0.001"
                          value={editPesoValue}
                          onChange={(e) => setEditPesoValue(e.target.value)}
                          className="w-24 rounded border border-emerald-500 p-1 text-base sm:text-xs bg-white focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleGuardarEdicionPaquete(paquete.id)
                          }
                          disabled={isSaving}
                          className="p-1.5 rounded bg-emerald-700 text-white hover:bg-emerald-800"
                          title="Guardar"
                        >
                          <Check className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPaqueteId(null)}
                          className="p-1.5 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                          title="Cancelar"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* VISTA DE ITEM DE PAQUETE */
                      <>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">
                            {formatCantidad(
                              Number(paquete.peso),
                              producto.unidad_medida,
                            )}
                          </span>
                          <span className="text-xs font-medium text-gray-500">
                            $
                            {Number(paquete.precio_final).toLocaleString(
                              "es-AR",
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPaqueteId(paquete.id);
                              setEditPesoValue(paquete.peso);
                            }}
                            className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title="Editar paquete"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminarPaquete(paquete.id)}
                            className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar paquete"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestionPaquetes;
