import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  X,
} from "lucide-react";
import Input from "../components/ui/Input";
import TextArea from "../components/ui/TextArea";
import RichTextEditor from "../components/ui/RichTextEditor";
import BasicDropdown from "../components/ui/BasicDropdown";
import ButtonLoader from "../components/ui/ButtonLoader";
import { useAppContext } from "../context/AppContext";
import { VITE_API_URL } from "../config/api";
import { uploadImageToCloudinary } from "../utils/cloudinary"; // Asumiendo el helper de arriba

const EMPTY_FORM = {
  nombre_producto: "",
  slug: "",
  especie: "vacuno",
  categoria: "vacuno",
  descripcion: "",
  proteinas: "",
  calorias: "",
  grasas: "",
  imagen_url: "",
  unidad_medida: "kg",
  precio: "",
  precio_anterior: "0",
  activo: true,
  destacar: false,
  gana_puntos: false,
  puntos: "0",
  sin_stock: false,
};

const ProductEditor = () => {
  const { slug } = useParams();
  const isEditMode = Boolean(slug);

  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [promos, setPromos] = useState([]);
  const [newPromo, setNewPromo] = useState({
    cantidad_kg: "",
    precio_promocional: "",
  });
  const [formError, setFormError] = useState(null);
  const [productId, setProductId] = useState(null);
  const [isFetchingProduct, setIsFetchingProduct] = useState(isEditMode);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { isLoading, setIsLoading, navigate, setNavbarTitle } = useAppContext();

  const itemsEspecie = [
    { value: "vacuno", label: "Vacuno" },
    { value: "cerdo", label: "Cerdo" },
    { value: "pollo", label: "Pollo" },
    { value: "general", label: "General / Almacén" },
  ];

  const itemsCategoria = [
    { value: "vacuno", label: "Vacuno" },
    { value: "cerdo", label: "Cerdo (incluye embutidos)" },
    { value: "pollo", label: "Pollo (incluye granja)" },
    { value: "preparados", label: "Preparados / Elaborados" },
    { value: "almacen", label: "Almacén" },
  ];

  const itemsUnidadMedida = [
    { value: "kg", label: "Kilogramo (kg)" },
    { value: "u", label: "Unidad (u)" },
  ];

  useEffect(() => {
    if (!isEditMode) {
      setNavbarTitle("Nuevo producto");
      setFormValues(EMPTY_FORM);
      setPromos([]);
      setProductId(null);
      return;
    }

    const fetchProducto = async () => {
      setIsFetchingProduct(true);
      setFormError(null);

      try {
        const res = await fetch(
          `${VITE_API_URL}/catalogo/${slug}?incluir_promos_inactivas=true`,
        );
        const data = await res.json();

        if (!res.ok) {
          setFormError(data.error || "No se pudo cargar el producto.");
          return;
        }

        setProductId(data.id);
        setNavbarTitle("Editar producto");
        setPromos(Array.isArray(data.promos) ? data.promos : []);

        setFormValues({
          nombre_producto: data.nombre_producto ?? "",
          slug: data.slug ?? "",
          especie: data.especie ?? "vacuno",
          categoria: data.categoria ?? "cortes",
          descripcion: data.descripcion ?? "",
          proteinas: data.proteinas != null ? String(data.proteinas) : "",
          calorias: data.calorias != null ? String(data.calorias) : "",
          grasas: data.grasas != null ? String(data.grasas) : "",
          imagen_url: data.imagen_url ?? "",
          unidad_medida: data.unidad_medida ?? "kg",
          precio: data.precio != null ? String(data.precio) : "",
          precio_anterior:
            data.precio_anterior != null ? String(data.precio_anterior) : "0",
          activo: Boolean(data.activo),
          destacar: Boolean(data.destacar),
          gana_puntos: Boolean(data.gana_puntos),
          puntos: data.puntos != null ? String(data.puntos) : "0",
          sin_stock: Boolean(data.sin_stock),
        });
      } catch (err) {
        console.error("Error al cargar el producto:", err);
        setFormError("No se pudo conectar con el servidor.");
      } finally {
        setIsFetchingProduct(false);
      }
    };

    fetchProducto();
  }, [slug, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const [isDragging, setIsDragging] = useState(false);

  const processImageFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("El archivo debe ser una imagen válida (PNG, JPG, WEBP).");
      return;
    }

    setIsUploadingImage(true);
    setFormError(null);

    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setFormValues((prev) => ({ ...prev, imagen_url: imageUrl }));
    } catch (err) {
      console.error(err);
      setFormError(
        "Error al subir la imagen. Verificá la configuración de Cloudinary.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) await processImageFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processImageFile(file);
  };

  // Agregar tramo de promoción en caliente o diferido
  const handleAddPromo = async () => {
    if (!newPromo.cantidad_kg || !newPromo.precio_promocional) return;

    if (isEditMode && productId) {
      try {
        const res = await fetch(
          `${VITE_API_URL}/catalogo/${productId}/promos`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cantidad_kg: parseFloat(newPromo.cantidad_kg),
              precio_promocional: parseFloat(newPromo.precio_promocional),
              activa: true,
            }),
          },
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al agregar promo");

        setPromos((prev) => [...prev, data]);
      } catch (err) {
        setFormError(err.message);
        return;
      }
    } else {
      // Modo creación: se guardan localmente hasta crear el producto
      setPromos((prev) => [
        ...prev,
        {
          id: Date.now(),
          cantidad_kg: parseFloat(newPromo.cantidad_kg),
          precio_promocional: parseFloat(newPromo.precio_promocional),
          activa: true,
        },
      ]);
    }

    setNewPromo({ cantidad_kg: "", precio_promocional: "" });
  };

  const handleDeletePromo = async (promoId) => {
    if (isEditMode && productId) {
      try {
        const res = await fetch(
          `${VITE_API_URL}/catalogo/${productId}/promos/${promoId}`,
          {
            method: "DELETE",
          },
        );
        if (!res.ok) throw new Error("No se pudo eliminar la promoción");
      } catch (err) {
        setFormError(err.message);
        return;
      }
    }
    setPromos((prev) => prev.filter((p) => p.id !== promoId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    const payload = {
      ...formValues,
      precio: parseFloat(formValues.precio) || 0,
      precio_anterior: parseFloat(formValues.precio_anterior) || 0,
      proteinas:
        formValues.proteinas === "" ? null : parseFloat(formValues.proteinas),
      calorias:
        formValues.calorias === "" ? null : parseInt(formValues.calorias, 10),
      grasas: formValues.grasas === "" ? null : parseFloat(formValues.grasas),
      puntos: formValues.gana_puntos ? parseInt(formValues.puntos, 10) || 0 : 0,
    };

    const url = isEditMode
      ? `${VITE_API_URL}/catalogo/${productId}`
      : `${VITE_API_URL}/catalogo`;
    const method = isEditMode ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "No se pudo guardar el producto.");
        setIsLoading(false);
        return;
      }

      // Si estábamos creando el producto, creamos los tramos de promo asociados
      if (!isEditMode && promos.length > 0) {
        for (const promo of promos) {
          await fetch(`${VITE_API_URL}/catalogo/${data.id}/promos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cantidad_kg: promo.cantidad_kg,
              precio_promocional: promo.precio_promocional,
              activa: true,
            }),
          });
        }
      }

      setIsLoading(false);
      navigate("/catalogo");
    } catch (err) {
      console.error("Error al guardar el producto:", err);
      setFormError("No se pudo conectar con el servidor.");
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productId) return;
    if (
      !window.confirm("¿Seguro que querés eliminar este producto del catálogo?")
    )
      return;

    setIsDeleting(true);
    setFormError(null);

    try {
      const res = await fetch(`${VITE_API_URL}/catalogo/${productId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "No se pudo eliminar el producto.");
        setIsDeleting(false);
        return;
      }

      navigate("/catalogo");
    } catch (err) {
      console.error("Error al eliminar el producto:", err);
      setFormError("No se pudo conectar con el servidor.");
      setIsDeleting(false);
    }
  };

  if (isEditMode && isFetchingProduct) {
    return (
      <div className="flex flex-col gap-5 animate-pulse">
        <div className="bg-white p-6 rounded-lg border border-neutral-200 h-24" />
        <div className="bg-white p-6 rounded-lg border border-neutral-200 h-96" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* ─── Encabezado en formato módulo ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border bg-white border-neutral-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="size-10 aspect-square rounded-lg bg-main-blue/10 flex items-center justify-center text-main-blue font-black shrink-0">
            <ImageIcon className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base sm:text-lg text-neutral-900 tracking-tight">
                {isEditMode
                  ? `Editar: ${formValues.nombre_producto || "Producto"}`
                  : "Nuevo Producto en Catálogo"}
              </h1>
              {isEditMode && (
                <span className="text-[11px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200">
                  ID #{productId}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Cargá los detalles del corte, precios por kilo, datos
              nutricionales y promociones.
            </p>
          </div>
        </div>
      </div>

      <form
        id="product-editor-form"
        className="rounded-lg border border-neutral-200/80 bg-white p-5 sm:p-6 shadow-2xs"
        onSubmit={handleSubmit}
      >
        {formError && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
            {formError}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              label="Nombre del producto"
              id="nombre_producto"
              inputName="nombre_producto"
              inputType="text"
              autoComplete="nombre_producto"
              placeholder="Bife Ancho"
              value={formValues.nombre_producto}
              setOnChange={handleChange}
            />

            <Input
              label="Slug (URL)"
              id="slug"
              inputName="slug"
              inputType="text"
              autoComplete="slug"
              placeholder="bife-ancho"
              value={formValues.slug}
              setOnChange={handleChange}
            />

            <BasicDropdown
              label="Especie:"
              id="especie"
              items={itemsEspecie}
              value={formValues.especie}
              setOnChange={handleChange}
            />

            <BasicDropdown
              label="Categoría:"
              id="categoria"
              items={itemsCategoria}
              value={formValues.categoria}
              setOnChange={handleChange}
            />

            <BasicDropdown
              label="Unidad de medida:"
              id="unidad_medida"
              items={itemsUnidadMedida}
              value={formValues.unidad_medida}
              setOnChange={handleChange}
            />
          </div>

          <RichTextEditor
            label="Descripción del producto y preparación"
            value={formValues.descripcion}
            onChange={handleChange}
            disabled={isLoading}
          />

          <div className="flex flex-col md:flex-row gap-4">
            <Input
              label="Proteínas (g) (cada 100gr)"
              id="proteinas"
              inputName="proteinas"
              inputType="number"
              autoComplete="proteinas"
              placeholder="20"
              value={formValues.proteinas}
              setOnChange={handleChange}
            />

            <Input
              label="Calorías (kcal) (cada 100gr)"
              id="calorias"
              inputName="calorias"
              inputType="number"
              autoComplete="calorias"
              placeholder="205"
              value={formValues.calorias}
              setOnChange={handleChange}
            />

            <Input
              label="Grasas (g) (cada 100gr)"
              id="grasas"
              inputName="grasas"
              inputType="number"
              autoComplete="grasas"
              placeholder="13"
              value={formValues.grasas}
              setOnChange={handleChange}
            />
          </div>
        </div>

        {/* Sección de Precios y Tramos por Cantidad */}
        <div className="mt-6 flex flex-col gap-4 rounded-lg border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900">Precios y Ofertas</h2>

          <div className="flex flex-col md:flex-row gap-4">
            <Input
              label={`Precio por ${formValues.unidad_medida} ($)`}
              id="precio"
              inputName="precio"
              inputType="number"
              autoComplete="off"
              isRequired={false}
              placeholder="7800"
              value={formValues.precio}
              setOnChange={handleChange}
            />

            <Input
              label="Precio anterior ($) — tachado en tienda"
              id="precio_anterior"
              inputName="precio_anterior"
              inputType="number"
              autoComplete="off"
              isRequired={false}
              placeholder="0"
              value={formValues.precio_anterior}
              setOnChange={handleChange}
            />
          </div>

          {/* Gestión de Promociones por Volumen */}
          <div className="mt-2 border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Promociones por cantidad (ej: Llevar 2 kg por $15.000)
            </label>

            <div className="flex flex-col md:flex-row items-end gap-3 mb-3">
              <Input
                label={`Cantidad (${formValues.unidad_medida})`}
                id="promo_cantidad"
                inputName="cantidad_kg"
                inputType="number"
                placeholder="2"
                isRequired={false}
                value={newPromo.cantidad_kg}
                setOnChange={(e) =>
                  setNewPromo({ ...newPromo, cantidad_kg: e.target.value })
                }
              />

              <Input
                label="Precio promocional total ($)"
                id="promo_precio"
                inputName="precio_promocional"
                inputType="number"
                placeholder="15000"
                isRequired={false}
                value={newPromo.precio_promocional}
                setOnChange={(e) =>
                  setNewPromo({
                    ...newPromo,
                    precio_promocional: e.target.value,
                  })
                }
              />

              <button
                type="button"
                onClick={handleAddPromo}
                className="flex items-center gap-1 rounded-md bg-main-blue text-white px-4 py-2 text-sm font-medium hover:bg-main-blue/90 transition-colors shrink-0"
              >
                <Plus className="size-4" /> Agregar Tramo
              </button>
            </div>

            {promos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {promos.map((promo) => (
                  <div
                    key={promo.id}
                    className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800"
                  >
                    <span>
                      {promo.cantidad_kg} {formValues.unidad_medida} x $
                      {Number(promo.precio_promocional).toLocaleString("es-AR")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeletePromo(promo.id)}
                      className="text-emerald-700 hover:text-red-600 transition-colors"
                      title="Eliminar tramo"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Visibilidad y Puntos */}
        <div className="mt-4 flex flex-col gap-4 rounded-lg border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900">
            Visibilidad y promoción
          </h2>

          <div className="flex flex-col gap-3">
            <label
              htmlFor="activo"
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                id="activo"
                name="activo"
                checked={formValues.activo}
                onChange={handleChange}
                disabled={isLoading}
                className="size-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
              />
              <span className="text-sm font-medium text-gray-900">
                Producto activo (visible en la tienda)
              </span>
            </label>

            <label
              htmlFor="sin_stock"
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                id="sin_stock"
                name="sin_stock"
                checked={formValues.sin_stock}
                onChange={handleChange}
                disabled={isLoading}
                className="size-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
              />
              <span className="text-sm font-medium text-red-700">
                Sin Stock (Ocultar botones de agregar)
              </span>
            </label>

            <label
              htmlFor="destacar"
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                id="destacar"
                name="destacar"
                checked={formValues.destacar}
                onChange={handleChange}
                disabled={isLoading}
                className="size-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
              />
              <span className="text-sm font-medium text-gray-900">
                Destacar en la portada
              </span>
            </label>

            <label
              htmlFor="gana_puntos"
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                id="gana_puntos"
                name="gana_puntos"
                checked={formValues.gana_puntos}
                onChange={handleChange}
                disabled={isLoading}
                className="size-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
              />
              <span className="text-sm font-medium text-gray-900">
                Este producto suma puntos (Club Valette)
              </span>
            </label>

            {formValues.gana_puntos && (
              <div className="md:w-1/3">
                <Input
                  label="Puntos por compra"
                  id="puntos"
                  inputName="puntos"
                  inputType="number"
                  autoComplete="off"
                  placeholder="10"
                  value={formValues.puntos}
                  setOnChange={handleChange}
                />
              </div>
            )}
          </div>
        </div>

        {/* Carga de Imagen con Cloudinary (Drag & Drop + Explorador) */}
        <div className="mt-4 flex flex-col gap-4 rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Imagen del Producto</h2>
            {formValues.imagen_url && (
              <button
                type="button"
                onClick={() =>
                  setFormValues((prev) => ({ ...prev, imagen_url: "" }))
                }
                className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <X className="size-3.5" /> Quitar imagen
              </button>
            )}
          </div>

          <Input
            label="URL directa de la imagen (opcional)"
            id="imagen_url"
            inputName="imagen_url"
            inputType="text"
            placeholder="https://res.cloudinary.com/..."
            value={formValues.imagen_url}
            setOnChange={handleChange}
          />

          <div className="flex flex-col sm:flex-row items-stretch gap-4">
            <label
              htmlFor="Images"
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer select-none ${
                isDragging
                  ? "border-main-blue bg-blue-50/70 ring-4 ring-main-blue/15 scale-[1.01]"
                  : "border-gray-300 hover:border-main-blue/60 hover:bg-gray-50/80 bg-white"
              } ${isUploadingImage || isLoading ? "pointer-events-none opacity-60" : ""}`}
            >
              {isUploadingImage ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-8 text-main-blue animate-spin" />
                  <span className="text-sm font-bold text-neutral-800">
                    Subiendo imagen a Cloudinary...
                  </span>
                  <span className="text-xs text-neutral-400">
                    Por favor esperá unos segundos
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`size-12 rounded-xl flex items-center justify-center transition-colors ${
                      isDragging
                        ? "bg-main-blue text-white"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    <UploadCloud className="size-6" />
                  </div>
                  <span className="mt-1 text-sm font-bold text-neutral-800">
                    {isDragging
                      ? "¡Soltá la imagen acá!"
                      : "Arrastrá y soltá una imagen acá, o hacé clic para explorar"}
                  </span>
                  <span className="text-xs text-neutral-400">
                    Formatos soportados: PNG, JPG, WEBP (hasta 10MB)
                  </span>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                id="Images"
                className="sr-only"
                onChange={handleImageFileChange}
                disabled={isUploadingImage || isLoading}
              />
            </label>

            {formValues.imagen_url && (
              <div className="relative size-32 sm:size-36 shrink-0 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 shadow-2xs group">
                <img
                  src={formValues.imagen_url}
                  alt="Vista previa"
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[11px] font-bold text-white bg-black/60 px-2 py-1 rounded-md">
                    Imagen activa
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <ButtonLoader
          value={isEditMode ? "Guardar cambios" : "Crear producto"}
          loadingValue={
            isEditMode ? "Guardando cambios..." : "Creando producto..."
          }
          classNames="w-full bg-main-blue transition hover:bg-main-blue/90 text-white font-bold text-sm rounded-lg py-3 mt-6 shadow-2xs cursor-pointer"
          loaderColor="text-white"
          buttonType="submit"
          isLoading={isLoading || isUploadingImage}
        />
      </form>

      {isEditMode && (
        <div className="rounded-lg border border-red-200/80 bg-white p-5 sm:p-6 shadow-2xs">
          <h2 className="font-bold text-sm text-neutral-900">
            Ajustes delicados
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Eliminar el producto eliminará todas sus variaciones y promociones.
            Se recomienda desactivar el producto en su lugar.
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="mt-4 inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-main-red transition hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
          >
            {isDeleting ? "Eliminando..." : "Eliminar producto del catálogo"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductEditor;
