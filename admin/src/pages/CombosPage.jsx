// admin/src/pages/CombosPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Edit3,
  Scale,
  Sparkles,
  Layers,
  AlertCircle,
  AlertTriangle,
  X,
  CheckCircle2,
  Check,
} from "lucide-react";
import { VITE_API_URL } from "../config/api";
import { useAdmin } from "../context/AdminContext";
import { useAuth } from "../context/AuthContext";
import { formatMoney } from "../utils/formatters";
import ComboModal from "../components/combos/ComboModal";

export default function CombosPage() {
  const { showToast } = useAdmin();
  const { authHeaders } = useAuth();

  const [combos, setCombos] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos"); // 'todos' | 'activos' | 'pausados'

  // Modal de Creación / Edición
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal de Confirmación de Eliminación
  const [deletingCombo, setDeletingCombo] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Cargar productos del catálogo (para abastecer el selector del modal)
  const loadCatalog = async () => {
    try {
      const res = await fetch(`${VITE_API_URL}/catalogo?incluir_promos_inactivas=true`);
      if (res.ok) {
        const data = await res.json();
        setCatalogProducts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error al cargar productos del catálogo:", err);
    }
  };

  // Cargar combos desde la base de datos (incluyendo inactivos para gestión admin)
  const loadCombos = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch(`${VITE_API_URL}/combos?incluir_inactivos=true`);
      if (res.ok) {
        const data = await res.json();
        setCombos(Array.isArray(data) ? data : []);
      } else {
        throw new Error("No se pudo cargar la lista de combos.");
      }
    } catch (err) {
      console.error("Error al obtener combos:", err);
      showToast("Error de conexión al cargar combos del servidor.", "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCatalog();
    loadCombos();
  }, []);

  // Filtrado de combos por búsqueda y estado
  const filteredCombos = useMemo(() => {
    return combos.filter((c) => {
      // Filtro de estado
      if (statusFilter === "activos" && !c.activo) return false;
      if (statusFilter === "pausados" && c.activo) return false;

      // Filtro de búsqueda
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();

      const matchNombre = c.nombre?.toLowerCase().includes(q);
      const matchBadge = c.badge?.toLowerCase().includes(q);
      const matchDesc = c.descripcion?.toLowerCase().includes(q);
      const matchItems = Array.isArray(c.items) && c.items.some(
        (it) => it.nombre?.toLowerCase().includes(q) || it.categoria?.toLowerCase().includes(q)
      );

      return matchNombre || matchBadge || matchDesc || matchItems;
    });
  }, [combos, searchTerm, statusFilter]);

  // Contadores de estado
  const counts = useMemo(() => {
    let activos = 0;
    let pausados = 0;
    combos.forEach((c) => {
      if (c.activo) activos++;
      else pausados++;
    });
    return { todos: combos.length, activos, pausados };
  }, [combos]);

  // Abrir modal para crear
  const handleOpenCreate = () => {
    setEditingCombo(null);
    setModalOpen(true);
  };

  // Abrir modal para editar
  const handleOpenEdit = (combo) => {
    setEditingCombo(combo);
    setModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    if (isSaving) return;
    setModalOpen(false);
    setEditingCombo(null);
  };

  // Guardar (Crear o Actualizar)
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
          : `Combo "${payload.nombre}" creado exitosamente.`
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

  // Alternar Activo / Pausado
  const handleToggleActivo = async (combo) => {
    const nextEstado = !combo.activo;

    // Actualización optimista local
    setCombos((prev) =>
      prev.map((c) => (c.id === combo.id ? { ...c, activo: nextEstado } : c))
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
          : `Combo "${combo.nombre}" pausado de la tienda.`
      );
    } catch (err) {
      console.error("Error al alternar estado:", err);
      // Revertir optimismo
      setCombos((prev) =>
        prev.map((c) => (c.id === combo.id ? { ...c, activo: combo.activo } : c))
      );
      showToast("Error al cambiar estado del combo.", "error");
    }
  };

  // Confirmar eliminación
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
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Combos & Paquetes Ahorro
            </h1>
            <span className="text-[11px] font-bold text-valette-red bg-red-50 border border-red-200/80 px-2.5 py-0.5 rounded-full font-num">
              {combos.length} paquetes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Paquetes armados con descuento global. Los cortes, fotos y categorías se vinculan en vivo con el catálogo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadCombos(true)}
            disabled={isRefreshing || isLoading}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Recargar combos"
          >
            <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#002244] hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer w-fit"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Armar Nuevo Combo</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Filtros de Estado */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Input de Búsqueda */}
        <div className="relative flex-1">
          <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, corte incluido o etiqueta..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#002244] outline-none transition-colors"
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

        {/* Píldoras de Filtro de Estado */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setStatusFilter("todos")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "todos"
                ? "bg-[#002244] text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todos ({counts.todos})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("activos")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "activos"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Activos ({counts.activos})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("pausados")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "pausados"
                ? "bg-slate-700 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
          <span className="text-xs font-bold">Cargando paquetes y cortes del catálogo...</span>
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
            const extraCortes = Math.max(0, totalCortes - 2);

            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  c.activo
                    ? "border-slate-200/90 hover:border-slate-300"
                    : "border-slate-200 opacity-80 bg-slate-50/50"
                }`}
              >
                <div>
                  {/* Banner Superior con Collage Dinámico de Fotos de los Cortes */}
                  <div className="relative w-full aspect-16/8 bg-slate-100 overflow-hidden border-b border-slate-100 group">
                    {/* Badge flotante de Peso Total */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900/85 text-white text-[10px] font-black uppercase tracking-wide shadow-xs flex items-center gap-1 font-num">
                        <Scale className="size-3" />
                        <span>{c.kilos || 0} kg en total</span>
                      </span>
                    </div>

                    {/* Badge flotante de Ahorro */}
                    {c.ahorro > 0 && (
                      <span className="absolute top-2.5 right-2.5 z-10 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                        Ahorro: {formatMoney(c.ahorro)}
                      </span>
                    )}

                    {/* Collage de 1, 2, 3 o más cortes vinculados en vivo */}
                    {items.length === 0 ? (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                        Sin cortes asignados
                      </div>
                    ) : (
                      <div
                        className={`grid w-full h-full divide-x divide-white/80 ${
                          items.length === 1
                            ? "grid-cols-1"
                            : items.length === 2
                            ? "grid-cols-2"
                            : "grid-cols-3"
                        }`}
                      >
                        {items.slice(0, 3).map((it, idx) => {
                          const isThird = idx === 2;

                          return (
                            <div
                              key={it.id || idx}
                              className="relative h-full w-full overflow-hidden bg-slate-200"
                            >
                              <img
                                src={
                                  it.imagen_url ||
                                  "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400"
                                }
                                alt={it.nombre}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />

                              {/* Overlay de categoría */}
                              <span className="absolute bottom-1 inset-x-1 bg-slate-900/70 text-[8px] font-black text-white text-center py-0.5 rounded truncate uppercase">
                                {it.categoria || it.nombre}
                              </span>

                              {/* Indicador de más de 3 cortes */}
                              {isThird && totalCortes > 3 && (
                                <div className="absolute inset-0 bg-slate-950/75 flex flex-col items-center justify-center text-white p-1 text-center">
                                  <span className="text-base sm:text-lg font-black leading-none drop-shadow-sm font-num">
                                    +{extraCortes}
                                  </span>
                                  <span className="text-[9px] font-extrabold uppercase tracking-tight text-slate-200 mt-0.5">
                                    cortes
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Contenido de la Tarjeta */}
                  <div className="p-4 space-y-3">
                    {/* Badges de Atributos */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide bg-red-50 text-valette-red border border-red-200/80">
                        {c.badge || "🔥 Combo Ahorro"}
                      </span>
                      <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded flex items-center gap-1 font-num">
                        <Sparkles className="size-2.5 text-amber-600" />+
                        {c.puntos || 50} pts Club
                      </span>
                    </div>

                    {/* Nombre y Rinde */}
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
                          {formatMoney(c.precio_regular_calculado || c.precio_anterior)}
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
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Bottom Sheet para Armar / Editar Combo */}
      <ComboModal
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
                ¿Eliminar este combo?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Estás por eliminar{" "}
                <span className="font-black text-slate-800">
                  "{deletingCombo.nombre}"
                </span>
                . Esta acción quitará el paquete de la tienda de forma permanente.
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
