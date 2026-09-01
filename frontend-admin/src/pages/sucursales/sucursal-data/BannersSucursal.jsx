// frontend-admin/src/pages/sucursales/sucursal-data/BannersSucursal.jsx
import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Plus,
  Eye,
  MousePointerClick,
  TrendingUp,
  Image as ImageIcon,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  UploadCloud,
  Loader2,
  X,
  ArrowRight,
  Layers,
} from "lucide-react";
import { VITE_API_URL } from "../../../config/api";
import { uploadImageToCloudinary } from "../../../utils/cloudinary";
import Input from "../../../components/ui/Input";
import ButtonLoader from "../../../components/ui/ButtonLoader";

const BADGE_COLOR_OPTIONS = [
  { id: "rojo", label: "Rojo (Oferta)", bg: "bg-red-500 text-white" },
  { id: "dorado", label: "Dorado (Club)", bg: "bg-amber-500 text-white" },
  {
    id: "amarillo",
    label: "Amarillo (Destacado)",
    bg: "bg-amber-400 text-neutral-900",
  },
  { id: "azul", label: "Azul (Institucional)", bg: "bg-main-blue text-white" },
  { id: "verde", label: "Verde (Descuento)", bg: "bg-emerald-600 text-white" },
  { id: "morado", label: "Morado (Especial)", bg: "bg-purple-600 text-white" },
  { id: "negro", label: "Negro (Premium)", bg: "bg-neutral-900 text-white" },
];

const EMPTY_BANNER = {
  id: null,
  titulo: "",
  subtitulo: "",
  imagen_desktop_url: "",
  imagen_mobile_url: "",
  enlace_url: "/productos",
  badge_texto: "",
  badge_color: "rojo",
  boton_texto: "Ver más",
  orden: 0,
  activo: true,
};

export default function BannersSucursal() {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(EMPTY_BANNER);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const loadBanners = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${VITE_API_URL}/banners/admin`);
      if (!res.ok) {
        // Fallback a /banners si admin no estuviera disponible
        const fallback = await fetch(`${VITE_API_URL}/banners`);
        const fbData = await fallback.json();
        setBanners(Array.isArray(fbData) ? fbData : []);
        return;
      }
      const data = await res.json();
      setBanners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar banners:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  // Métricas acumuladas
  const totalBanners = banners.length;
  const activeBanners = banners.filter((b) => b.activo).length;
  const totalImpresiones = banners.reduce(
    (acc, b) => acc + (Number(b.impresiones) || 0),
    0,
  );
  const totalClics = banners.reduce(
    (acc, b) => acc + (Number(b.clics) || 0),
    0,
  );
  const globalCtr =
    totalImpresiones > 0
      ? ((totalClics / totalImpresiones) * 100).toFixed(1)
      : "0.0";

  // Abrir modal para crear
  const handleOpenCreate = () => {
    setEditingBanner({
      ...EMPTY_BANNER,
      orden: banners.length + 1,
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  // Abrir modal para editar
  const handleOpenEdit = (banner) => {
    setEditingBanner({
      ...banner,
      subtitulo: banner.subtitulo || "",
      badge_texto: banner.badge_texto || "",
      badge_color: banner.badge_color || "rojo",
      boton_texto: banner.boton_texto || "Ver más",
      enlace_url: banner.enlace_url || "/productos",
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  // Toggle activo directo en tarjeta
  const handleToggleActivo = async (banner) => {
    try {
      const res = await fetch(`${VITE_API_URL}/banners/${banner.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !banner.activo }),
      });
      if (res.ok) {
        setBanners((prev) =>
          prev.map((b) =>
            b.id === banner.id ? { ...b, activo: !b.activo } : b,
          ),
        );
      }
    } catch (err) {
      console.error("Error toggling banner activo:", err);
    }
  };

  // Eliminar banner
  const handleDelete = async (id) => {
    if (
      !window.confirm("¿Seguro que querés eliminar este banner publicitario?")
    )
      return;
    try {
      const res = await fetch(`${VITE_API_URL}/banners/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error("Error al eliminar banner:", err);
    }
  };

  // Subir imagen a Cloudinary
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const url = await uploadImageToCloudinary(file);
      setEditingBanner((prev) => ({
        ...prev,
        imagen_desktop_url: url,
        imagen_mobile_url: url,
      }));
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al subir la imagen. Verificá Cloudinary.");
    } finally {
      setIsUploading(false);
    }
  };

  // Guardar (Crear o Editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingBanner.imagen_desktop_url) {
      setErrorMsg("La imagen del banner es obligatoria.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    const isEdit = Boolean(editingBanner.id);
    const url = isEdit
      ? `${VITE_API_URL}/banners/${editingBanner.id}`
      : `${VITE_API_URL}/banners`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingBanner),
      });

      if (!res.ok) {
        let errText = `Error ${res.status}: No se pudo guardar el banner. Verificá que el backend esté actualizado en Render.`;
        try {
          const errData = await res.json();
          if (errData?.error) errText = errData.error;
        } catch {}
        throw new Error(errText);
      }

      setModalOpen(false);
      loadBanners();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Encabezado y Métricas Principales ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-neutral-900 flex items-center gap-2">
            <Layers className="size-6 text-main-blue" />
            Gestión de Banners Publicitarios
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Administrá los anuncios y promociones que rotan en la portada de la
            tienda.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-main-blue hover:bg-main-blue/90 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="size-4" />
          <span>Nuevo Banner</span>
        </button>
      </div>

      {/* ─── Tarjetas de Estadísticas de Rendimiento ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Banners Activos
            </span>
            <ImageIcon className="size-4 text-main-blue" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900">
            {activeBanners}{" "}
            <span className="text-xs font-normal text-neutral-400">
              / {totalBanners}
            </span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Impresiones
            </span>
            <Eye className="size-4 text-purple-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900">
            {totalImpresiones.toLocaleString("es-AR")}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Clics Directos
            </span>
            <MousePointerClick className="size-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900">
            {totalClics.toLocaleString("es-AR")}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              CTR Promedio
            </span>
            <TrendingUp className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-neutral-900">
            {globalCtr}%
          </p>
        </div>
      </div>

      {/* ─── Listado de Banners en Carrusel ─── */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-2xs">
        <h2 className="text-base font-extrabold text-neutral-900 mb-4">
          Banners configurados ({banners.length})
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-sm text-neutral-400 animate-pulse">
            Cargando banners publicitarios...
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center p-10 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
            <p className="text-sm font-bold text-neutral-700">
              No hay banners creados aún.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-3 px-4 py-2 bg-main-blue text-white rounded-lg text-xs font-bold"
            >
              Crear primer banner
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {banners.map((banner) => {
              const ctr =
                banner.impresiones > 0
                  ? ((banner.clics / banner.impresiones) * 100).toFixed(1)
                  : "0.0";

              return (
                <div
                  key={banner.id}
                  className={`flex flex-col rounded-xl border overflow-hidden transition-all shadow-2xs ${
                    banner.activo
                      ? "border-neutral-200 bg-white"
                      : "border-neutral-200/60 bg-neutral-50/70 opacity-65"
                  }`}
                >
                  {/* Vista Previa Visual del Banner */}
                  <div className="relative aspect-video sm:aspect-[21/9] w-full overflow-hidden bg-neutral-900 group">
                    <img
                      src={banner.imagen_desktop_url}
                      alt={banner.titulo}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                      {banner.badge_texto && (
                        <span
                          className={`w-fit px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider mb-1.5 shadow ${
                            BADGE_COLOR_OPTIONS.find(
                              (c) => c.id === banner.badge_color,
                            )?.bg || "bg-main-red text-white"
                          }`}
                        >
                          {banner.badge_texto}
                        </span>
                      )}
                      <h3 className="text-white font-bold text-sm sm:text-base line-clamp-1">
                        {banner.titulo}
                      </h3>
                      {banner.subtitulo && (
                        <p className="text-neutral-300 text-xs line-clamp-1 mt-0.5">
                          {banner.subtitulo}
                        </p>
                      )}
                    </div>

                    {/* Badge de Orden */}
                    <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded">
                      Orden #{banner.orden}
                    </span>
                  </div>

                  {/* Detalles y Métricas de Rendimiento */}
                  <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                    <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-neutral-50 rounded-lg text-center border border-neutral-100 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                          Vistas
                        </span>
                        <span className="font-extrabold text-neutral-800">
                          {Number(banner.impresiones).toLocaleString("es-AR")}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                          Clics
                        </span>
                        <span className="font-extrabold text-neutral-800">
                          {Number(banner.clics).toLocaleString("es-AR")}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                          CTR
                        </span>
                        <span className="font-extrabold text-amber-600">
                          {ctr}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActivo(banner)}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors border ${
                            banner.activo
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-neutral-100 text-neutral-500 border-neutral-300 hover:bg-neutral-200"
                          }`}
                        >
                          {banner.activo ? "Visible en portada" : "Pausado"}
                        </button>

                        {banner.enlace_url && (
                          <span className="text-[11px] text-neutral-400 truncate max-w-[140px]">
                            {banner.enlace_url}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(banner)}
                          className="p-1.5 rounded-lg text-neutral-600 hover:text-main-blue hover:bg-neutral-100 transition-colors cursor-pointer"
                          title="Editar banner"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(banner.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar banner"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Modal de Creación / Edición de Banner ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 bg-neutral-50/50">
              <h3 className="font-extrabold text-base text-neutral-900 flex items-center gap-2">
                <Sparkles className="size-4 text-main-blue" />
                {editingBanner.id
                  ? "Editar Banner Publicitario"
                  : "Nuevo Banner para el Carrusel"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-bold text-red-700">
                  {errorMsg}
                </div>
              )}

              {/* Título y Subtítulo */}
              <div className="space-y-3">
                <Input
                  label="Título del banner"
                  id="titulo"
                  inputName="titulo"
                  placeholder="Ej: ¡Promo Asado Fin de Semana!"
                  value={editingBanner.titulo}
                  isRequired={true}
                  setOnChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      titulo: e.target.value,
                    })
                  }
                />

                <Input
                  label="Subtítulo descriptivo (opcional)"
                  id="subtitulo"
                  inputName="subtitulo"
                  placeholder="Ej: Cortes seleccionados con hasta 20% de descuento"
                  value={editingBanner.subtitulo}
                  isRequired={false}
                  setOnChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      subtitulo: e.target.value,
                    })
                  }
                />
              </div>

              {/* Configuración del Badge */}
              <div className="rounded-xl border border-neutral-200/80 p-4 bg-neutral-50/50 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Etiqueta / Badge Superior
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Texto de la etiqueta"
                    id="badge_texto"
                    inputName="badge_texto"
                    placeholder="Ej: 🔥 OFERTA, ⭐ CLUB VALETTE"
                    value={editingBanner.badge_texto}
                    isRequired={false}
                    setOnChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        badge_texto: e.target.value,
                      })
                    }
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Color de la etiqueta
                    </label>
                    <select
                      value={editingBanner.badge_color}
                      onChange={(e) =>
                        setEditingBanner({
                          ...editingBanner,
                          badge_color: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-bold text-neutral-800 focus:border-main-blue focus:outline-none"
                    >
                      {BADGE_COLOR_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Enlace y Botón */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Texto del botón CTA"
                  id="boton_texto"
                  inputName="boton_texto"
                  placeholder="Ej: Ver Ofertas, Comprar ahora"
                  value={editingBanner.boton_texto}
                  isRequired={false}
                  setOnChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      boton_texto: e.target.value,
                    })
                  }
                />

                <Input
                  label="URL de destino"
                  id="enlace_url"
                  inputName="enlace_url"
                  placeholder="Ej: /ofertas, /vacuno, /productos"
                  value={editingBanner.enlace_url}
                  isRequired={false}
                  setOnChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      enlace_url: e.target.value,
                    })
                  }
                />
              </div>

              {/* Carga de Imagen */}
              <div className="rounded-xl border border-neutral-200/80 p-4 bg-white space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                  Imagen del Banner (Recomendado: 3480 x 1100 px o panorámica)
                </label>

                <Input
                  label="URL directa de la imagen"
                  id="imagen_desktop_url"
                  inputName="imagen_desktop_url"
                  placeholder="https://images.unsplash.com/..."
                  value={editingBanner.imagen_desktop_url}
                  isRequired={true}
                  setOnChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      imagen_desktop_url: e.target.value,
                      imagen_mobile_url: e.target.value,
                    })
                  }
                />

                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors">
                  {isUploading ? (
                    <div className="flex items-center gap-2 text-main-blue text-xs font-bold">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Subiendo a Cloudinary...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-neutral-600 text-xs font-bold">
                      <UploadCloud className="size-4 text-main-blue" />
                      <span>
                        O hacé clic acá para subir una imagen desde tu equipo
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="sr-only"
                  />
                </label>
              </div>

              {/* Orden y Visibilidad */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <Input
                  label="Orden en el carrusel (1, 2, 3...)"
                  id="orden"
                  inputName="orden"
                  inputType="number"
                  placeholder="1"
                  value={editingBanner.orden}
                  isRequired={false}
                  setOnChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      orden: parseInt(e.target.value) || 0,
                    })
                  }
                />

                <label className="flex items-center gap-2 cursor-pointer mt-5">
                  <input
                    type="checkbox"
                    checked={editingBanner.activo}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        activo: e.target.checked,
                      })
                    }
                    className="size-4 rounded text-main-blue"
                  />
                  <span className="text-sm font-bold text-neutral-800">
                    Banner activo (visible)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <ButtonLoader
                  value={editingBanner.id ? "Guardar cambios" : "Crear banner"}
                  loadingValue="Guardando..."
                  classNames="px-5 py-2.5 bg-main-blue text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                  isLoading={isSaving || isUploading}
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
