// admin/src/components/catalogo/ProductDrawer.jsx
import { useState } from "react";
import { X, Plus, Check, Image as ImageIcon } from "lucide-react";
import { useModalBehavior } from "../../hooks/useModalBehavior";

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
        : [],
      opciones_corte: Array.isArray(product.opciones_corte)
        ? product.opciones_corte
        : [],
      sin_stock: Boolean(product.sin_stock),
      activo: product.activo !== false,
      imagen_url: product.imagen_url || "",
      promo_min: firstPromo.cantidad_minima
        ? String(firstPromo.cantidad_minima)
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
    rinde_personas: "Rinde 3 a 4 personas",
    metodos_coccion: ["Parrilla", "Horno"],
    opciones_corte: ["Pieza Entera", "Corte Grueso"],
    sin_stock: false,
    activo: true,
    imagen_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400",
    promo_min: "",
    promo_precio: "",
  };
}

function ProductDrawerContent({ product, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState(() => getInitialFormData(product));
  const [newCorteInput, setNewCorteInput] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
        className="bg-white w-full sm:max-w-xl md:max-w-2xl rounded-t-4xl sm:rounded-3xl shadow-2xl h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
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
          {/* 1. Identificación y Unidad */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1">
              1. Descripción del producto
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre del Corte *
                </label>
                <input
                  type="text"
                  name="nombre_producto"
                  value={formData.nombre_producto}
                  onChange={handleChange}
                  required
                  placeholder="ej: Asado de Tira Especial"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
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
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:border-brand-navy outline-none bg-white font-medium"
                >
                  <option value="vacuno">Vacuno (Carne Vacuna)</option>
                  <option value="cerdo">Cerdo (Cortes y Embutidos)</option>
                  <option value="pollo">Pollo / Granja</option>
                  <option value="preparados">Preparados / Elaborados</option>
                  <option value="almacen">Almacén y Condimentos</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tipo de Venta (Unidad de Medida)
                </label>
                <select
                  name="unidad_medida"
                  value={formData.unidad_medida}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:border-brand-navy outline-none bg-white font-medium"
                >
                  <option value="kg">Por Kilogramo (kg)</option>
                  <option value="u">Por Unidad (u)</option>
                </select>
              </div>
            </div>

            {/* Plain text description - NO WYSIWYG */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-semibold text-slate-700">
                  Descripción Corta *
                </label>
              </div>
              <textarea
                name="descripcion"
                rows={2}
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="ej: Corte clásico con hueso, tierno y con el balance justo de grasa para dorar a la parrilla."
                className="w-full min-h-35 px-3 py-2 border border-slate-300 rounded focus:border-brand-navy focus:ring-1 focus:ring-brand-navy outline-none text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* 2. Precios & Promociones */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1">
              2. Precios & Promociones
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Precio Actual ($) *
                </label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  required
                  placeholder="12900"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:border-brand-navy font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Precio Anterior ($)
                </label>
                <input
                  type="number"
                  name="precio_anterior"
                  value={formData.precio_anterior}
                  onChange={handleChange}
                  placeholder="0 (si no hay descuento)"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:border-brand-navy outline-none text-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Badge de Cabecera (Opcional)
                </label>
                <input
                  type="text"
                  name="badge"
                  value={formData.badge}
                  onChange={handleChange}
                  placeholder="ej: SUPER OFERTA, DESTACADO"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:border-brand-navy outline-none"
                />
              </div>
            </div>

            {/* Escala por volumen */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">
                  Promoción por Volumen (Escala)
                </span>
                <span className="text-[10px] text-slate-400">
                  Aplica descuento automático llevando cantidad mínima
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">
                    Llevando desde (cantidad)
                  </label>
                  <input
                    type="number"
                    name="promo_min"
                    value={formData.promo_min}
                    onChange={handleChange}
                    placeholder="ej: 5"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">
                    Precio promocional c/u ($)
                  </label>
                  <input
                    type="number"
                    name="promo_precio"
                    value={formData.promo_precio}
                    onChange={handleChange}
                    placeholder="ej: 1400"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Carnicería: Opciones de Corte (VPS JSONB) */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center justify-between">
              <span>3. Especificaciones de Carnicería (VPS)</span>
              <span className="text-[10px] font-normal text-slate-400 font-mono">
                opciones_corte jsonb
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-semibold text-slate-700">
                  Opciones de Preparación para el Cliente
                </label>
                <span className="text-[10px] text-slate-400">
                  Si se deja vacío (ej: chorizos), no pedirá preparación en la
                  app
                </span>
              </div>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-md min-h-[44px] mb-2">
                {formData.opciones_corte.length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic">
                    Sin opciones cargadas. El cliente no verá selector de
                    preparación.
                  </span>
                ) : (
                  formData.opciones_corte.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-800 text-[11px] font-medium shadow-2xs"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCorte(idx)}
                        className="text-slate-400 hover:text-red-600 font-bold ml-1 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Input para agregar opción */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCorteInput}
                  onChange={(e) => setNewCorteInput(e.target.value)}
                  placeholder="Escribí una opción (ej: Corte Bandera, En bifes finos)..."
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg outline-none focus:border-brand-navy text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCorte(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCorte}
                  className="px-3 py-1.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar
                </button>
              </div>

              {/* Atajos rápidos táctiles para carnicero */}
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[10px] font-bold text-slate-400 mr-1 self-center">
                  Atajos:
                </span>
                {[
                  "Corte Bandera",
                  "Tiras Gruesas",
                  "Pieza Entera",
                  "Finitas p/ Milanesa",
                  "En 2 bolsitas",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (!formData.opciones_corte.includes(preset)) {
                        setFormData((prev) => ({
                          ...prev,
                          opciones_corte: [...prev.opciones_corte, preset],
                        }));
                      }
                    }}
                    className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-semibold cursor-pointer transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Métodos de cocción y rinde */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Métodos de Cocción Sugeridos
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2.5 rounded border border-slate-200">
                  {["Parrilla", "Horno", "Cacerola", "Sartén"].map((m) => {
                    const checked = formData.metodos_coccion.includes(m);
                    return (
                      <label
                        key={m}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCoccion(m)}
                          className="rounded text-brand-navy"
                        />
                        <span>{m}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rinde Estimado de Porciones
                </label>
                <input
                  type="text"
                  name="rinde_personas"
                  value={formData.rinde_personas}
                  onChange={handleChange}
                  placeholder="ej: Rinde 3 a 4 personas"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:border-brand-navy outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Guía útil para el cliente en el modal de detalle.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Stock & Visibilidad en Mostrador */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1">
              4. Stock & Visibilidad en Mostrador
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">
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
                  <div className="font-semibold text-slate-800">
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
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-navy"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 5. Fotografía */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1">
              5. Fotografía del Corte
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                {formData.imagen_url ? (
                  <img
                    src={formData.imagen_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400";
                    }}
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <label className="block font-semibold text-slate-700 mb-1">
                  URL de la Imagen (Cloudinary / CDN)
                </label>
                <input
                  type="text"
                  name="imagen_url"
                  value={formData.imagen_url}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded outline-none text-slate-600 focus:border-brand-navy text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="pt-4 border-t border-slate-100 bg-slate-50/50 -mx-5 -mb-5 sm:-mx-7 sm:-mb-7 p-4 sm:p-5 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 text-slate-500 hover:text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#c53030] hover:bg-[#a82525] text-white rounded-xl font-black text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              <Check className="size-4 stroke-[2.5]" />
              <span>{isSaving ? "Guardando..." : "Guardar Cambios"}</span>
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
