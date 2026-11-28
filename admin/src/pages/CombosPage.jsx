// admin/src/pages/CombosPage.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Edit3,
  Scale,
  Sparkles,
  Layers,
  AlertTriangle,
  X,
} from "lucide-react";
import { VITE_API_URL } from "../config/api";
import { useAdmin } from "../context/AdminContext";
import { useAuth } from "../context/AuthContext";
import { formatMoney } from "../utils/formatters";
import ComboModal from "../components/combos/ComboModal";

const DEFAULT_COMBO_IMAGE =
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop";

export default function CombosPage() {
  const { showToast } = useAdmin();
  const { authHeaders } = useAuth();

  const [combos, setCombos] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  // Modal de Creación / Edición
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal de Confirmación de Eliminación
  const [deletingCombo, setDeletingCombo] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCombosList = useCallback(async () => {
    const res = await fetch(`${VITE_API_URL}/combos?incluir_inactivos=true`);
    if (!res.ok) {
      throw new Error("No se pudo cargar la lista de combos.");
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }, []);

  const loadCombos = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const items = await fetchCombosList();
      setCombos(items);
    } catch (err) {
      console.error("Error al obtener combos:", err);
      showToast("Error de conexión al cargar combos del servidor.", "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      fetch(`${VITE_API_URL}/catalogo?incluir_promos_inactivas=true`).then((r) =>
        r.ok ? r.json() : [],
      ),
      fetchCombosList(),
    ])
      .then(([catData, combosData]) => {
        if (!isMounted) return;
        setCatalogProducts(Array.isArray(catData) ? catData : []);
        setCombos(combosData);
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Error inicializando CombosPage:", err);
          showToast("Error de conexión al cargar combos.", "error");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fetchCombosList, showToast]);

  // Filtrado de combos por búsqueda y estado
  const filteredCombos = useMemo(() => {
    return combos.filter((c) => {
      if (statusFilter === "activos" && !c.activo) return false;
      if (statusFilter === "pausados" && c.activo) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();

      const matchNombre = c.nombre?.toLowerCase().includes(q);
      const matchBadge = c.badge?.toLowerCase().includes(q);
      const matchDesc = c.descripcion?.toLowerCase().includes(q);
      const matchItems =
        Array.isArray(c.items) &&
        c.items.some(
          (it) =>
            it.nombre?.toLowerCase().includes(q) ||
            it.categoria?.toLowerCase().includes(q),
        );

      return matchNombre || matchBadge || matchDesc || matchItems;
    });
  }, [combos, searchTerm, statusFilter]);

  const counts = useMemo(() => {
    let activos = 0;
    let pausados = 0;
    combos.forEach((c) => {
      if (c.activo) activos++;
      else pausados++;
    });
    return { todos: combos.length, activos, pausados };
  }, [combos]);

  const handleOpenCreate = () => {
    setEditingCombo(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (combo) => {
    setEditingCombo(combo);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setModalOpen(false);
    setEditingCombo(null);
  };

  const handleSaveCombo = async (payload) => {
    setIsSaving(true);
    const isEditing = Boolean(payload.id);
    const endpoint = isEditing
      ? `${VITE_API_URL}/combos/${payload.id}`
      : `${VITE_API_URL}/combos`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo procesar la solicitud.");
      }

      showToast(
        isEditing
          ? `Combo "${payload.nombre}" actualizado con éxito.`
          : `Combo "${payload.nombre}" creado exitosamente.`,
      );

      setModalOpen(false);
      setEditingCombo(null);
      await loadCombos(true);
    } catch (err) {
      console.error("Error al guardar combo:", err);
      showToast(err.message || "Error al guardar el combo.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActivo = async (combo) => {
    const nextEstado = !combo.activo;

    setCombos((prev) =>
      prev.map((c) => (c.id === combo.id ? { ...c, activo: nextEstado } : c)),
    );

    try {
      const res = await fetch(`${VITE_API_URL}/combos/${combo.id}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ activo: nextEstado }),
      });

      if (!res.ok) {
        throw new Error("No se pudo actualizar el estado del combo.");
      }

      showToast(
        nextEstado
          ? `Combo "${combo.nombre}" activado en la tienda online.`
          : `Combo "${combo.nombre}" pausado de la tienda.`,
      );
    } catch (err) {
      console.error("Error al alternar estado:", err);
      setCombos((prev) =>
        prev.map((c) =>
          c.id === combo.id ? { ...c, activo: combo.activo } : c,
        ),
      );
      showToast("Error al cambiar estado del combo.", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCombo) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`${VITE_API_URL}/combos/${deletingCombo.id}`, {
        method: "DELETE",
        headers: {
          ...authHeaders,
        },
      });

      if (!res.ok) {
        throw new Error("No se pudo eliminar el combo.");
      }

      setCombos((prev) => prev.filter((c) => c.id !== deletingCombo.id));
      showToast(`Combo "${deletingCombo.nombre}" eliminado correctamente.`);
      setDeletingCombo(null);
    } catch (err) {
      console.error("Error al eliminar combo:", err);
      showToast("Error al eliminar el combo.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Principal y Acciones Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Combos y Paquetes Ahorro
            </h1>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded tabular-nums">
              {combos.length}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Armá combos combinando cortes reales del catálogo con cálculo automático de peso y ahorro.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadCombos(true)}
            disabled={isRefreshing || isLoading}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 rounded-lg border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Recargar combos"
          >
            <RefreshCw
              className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#002244] hover:bg-[#1e3b6c] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer w-fit"
          >
            <Plus className="size-3.5 stroke-[2.4]" />
            <span>Nuevo combo</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Filtros de Estado */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200/90">
        <div className="relative flex-1 max-w-md">
          <Search className="size-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar combo o corte incluido..."
            className="w-full h-8 pl-8 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#002244] outline-none transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("todos")}
            className={`px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === "todos"
                ? "bg-white text-slate-900 font-bold shadow-2xs"
                : "text-slate-600 font-semibold hover:text-slate-900"
            }`}
          >
            Todos ({counts.todos})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("activos")}
            className={`px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === "activos"
                ? "bg-white text-emerald-700 font-bold shadow-2xs"
                : "text-slate-600 font-semibold hover:text-slate-900"
            }`}
          >
            Activos ({counts.activos})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("pausados")}
            className={`px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === "pausados"
                ? "bg-white text-slate-900 font-bold shadow-2xs"
                : "text-slate-600 font-semibold hover:text-slate-900"
            }`}
          >
            Pausados ({counts.pausados})
          </button>
        </div>
      </div>

      {/* 3. Grilla de Tarjetas de Combos */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <RefreshCw className="size-8 animate-spin text-[#002244]" />
          <span className="text-xs font-bold">
            Cargando paquetes y cortes del catálogo...
          </span>
        </div>
      ) : filteredCombos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              No se encontraron combos
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== "todos"
                ? "Probá cambiando los términos de búsqueda o quitando los filtros de estado."
                : "Aún no armaste combos de cortes. Hacé clic en 'Armar Nuevo Combo' para crear el primero."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#002244] hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            <Plus className="size-3.5" />
            <span>Armar Combo Ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCombos.map((c) => {
            const items = Array.isArray(c.items) ? c.items : [];
            const totalCortes = items.length;
            const comboImg =
              c.imagen_url || c.imagenUrl || DEFAULT_COMBO_IMAGE;

            return (
              <article
                key={c.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  c.activo
                    ? "border-slate-200/90 hover:border-slate-300"
                    : "border-slate-200 opacity-80 bg-slate-50/50"
                }`}
              >
                <div>
                  {/* Imagen Única Custom del Combo */}
                  <div className="relative w-full bg-slate-100 overflow-hidden border-b border-slate-100 group">
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900/85 text-white text-[10px] font-black uppercase tracking-wide shadow-xs flex items-center gap-1 font-num">
                        <Scale className="size-3" />
                        <span>{c.kilos || 0} kg en total</span>
                      </span>
                    </div>

                    {c.ahorro > 0 && (
                      <span className="absolute top-2.5 right-2.5 z-10 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                        Ahorro: {formatMoney(c.ahorro)}
                      </span>
                    )}

                    <img
                      src={comboImg}
                      alt={c.nombre}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_COMBO_IMAGE;
                      }}
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>

                  {/* Contenido de la Tarjeta */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide bg-red-50 text-valette-red border border-red-200/80">
                        {c.badge || "Combo Ahorro"}
                      </span>
                      <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded flex items-center gap-1 font-num">
                        <Sparkles className="size-2.5 text-amber-600" />+
                        {c.puntos || 50} pts Club
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-slate-900 text-sm leading-snug">
                        {c.nombre}
                      </h3>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Rinde estimado: {c.rinde || "6 a 8 personas"}
                      </div>
                      {c.descripcion && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {c.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Desglose de Cortes Incluidos */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Cortes Incluidos:</span>
                        <span className="text-[#002244] font-black">
                          {totalCortes} variedades
                        </span>
                      </div>

                      <div className="space-y-1">
                        {items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px]"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="size-1.5 rounded-full bg-[#002244] shrink-0" />
                              <span className="font-semibold text-slate-800 truncate">
                                {it.nombre}
                              </span>
                            </div>
                            <span className="font-black text-[#002244] text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-num shrink-0 ml-1">
                              {it.cantidad_o_peso || `${it.peso_kg || 1} kg`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Caja de Análisis Financiero */}
                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 space-y-1 text-xs">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Suma por separado:
                        </span>
                        <span className="text-slate-400 line-through font-medium font-num">
                          {formatMoney(
                            c.precio_regular_calculado || c.precio_anterior,
                          )}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-0.5">
                        <span className="text-[11px] font-black text-slate-700 uppercase">
                          Precio Combo:
                        </span>
                        <span className="text-base font-black text-[#002244] font-num">
                          {formatMoney(c.precio)}
                        </span>
                      </div>

                      {c.ahorro > 0 && (
                        <div className="flex items-center justify-between text-emerald-700 font-bold text-[10px] pt-1 border-t border-slate-200/60">
                          <span>Ahorro del cliente:</span>
                          <span className="font-black font-num">
                            {formatMoney(c.ahorro)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer de la Tarjeta: Estado y Acciones */}
                <footer className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActivo(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
                      c.activo
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300"
                    }`}
                  >
                    <span
                      className={`size-2 rounded-full ${
                        c.activo ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    <span>{c.activo ? "Activo" : "Pausado"}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Edit3 className="size-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingCombo(c)}
                      title="Eliminar combo"
                      className="size-8 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 font-bold text-xs rounded-xl border border-slate-200 hover:border-rose-200 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal / Bottom Sheet para Armar / Editar Combo */}
      <ComboModal
        key={editingCombo?.id || (modalOpen ? "new-combo" : "closed-combo")}
        isOpen={modalOpen}
        onClose={handleCloseModal}
        combo={editingCombo}
        catalogProducts={catalogProducts}
        onSave={handleSaveCombo}
        isSaving={isSaving}
      />

      {/* Modal de Confirmación de Eliminación */}
      {deletingCombo && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 transition-all"
          onClick={() => !isDeleting && setDeletingCombo(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="size-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="size-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Eliminar este combo?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Estás por eliminar{" "}
                <span className="font-black text-slate-800">
                  "{deletingCombo.nombre}"
                </span>
                . Esta acción quitará el paquete de la tienda de forma
                permanente.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCombo(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isDeleting ? "Eliminando..." : "Eliminar Combo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
