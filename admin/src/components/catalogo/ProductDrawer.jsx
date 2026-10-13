// admin/src/components/catalogo/ProductDrawer.jsx
import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Check,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useModalBehavior } from "../../hooks/useModalBehavior";
import { uploadImageToCloudinary } from "../../utils/cloudinary";

function getInitialFormData(product) {
  if (product) {
    const promos = Array.isArray(product.promos) ? product.promos : [];
    const firstPromo = promos[0] || {};

    return {
      id: product.id,
      nombre_producto: product.nombre_producto || "",
      slug: product.slug || "",
      categoria: product.categoria || "vacuno",
      especie: product.especie || product.categoria || "vacuno",
      unidad_medida: product.unidad_medida || "kg",
      descripcion: product.descripcion || "",
      precio: product.precio != null ? String(product.precio) : "",
      precio_anterior:
        product.precio_anterior != null ? String(product.precio_anterior) : "0",
      badge: product.badge || "",
      rinde_personas: product.rinde_personas || "",
      metodos_coccion: Array.isArray(product.metodos_coccion)
        ? product.metodos_coccion
        : ["Parrilla", "Horno"],
      opciones_corte: Array.isArray(product.opciones_corte)
        ? product.opciones_corte
        : [],
      sin_stock: Boolean(product.sin_stock),
      activo: product.activo !== false,
      imagen_url: product.imagen_url || "",
      promo_min: firstPromo.cantidad_kg || firstPromo.cantidad_minima
        ? String(firstPromo.cantidad_kg || firstPromo.cantidad_minima)
        : "",
      promo_precio: firstPromo.precio_promocional
        ? String(firstPromo.precio_promocional)
        : "",
    };
  }

  return {
    nombre_producto: "",
    slug: "",
    categoria: "vacuno",
    especie: "vacuno",
    unidad_medida: "kg",
    descripcion: "",
    precio: "",
    precio_anterior: "0",
    badge: "",
    rinde_personas: "2 a 3 personas x kg",
    metodos_coccion: ["Parrilla", "Horno"],
    opciones_corte: ["Pieza Entera", "Corte Grueso"],
    sin_stock: false,
    activo: true,
    imagen_url: "",
    promo_min: "",
    promo_precio: "",
  };
}

function ProductDrawerContent({ product, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState(() => getInitialFormData(product));
  const [newCorteInput, setNewCorteInput] = useState("");

  // Estados de Drag & Drop y Subida de Imagen a Cloudinary
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Manejo de drag & drop de imágenes
  const processImageFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("El archivo debe ser una imagen válida (PNG, JPG, WEBP).");
      return;
    }

    setIsUploadingImage(true);
    setImageError(null);

    try {
      const optimizedUrl = await uploadImageToCloudinary(file);
      setFormData((prev) => ({
        ...prev,
        imagen_url: optimizedUrl,
      }));
    } catch (err) {
      console.error("Error al subir imagen:", err);
      setImageError(err.message || "Error al subir la imagen a Cloudinary.");
    } finally {
      setIsUploadingImage(false);
    }
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
    if (file) {
      await processImageFile(file);
    }
  };

  const handleFileInputChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await processImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imagen_url: "" }));
    setImageError(null);
  };

  // Manejo de tags de opciones de corte
  const handleAddCorte = (e) => {
    e.preventDefault();
    const val = newCorteInput.trim();
    if (!val) return;
    if (!formData.opciones_corte.includes(val)) {
      setFormData((prev) => ({
        ...prev,
        opciones_corte: [...prev.opciones_corte, val],
      }));
    }
    setNewCorteInput("");
  };

  const handleRemoveCorte = (index) => {
    setFormData((prev) => ({
      ...prev,
      opciones_corte: prev.opciones_corte.filter((_, i) => i !== index),
    }));
  };

  // Manejo de métodos de cocción
  const toggleCoccion = (metodo) => {
    setFormData((prev) => {
      const exists = prev.metodos_coccion.includes(metodo);
      return {
        ...prev,
        metodos_coccion: exists
          ? prev.metodos_coccion.filter((m) => m !== metodo)
          : [...prev.metodos_coccion, metodo],
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre_producto.trim()) {
      alert("Por favor ingrese el nombre del producto.");
      return;
    }
    if (!formData.precio || Number(formData.precio) <= 0) {
      alert("Por favor ingrese un precio válido mayor a 0.");
      return;
    }

    onSave(formData);
  };

  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    true,
    onClose
  );

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white w-full sm:max-w-xl md:max-w-2xl rounded-t-4xl sm:rounded-3xl shadow-2xl h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 border border-slate-200/80"
      >
        {/* Zona táctil de arrastre (barra + header superior) */}
        <div {...dragHandleProps} className="touch-none select-none shrink-0">
          {/* Barra táctil para deslizar en celulares */}
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-3 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />

          {/* Header Superior del Modal */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-b border-slate-100 bg-white">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {product ? "Editor de Catálogo" : "Nuevo Ingreso"}
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {product ? product.nombre_producto : "Nuevo Producto / Corte"}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Cerrar"
              className="size-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center font-bold transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-xs"
        >
          {/* 1. Descripción del producto */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
              1. Descripción del producto
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  name="nombre_producto"
                  value={formData.nombre_producto}
                  onChange={handleChange}
                  required
                  placeholder="ej: Asado de Tira Especial"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#002244] outline-none font-bold text-slate-900 text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Categoría / Especie
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      categoria: val,
                      especie: val === "almacen" ? "general" : val,
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#002244] outline-none font-bold text-slate-900 transition-colors"
                >
                  <option value="vacuno">Vacuno (Carne Vacuna)</option>
                  <option value="cerdo">Cerdo (Cortes y Embutidos)</option>
                  <option value="pollo">Pollo / Granja</option>
                  <option value="preparados">Preparados / Elaborados</option>
                  <option value="almacen">Almacén y Condimentos</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tipo de Venta (Unidad de Medida)
                </label>
                <select
                  name="unidad_medida"
                  value={formData.unidad_medida}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#002244] outline-none font-bold text-slate-900 transition-colors"
                >
                  <option value="kg">Por Kilogramo (kg)</option>
                  <option value="u">Por Unidad (u)</option>
                </select>
              </div>
            </div>

            {/* Plain text description - Concisa y directa (NO wysiwyg) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Descripción Corta del Corte
              </label>
              <textarea
                name="descripcion"
                rows={3}
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="ej: Costillar de novillito con hueso plano y veteado parejo. Clásico para hacer a la cruz o sobre brasas lentas."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#002244] outline-none text-xs leading-relaxed font-medium text-slate-900 transition-colors"
              />
            </div>
          </div>

          {/* 2. Precios & Promociones */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
              2. Precios & Promociones
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Precio Actual ($) *
                </label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  required
                  placeholder="12900"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#002244] font-black text-slate-900 text-sm font-num outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Precio Anterior ($)
                </label>
                <input
                  type="number"
                  name="precio_anterior"
                  value={formData.precio_anterior}
                  onChange={handleChange}
                  placeholder="0 (si no hay descuento)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#002244] outline-none font-medium text-slate-500 font-num transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Badge de Cabecera
                </label>
                <input
                  type="text"
                  name="badge"
                  value={formData.badge}
                  onChange={handleChange}
                  placeholder="ej: 🔥 Parrilla Tradición"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#002244] outline-none font-medium text-slate-900 transition-colors"
                />
              </div>
            </div>

            {/* Escala por volumen */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  Promoción por Volumen (Escala)
                </span>
                <span className="text-[10px] text-slate-400">
                  Aplica descuento automático llevando cantidad mínima
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Llevando desde (cantidad)
                  </label>
                  <input
                    type="number"
                    name="promo_min"
                    value={formData.promo_min}
                    onChange={handleChange}
                    placeholder="ej: 3"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-num font-bold text-slate-900 outline-none focus:border-[#002244]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Precio promocional c/u ($)
                  </label>
                  <input
                    type="number"
                    name="promo_precio"
                    value={formData.promo_precio}
                    onChange={handleChange}
                    placeholder="ej: 11900"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-num font-bold text-slate-900 outline-none focus:border-[#002244]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Fotografía del Producto (Drag & Drop + Preview + Cloudinary) */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                3. Fotografía del Producto (Cloudinary)
              </div>
              {formData.imagen_url && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="size-3" />
                  <span>Quitar foto</span>
                </button>
              )}
            </div>

            {imageError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2 font-medium">
                <AlertCircle className="size-4 shrink-0" />
                <span>{imageError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch gap-3.5">
              {/* Dropzone interactivo */}
              <label
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition-all cursor-pointer select-none min-h-[140px] ${
                  isDragging
                    ? "border-[#002244] bg-blue-50/70 ring-4 ring-[#002244]/10 scale-[1.01]"
                    : "border-slate-300 hover:border-[#002244]/60 hover:bg-slate-50/80 bg-slate-50/50"
                } ${
                  isUploadingImage || isSaving
                    ? "pointer-events-none opacity-60"
                    : ""
                }`}
              >
                {isUploadingImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="size-7 text-[#002244] animate-spin" />
                    <span className="text-xs font-bold text-slate-800">
                      Subiendo foto a Cloudinary...
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Optimizando formato WebP inteligente
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center transition-colors ${
                        isDragging
                          ? "bg-[#002244] text-white"
                          : "bg-white text-slate-600 border border-slate-200 shadow-2xs"
                      }`}
                    >
                      <UploadCloud className="size-5" />
                    </div>
                    <span className="mt-0.5 text-xs font-bold text-slate-800">
                      {isDragging
                        ? "¡Soltá la foto acá!"
                        : "Arrastrá y soltá una foto acá, o hacé clic para explorar"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Formatos: PNG, JPG, WEBP (hasta 10MB)
                    </span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileInputChange}
                  disabled={isUploadingImage || isSaving}
                />
              </label>

              {/* Vista previa de la foto actual */}
              {formData.imagen_url ? (
                <div className="relative size-32 sm:size-36 shrink-0 rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 shadow-2xs group self-center sm:self-auto">
                  <img
                    src={formData.imagen_url}
                    alt="Vista previa"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400";
                    }}
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                    <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-md">
                      Foto activa
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-[10px] font-black text-rose-300 hover:text-white"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="size-32 sm:size-36 shrink-0 rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-300 gap-1 self-center sm:self-auto">
                  <ImageIcon className="size-6 stroke-[1.5]" />
                  <span className="text-[10px] font-medium text-slate-400">
                    Sin foto
                  </span>
                </div>
              )}
            </div>

            {/* Input secundario para pegar URL directa */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                O ingresá la URL directa de la imagen (opcional)
              </label>
              <input
                type="text"
                name="imagen_url"
                value={formData.imagen_url}
                onChange={handleChange}
                placeholder="https://res.cloudinary.com/ylrkjlsv/..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 text-xs font-mono focus:bg-white focus:border-[#002244] transition-colors"
              />
            </div>
          </div>

          {/* 4. Carnicería: Opciones de Corte & Métodos de Cocción */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
              4. Opciones de Corte & Cocción
            </div>

            {/* Tags de opciones de corte */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Opciones de Corte Disponibles
              </label>
              <p className="text-[10px] text-slate-400 mb-2">
                El cliente podrá elegir cómo desea que el carnicero prepare el corte al pedir online.
              </p>

              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {formData.opciones_corte.map((corte, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold"
                  >
                    <span>{corte}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCorte(idx)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCorteInput}
                  onChange={(e) => setNewCorteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCorte(e);
                    }
                  }}
                  placeholder="ej: Tiras Tradicionales (4 cm), Corte Mariposa..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-[#002244]"
                />
                <button
                  type="button"
                  onClick={handleAddCorte}
                  className="px-3.5 py-2 bg-[#002244] hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Métodos de cocción y Rinde */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Métodos de Cocción Sugeridos
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  {["Parrilla", "Horno", "Cacerola", "Sartén", "Asador"].map(
                    (m) => {
                      const checked = formData.metodos_coccion.includes(m);
                      return (
                        <label
                          key={m}
                          className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800 text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCoccion(m)}
                            className="rounded text-[#002244]"
                          />
                          <span>{m}</span>
                        </label>
                      );
                    }
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Rinde Estimado de Porciones
                </label>
                <input
                  type="text"
                  name="rinde_personas"
                  value={formData.rinde_personas}
                  onChange={handleChange}
                  placeholder="ej: 2 a 3 personas x kg"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-900 focus:bg-white focus:border-[#002244] transition-colors"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Guía útil para el cliente en el modal de detalle del producto.
                </p>
              </div>
            </div>
          </div>

          {/* 5. Stock & Visibilidad en Mostrador */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
              5. Stock & Visibilidad en Mostrador
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">
                    Disponibilidad en Mostrador
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Pausar si el corte se agotó físicamente
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!formData.sin_stock}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sin_stock: !e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">
                    Publicado en la Tienda
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Visibilidad general en catálogo
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#002244]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="pt-4 border-t border-slate-100 bg-slate-50/50 -mx-5 -mb-5 sm:-mx-7 sm:-mb-7 p-4 sm:p-5 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isUploadingImage}
              className="px-4 py-2.5 text-slate-500 hover:text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving || isUploadingImage}
              className="px-6 py-2.5 bg-[#c53030] hover:bg-[#a82525] text-white rounded-xl font-black text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              <Check className="size-4 stroke-[2.5]" />
              <span>
                {isSaving
                  ? "Guardando..."
                  : product
                  ? "Guardar Cambios"
                  : "Crear Producto"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProductDrawer({
  isOpen,
  onClose,
  product,
  onSave,
  isSaving,
}) {
  if (!isOpen) return null;

  return (
    <ProductDrawerContent
      key={product?.id ?? "nuevo"}
      product={product}
      onClose={onClose}
      onSave={onSave}
      isSaving={isSaving}
    />
  );
}
