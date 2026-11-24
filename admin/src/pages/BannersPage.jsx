// admin/src/pages/BannersPage.jsx
import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  UploadCloud,
  Loader2,
  RotateCcw,
  Eye,
  MousePointerClick,
  ShoppingBag,
  X,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import { VITE_API_URL } from "../config/api";
import { useAdmin } from "../context/AdminContext";
import { useAuth } from "../context/AuthContext";
import { uploadImageToCloudinary } from "../utils/cloudinary";
import { formatMoney } from "../utils/formatters";

const EMPTY_FORM = {
  id: null,
  titulo: "",
  subtitulo: "",
  imagen_desktop_url: "",
  imagen_mobile_url: "",
  enlace_url: "/#seccion-combos",
  badge_texto: "OFERTA VALETTE",
  badge_color: "rojo",
  boton_texto: "Ver oferta",
  orden: 0,
  activo: true,
};

export default function BannersPage() {
  const { showToast } = useAdmin();
  const { authHeaders } = useAuth();

  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState(null); // "desktop" | "mobile" | null

  const fetchBannersData = useCallback(async () => {
    const res = await fetch(`${VITE_API_URL}/banners/admin`, {
      headers: authHeaders,
    });
    if (!res.ok) throw new Error("No se pudieron obtener los banners.");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }, [authHeaders]);

  const loadBanners = async () => {
    setIsLoading(true);
    try {
      const data = await fetchBannersData();
      setBanners(data);
    } catch (err) {
      showToast(err.message || "Error al cargar banners.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchBannersData()
      .then((data) => {
        if (isMounted) setBanners(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [fetchBannersData]);

  const handleOpenCreate = () => {
    setForm({ ...EMPTY_FORM, orden: banners.length + 1 });
    setModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setForm({
      id: b.id,
      titulo: b.titulo || "",
      subtitulo: b.subtitulo || "",
      imagen_desktop_url: b.imagen_desktop_url || "",
      imagen_mobile_url: b.imagen_mobile_url || "",
      enlace_url: b.enlace_url || "/#seccion-combos",
      badge_texto: b.badge_texto || "",
      badge_color: b.badge_color || "rojo",
      boton_texto: b.boton_texto || "Ver oferta",
      orden: Number(b.orden) || 0,
      activo: b.activo !== false,
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (field, file) => {
    if (!file) return;
    setUploadingField(field);
    try {
      const url = await uploadImageToCloudinary(file);
      setForm((prev) => ({
        ...prev,
        [field === "desktop" ? "imagen_desktop_url" : "imagen_mobile_url"]: url,
      }));
      showToast("Imagen subida a Cloudinary correctamente.");
    } catch (err) {
      showToast(err.message || "Error al subir imagen.", "error");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.imagen_desktop_url.trim()) {
      showToast("Subí o pegá al menos la imagen Desktop del banner.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const isEdit = Boolean(form.id);
      const url = isEdit
        ? `${VITE_API_URL}/banners/${form.id}`
        : `${VITE_API_URL}/banners`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          titulo: form.titulo.trim() || "Promoción Valette",
          subtitulo: form.subtitulo.trim(),
          imagen_desktop_url: form.imagen_desktop_url.trim(),
          imagen_mobile_url:
            form.imagen_mobile_url.trim() || form.imagen_desktop_url.trim(),
          enlace_url: form.enlace_url.trim() || "/#seccion-combos",
          badge_texto: form.badge_texto.trim(),
          badge_color: form.badge_color,
          boton_texto: form.boton_texto.trim() || "Ver más",
          orden: Number(form.orden) || 0,
          activo: Boolean(form.activo),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo guardar el banner.");

      showToast(isEdit ? "Banner actualizado." : "Banner creado con éxito.");
      setModalOpen(false);
      await loadBanners();
    } catch (err) {
      showToast(err.message || "Error al guardar banner.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActivo = async (b) => {
    const nextActivo = !b.activo;
    setBanners((prev) =>
      prev.map((item) => (item.id === b.id ? { ...item, activo: nextActivo } : item))
    );
    try {
      const res = await fetch(`${VITE_API_URL}/banners/${b.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ activo: nextActivo }),
      });
      if (!res.ok) throw new Error();
      showToast(`Banner "${b.titulo}" ${nextActivo ? "activado" : "pausado"}.`);
    } catch {
      await loadBanners();
      showToast("Error al actualizar estado del banner.", "error");
    }
  };

  const handleDelete = async (b) => {
    if (!window.confirm(`¿Eliminar el banner "${b.titulo}"?`)) return;
    try {
      const res = await fetch(`${VITE_API_URL}/banners/${b.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error();
      setBanners((prev) => prev.filter((item) => item.id !== b.id));
      showToast("Banner eliminado correctamente.");
    } catch {
      showToast("No se pudo eliminar el banner.", "error");
    }
  };

  const handleResetAllAnalytics = async () => {
    if (
      !window.confirm(
        "¿Reiniciar a 0 las impresiones, clics y ventas atribuidas de TODOS los banners?"
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`${VITE_API_URL}/banners/reset-analytics`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error();
      showToast("Métricas de todos los banners reiniciadas a cero.");
      await loadBanners();
    } catch {
      showToast("Error al reiniciar métricas.", "error");
    }
  };

  const handleResetSingleAnalytics = async (b) => {
    try {
      const res = await fetch(
        `${VITE_API_URL}/banners/${b.id}/reset-analytics`,
        {
          method: "POST",
          headers: authHeaders,
        }
      );
      if (!res.ok) throw new Error();
      showToast(`Métricas de "${b.titulo}" reiniciadas.`);
      await loadBanners();
    } catch {
      showToast("Error al reiniciar métricas del banner.", "error");
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Banners de Portada & Rendimiento
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestioná el carrusel principal de la tienda (Desktop + Mobile) y medí
            impresiones, clics, CTR y ventas atribuidas.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadBanners}
            disabled={isLoading}
            className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer shadow-xs"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleResetAllAnalytics}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resetear Métricas</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#002244] hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Banner</span>
          </button>
        </div>
      </div>

      {/* Grilla de Banners */}
      {banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-xs text-slate-400">
          Todavía no hay banners cargados en PostgreSQL. Creá el primero para la portada.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col"
            >
              <div className="relative h-44 bg-slate-900 overflow-hidden">
                <img
                  src={b.imagen_desktop_url || b.imagen_mobile_url}
                  alt={b.titulo}
                  className="w-full h-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase">
                      Orden #{b.orden ?? 0} {b.badge_texto ? `· ${b.badge_texto}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleActivo(b)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black cursor-pointer ${
                        b.activo
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-700 text-slate-200"
                      }`}
                    >
                      {b.activo ? "ACTIVO" : "PAUSADO"}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white leading-tight">
                      {b.titulo}
                    </h3>
                    {b.subtitulo && (
                      <p className="text-xs text-slate-200 line-clamp-1 mt-0.5">
                        {b.subtitulo}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Métricas en vivo */}
              <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 text-center py-2.5 bg-slate-50/70">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
                    <Eye className="w-3 h-3" /> Vistas
                  </span>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    {b.impresiones || 0}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
                    <MousePointerClick className="w-3 h-3" /> Clics
                  </span>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    {b.clics || 0}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">
                    CTR
                  </span>
                  <span className="text-sm font-black text-[#002244] font-mono">
                    {Number(b.ctr || 0).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
                    <ShoppingBag className="w-3 h-3" /> Ventas
                  </span>
                  <span className="text-xs font-black text-emerald-700 font-mono">
                    {b.pedidos_generados || 0} ({formatMoney(b.ventas_totales || 0)})
                  </span>
                </div>
              </div>

              <div className="p-3 flex items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-slate-500 truncate">
                  Destino: <b className="text-slate-700">{b.enlace_url || "/"}</b>
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleResetSingleAnalytics(b)}
                    title="Resetear métricas de este banner"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(b)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(b)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                    title="Eliminar banner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Editor de Banner */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4"
          onClick={() => !isSaving && setModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="text-base font-black text-slate-900">
                {form.id ? "Editar Banner" : "Nuevo Banner Publicitario"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Título Principal *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="ej: ¡Promo Asado Fin de Semana!"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:bg-white focus:border-[#002244]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Subtítulo / Bajada
                  </label>
                  <input
                    type="text"
                    value={form.subtitulo}
                    onChange={(e) =>
                      setForm({ ...form, subtitulo: e.target.value })
                    }
                    placeholder="ej: Llevando 3 kg congelás precio mayorista"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-[#002244]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Etiqueta / Badge
                  </label>
                  <input
                    type="text"
                    value={form.badge_texto}
                    onChange={(e) =>
                      setForm({ ...form, badge_texto: e.target.value })
                    }
                    placeholder="🔥 OFERTA WEB"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-[#002244]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Texto del Botón
                  </label>
                  <input
                    type="text"
                    value={form.boton_texto}
                    onChange={(e) =>
                      setForm({ ...form, boton_texto: e.target.value })
                    }
                    placeholder="Ver promo"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-[#002244]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Destino al hacer clic
                  </label>
                  <select
                    value={form.enlace_url}
                    onChange={(e) =>
                      setForm({ ...form, enlace_url: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:bg-white focus:border-[#002244]"
                  >
                    <option value="/#seccion-combos">Sección Combos</option>
                    <option value="/#seccion-asado">Sección Asado</option>
                    <option value="/#seccion-vacuno">Cortes Vacunos</option>
                    <option value="/#seccion-cerdo">Cortes de Cerdo</option>
                    <option value="/#seccion-pollo">Pollo & Granja</option>
                    <option value="/#seccion-preparados">Preparados Caseros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Orden en el Carrusel
                  </label>
                  <input
                    type="number"
                    value={form.orden}
                    onChange={(e) => setForm({ ...form, orden: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold outline-none focus:bg-white focus:border-[#002244]"
                  />
                </div>
              </div>

              {/* Dual Cloudinary Upload: Desktop + Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  {
                    key: "desktop",
                    label: "Imagen Desktop (16:9) *",
                    field: "imagen_desktop_url",
                  },
                  {
                    key: "mobile",
                    label: "Imagen Mobile (4:5)",
                    field: "imagen_mobile_url",
                  },
                ].map((slot) => (
                  <div
                    key={slot.key}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <span className="font-bold text-slate-700 block">
                      {slot.label}
                    </span>
                    {form[slot.field] ? (
                      <div className="relative h-28 rounded-xl overflow-hidden bg-slate-200">
                        <img
                          src={form[slot.field]}
                          alt={slot.label}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, [slot.field]: "" })}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/70 text-white cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-28 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon className="w-5 h-5 mb-1" />
                        <span className="text-[10px]">Sin imagen</span>
                      </div>
                    )}
                    <label className="w-full py-2 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                      {uploadingField === slot.key ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Subiendo...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Subir a Cloudinary</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={Boolean(uploadingField)}
                        onChange={(e) =>
                          handleImageUpload(slot.key, e.target.files?.[0])
                        }
                      />
                    </label>
                    <input
                      type="text"
                      value={form[slot.field]}
                      onChange={(e) =>
                        setForm({ ...form, [slot.field]: e.target.value })
                      }
                      placeholder="o pegá URL https://..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono outline-none"
                    />
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-2 font-bold text-slate-700 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="rounded"
                />
                <span>Banner visible en la portada de la tienda</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || Boolean(uploadingField)}
                  className="px-5 py-2 rounded-xl bg-[#c53030] hover:bg-[#a82525] text-white font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? "Guardando..." : "Guardar Banner"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
