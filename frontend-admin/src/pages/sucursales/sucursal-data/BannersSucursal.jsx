// frontend-admin/src/pages/sucursales/sucursal-data/BannersSucursal.jsx
import React, { useEffect, useState, useMemo } from "react";
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
  RotateCcw,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
  Search,
  ShoppingBag,
  DollarSign,
  Percent,
  RefreshCw,
} from "lucide-react";
import { VITE_API_URL } from "../../../config/api";
import { useAuth } from "../../../context/AuthContext";
import { uploadImageToCloudinary } from "../../../utils/cloudinary";
import { formatMoney } from "../../../utils/formatters";
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
  const { authHeaders } = useAuth();
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(EMPTY_BANNER);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Estados de vista y filtros estilo Meta Ads
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'

  // Cargar banners con estadísticas
  const loadBanners = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${VITE_API_URL}/banners/admin`, {
        headers: authHeaders,
      });
      if (!res.ok) {
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

  // Métricas acumuladas globales
  const totalBanners = banners.length;
  const activeBanners = banners.filter((b) => b.activo).length;
  const inactiveBanners = totalBanners - activeBanners;

  const totalImpresiones = banners.reduce(
    (acc, b) => acc + (Number(b.impresiones) || 0),
    0
  );
  const totalClics = banners.reduce(
    (acc, b) => acc + (Number(b.clics) || 0),
    0
  );
  const totalPedidos = banners.reduce(
    (acc, b) => acc + (Number(b.pedidos_generados) || 0),
    0
  );
  const totalVentas = banners.reduce(
    (acc, b) => acc + (Number(b.ventas_totales) || 0),
    0
  );

  const globalCtr =
    totalImpresiones > 0
      ? ((totalClics / totalImpresiones) * 100).toFixed(2)
      : "0.00";

  const globalCvr =
    totalClics > 0 ? ((totalPedidos / totalClics) * 100).toFixed(2) : "0.00";

  // Banners filtrados según búsqueda y estado
  const filteredBanners = useMemo(() => {
    return banners.filter((b) => {
      // Filtro de estado
      if (statusFilter === "active" && !b.activo) return false;
      if (statusFilter === "inactive" && b.activo) return false;

      // Filtro de texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = b.titulo?.toLowerCase().includes(q);
        const matchSub = b.subtitulo?.toLowerCase().includes(q);
        const matchBadge = b.badge_texto?.toLowerCase().includes(q);
        const matchUrl = b.enlace_url?.toLowerCase().includes(q);
        if (!matchTitle && !matchSub && !matchBadge && !matchUrl) return false;
      }

      return true;
    });
  }, [banners, statusFilter, searchQuery]);

  // Reiniciar métricas de todos los banners
  const handleResetAllAnalytics = async () => {
    if (
      !window.confirm(
        `¿Confirmás reiniciar a CERO las métricas de todos los banners?\n\nActualmente hay ${totalImpresiones.toLocaleString(
          "es-AR"
        )} impresiones, ${totalClics.toLocaleString(
          "es-AR"
        )} clics y ${totalPedidos} pedidos atribuidos.\nEsta acción pondrá los contadores en 0 para medir desde cero en producción.`
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch(`${VITE_API_URL}/banners/reset-analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Error al reiniciar analíticas");
      }

      setSuccessMsg(
        "¡Analíticas de todos los banners reiniciadas a 0 con éxito!"
      );
      setTimeout(() => setSuccessMsg(null), 5000);
      await loadBanners();
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudieron reiniciar las analíticas.");
    } finally {
      setIsResetting(false);
    }
  };

  // Reiniciar métricas de un solo banner
  const handleResetSingleBanner = async (banner) => {
    if (
      !window.confirm(
        `¿Reiniciar métricas del banner "${banner.titulo || "Sin título"}" a 0?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `${VITE_API_URL}/banners/${banner.id}/reset-analytics`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
        }
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Error al reiniciar métricas del banner");
      }

      setSuccessMsg(
        `Métricas del banner "${banner.titulo || "ID #" + banner.id}" en cero.`
      );
      setTimeout(() => setSuccessMsg(null), 5000);
      await loadBanners();
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo reiniciar el banner.");
    }
  };

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

  // Toggle activo directo
  const handleToggleActivo = async (banner) => {
    try {
      const res = await fetch(`${VITE_API_URL}/banners/${banner.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ activo: !banner.activo }),
      });
      if (res.ok) {
        setBanners((prev) =>
          prev.map((b) =>
            b.id === banner.id ? { ...b, activo: !b.activo } : b
          )
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
        headers: authHeaders,
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
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(editingBanner),
      });

      if (!res.ok) {
        let errText = `Error ${res.status}: No se pudo guardar el banner.`;
        try {
          const errData = await res.json();
          if (errData?.error) errText = errData.error;
        } catch {}
        throw new Error(errText);
      }

      await loadBanners();
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error al procesar la solicitud.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ─── Cabecera Principal ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-main-blue border border-blue-100">
              <Layers className="size-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Consola de Anuncios & Banners
              </h1>
              <p className="text-xs text-neutral-500">
                Rendimiento de campañas, conversiones y clics en tiempo real estilo Meta Ads.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={isLoading}
            onClick={loadBanners}
            className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 shadow-2xs cursor-pointer active:scale-98 disabled:opacity-50"
            title="Refrescar métricas en tiempo real"
          >
            <RefreshCw className={`size-3.5 text-main-blue ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Actualizando..." : "Actualizar"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
              showAdvanced
                ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
                : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Opciones avanzadas</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-main-blue hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <Plus className="size-4" />
            <span>Nuevo Banner</span>
          </button>
        </div>
      </div>

      {/* ─── Mensaje de Feedback ─── */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-semibold text-emerald-800 flex items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-900 p-1 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* ─── Panel de Opciones Avanzadas (Reinicio de Analíticas) ─── */}
      {showAdvanced && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
                <RotateCcw className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-neutral-900">
                  Reinicio de Analíticas de Campañas
                </h3>
                <p className="text-xs text-neutral-600 mt-0.5 max-w-xl leading-relaxed">
                  Pone en cero las impresiones ({totalImpresiones.toLocaleString("es-AR")}), clics ({totalClics.toLocaleString("es-AR")}) y conversiones acumuladas en todos los banners.
                  Útil para limpiar datos de prueba y comenzar a medir interacciones reales limpias en producción.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isResetting || (totalImpresiones === 0 && totalClics === 0)}
              onClick={handleResetAllAnalytics}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all disabled:opacity-40 cursor-pointer shrink-0 active:scale-98"
            >
              <RotateCcw className={`size-4 ${isResetting ? "animate-spin" : ""}`} />
              <span>{isResetting ? "Reiniciando..." : "Reiniciar todas las métricas a 0"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Tarjetas de Rendimiento Global (KPIs Meta Ads) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Banners Activos */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Activos
            </span>
            <ImageIcon className="size-3.5 text-main-blue" />
          </div>
          <p className="text-xl font-black text-neutral-900">
            {activeBanners}{" "}
            <span className="text-xs font-normal text-neutral-400">
              / {totalBanners}
            </span>
          </p>
        </div>

        {/* Impresiones */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Alcance (Impr.)
            </span>
            <Eye className="size-3.5 text-purple-600" />
          </div>
          <p className="text-xl font-black text-neutral-900 font-mono">
            {totalImpresiones.toLocaleString("es-AR")}
          </p>
        </div>

        {/* Clics */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Resultados (Clics)
            </span>
            <MousePointerClick className="size-3.5 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-neutral-900 font-mono">
            {totalClics.toLocaleString("es-AR")}
          </p>
        </div>

        {/* CTR */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              CTR Global
            </span>
            <Percent className="size-3.5 text-amber-500" />
          </div>
          <p className="text-xl font-black text-neutral-900 font-mono">
            {globalCtr}%
          </p>
        </div>

        {/* Pedidos Atribuidos */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Compras Generadas
            </span>
            <ShoppingBag className="size-3.5 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-700 font-mono">
            {totalPedidos}
          </p>
        </div>

        {/* Ventas Atribuidas */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Ventas Atribuidas
            </span>
            <DollarSign className="size-3.5 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-neutral-900 font-mono">
            {formatMoney(totalVentas)}
          </p>
        </div>
      </div>

      {/* ─── Barra de Control: Filtros y Selector de Vista ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs">
        {/* Pestañas de Estado & Búsqueda */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg border border-neutral-200/60">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === "all"
                  ? "bg-white text-neutral-900 shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Todos ({totalBanners})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === "active"
                  ? "bg-white text-emerald-700 shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Activos ({activeBanners})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === "inactive"
                  ? "bg-white text-neutral-700 shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Pausados ({inactiveBanners})
            </button>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por título o badge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:border-main-blue"
            />
          </div>
        </div>

        {/* Selector de Vista: Tabla vs Cuadrícula */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <span className="text-[11px] font-medium text-neutral-400 mr-1 hidden sm:inline">
            Vista:
          </span>
          <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg border border-neutral-200/60">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Vista de Tabla Analítica (Estilo Meta Ads)"
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-main-blue shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <TableIcon className="size-3.5" />
              <span>Tabla Meta Ads</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Vista de Tarjetas Visuales"
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-main-blue shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <LayoutGrid className="size-3.5" />
              <span>Tarjetas</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── VISTA 1: TABLA DE RENDIMIENTO ESTILO META ADS ─── */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                  <th className="py-3 px-4 w-16 text-center">Estado</th>
                  <th className="py-3 px-4 min-w-[280px]">Anuncio / Campaña</th>
                  <th className="py-3 px-3 w-16 text-center">Orden</th>
                  <th className="py-3 px-4 text-right">Alcance (Impr.)</th>
                  <th className="py-3 px-4 text-right">Resultados (Clics)</th>
                  <th className="py-3 px-4 text-right">CTR</th>
                  <th className="py-3 px-4 text-right">Compras (Pedidos)</th>
                  <th className="py-3 px-4 text-right">Tasa Conv. (CVR)</th>
                  <th className="py-3 px-4 text-right">Ventas Atribuidas</th>
                  <th className="py-3 px-4 text-center w-28">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="10" className="py-12 text-center text-neutral-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="size-4 animate-spin text-main-blue" />
                        <span>Cargando analíticas de anuncios...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredBanners.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-10 text-center text-neutral-500">
                      No se encontraron banners con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredBanners.map((banner) => {
                    const impr = Number(banner.impresiones) || 0;
                    const clics = Number(banner.clics) || 0;
                    const pedidos = Number(banner.pedidos_generados) || 0;
                    const ventas = Number(banner.ventas_totales) || 0;

                    const ctrNum = impr > 0 ? (clics / impr) * 100 : 0;
                    const cvrNum = clics > 0 ? (pedidos / clics) * 100 : 0;

                    return (
                      <tr
                        key={banner.id}
                        className={`hover:bg-blue-50/30 transition-colors ${
                          !banner.activo ? "bg-neutral-50/50 opacity-70" : ""
                        }`}
                      >
                        {/* Switch de Estado estilo Meta */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActivo(banner)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              banner.activo ? "bg-emerald-600" : "bg-neutral-300"
                            }`}
                            title={banner.activo ? "Pausar anuncio" : "Activar anuncio"}
                          >
                            <span
                              className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                banner.activo ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </td>

                        {/* Anuncio / Creativo */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative size-12 sm:w-16 sm:h-10 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-900 shrink-0 group">
                              <img
                                src={banner.imagen_desktop_url}
                                alt={banner.titulo}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-bold text-neutral-900 truncate">
                                  {banner.titulo || "Sin título"}
                                </span>
                                {banner.badge_texto && (
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider shrink-0 ${
                                      BADGE_COLOR_OPTIONS.find(
                                        (c) => c.id === banner.badge_color
                                      )?.bg || "bg-main-red text-white"
                                    }`}
                                  >
                                    {banner.badge_texto}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                                {banner.subtitulo && (
                                  <span className="truncate max-w-[180px]">
                                    {banner.subtitulo}
                                  </span>
                                )}
                                {banner.enlace_url && (
                                  <span className="text-neutral-400 font-mono text-[10px] flex items-center gap-0.5 hover:text-main-blue">
                                    <ExternalLink className="size-2.5" />
                                    {banner.enlace_url}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Orden */}
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded font-mono font-bold text-[10px]">
                            #{banner.orden}
                          </span>
                        </td>

                        {/* Alcance (Impresiones) */}
                        <td className="py-3 px-4 text-right font-mono text-neutral-700">
                          {impr.toLocaleString("es-AR")}
                        </td>

                        {/* Resultados (Clics) */}
                        <td className="py-3 px-4 text-right font-mono font-black text-neutral-900">
                          {clics.toLocaleString("es-AR")}
                        </td>

                        {/* CTR */}
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                              ctrNum >= 3
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : ctrNum >= 1
                                ? "bg-blue-50 text-main-blue border border-blue-200"
                                : "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {ctrNum.toFixed(2)}%
                          </span>
                        </td>

                        {/* Compras Atribuidas */}
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                          {pedidos > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              <ShoppingBag className="size-3 text-emerald-600" />
                              {pedidos}
                            </span>
                          ) : (
                            <span className="text-neutral-300 font-normal">0</span>
                          )}
                        </td>

                        {/* Tasa Conversión (CVR) */}
                        <td className="py-3 px-4 text-right font-mono text-neutral-600">
                          {cvrNum > 0 ? `${cvrNum.toFixed(2)}%` : "-"}
                        </td>

                        {/* Ventas Atribuidas */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                          {ventas > 0 ? (
                            <span className="text-emerald-800">
                              {formatMoney(ventas)}
                            </span>
                          ) : (
                            <span className="text-neutral-300 font-normal">$0</span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleResetSingleBanner(banner)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Reiniciar analíticas de este banner a cero"
                            >
                              <RotateCcw className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(banner)}
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-main-blue hover:bg-neutral-100 transition-colors cursor-pointer"
                              title="Editar configuración del banner"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(banner.id)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Eliminar banner"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Fila Fija de Resumen / Totales (Estilo Meta Ads) */}
              {filteredBanners.length > 0 && (
                <tfoot>
                  <tr className="bg-neutral-100/90 border-t-2 border-neutral-300 font-bold text-neutral-900 text-xs">
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block size-2 rounded-full bg-emerald-500"></span>
                    </td>
                    <td className="py-3 px-4">
                      Total ({filteredBanners.length} banners)
                    </td>
                    <td className="py-3 px-3 text-center">-</td>
                    <td className="py-3 px-4 text-right font-mono">
                      {totalImpresiones.toLocaleString("es-AR")}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black">
                      {totalClics.toLocaleString("es-AR")}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-main-blue">
                      {globalCtr}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700">
                      {totalPedidos}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-neutral-700">
                      {globalCvr}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-800">
                      {formatMoney(totalVentas)}
                    </td>
                    <td className="py-3 px-4 text-center text-neutral-400 font-normal">
                      Acumulado
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      ) : (
        /* ─── VISTA 2: CUADRÍCULA DE TARJETAS VISUALES ─── */
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-2xs">
          <h2 className="text-base font-extrabold text-neutral-900 mb-4">
            Banners configurados ({filteredBanners.length})
          </h2>

          {filteredBanners.length === 0 ? (
            <div className="text-center p-10 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
              <p className="text-sm font-bold text-neutral-700">
                No se encontraron banners.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredBanners.map((banner) => {
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
                                (c) => c.id === banner.badge_color
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
                      <div className="grid grid-cols-4 gap-2 py-2 px-3 bg-neutral-50 rounded-lg text-center border border-neutral-100 text-xs font-mono">
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
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                            Ventas ($)
                          </span>
                          <span className="font-extrabold text-emerald-700 truncate block">
                            {formatMoney(banner.ventas_totales || 0)}
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
                            onClick={() => handleResetSingleBanner(banner)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Reiniciar métricas de este banner a cero"
                          >
                            <RotateCcw className="size-4" />
                          </button>
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
      )}

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
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
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
