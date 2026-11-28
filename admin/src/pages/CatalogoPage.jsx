// admin/src/pages/CatalogoPage.jsx
import { useState, useEffect } from "react";
import { Plus, Search, RefreshCw, AlertTriangle } from "lucide-react";
import { VITE_API_URL } from "../config/api";
import { useAdmin } from "../context/AdminContext";
import { useAuth } from "../context/AuthContext";
import ProductTable from "../components/catalogo/ProductTable";
import ProductDrawer from "../components/catalogo/ProductDrawer";

export default function CatalogoPage({ onProductsLoaded }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [stockFilter, setStockFilter] = useState("todos");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Estado para modal de confirmación de eliminación
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ajuste masivo porcentual por categoría
  const [bulkCat, setBulkCat] = useState("todos");
  const [bulkPct, setBulkPct] = useState("5");
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);

  const { showToast } = useAdmin();
  const { authHeaders, isManager } = useAuth();

  const fetchCatalogItems = async () => {
    const res = await fetch(
      `${VITE_API_URL}/catalogo?incluir_promos_inactivas=true`,
    );
    if (!res.ok) {
      throw new Error("No se pudo cargar el catálogo.");
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  };

  // Recarga manual desde botón o acción del usuario
  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const items = await fetchCatalogItems();
      setProducts(items);
      onProductsLoaded?.(items.length);
    } catch (err) {
      console.error("Error al cargar catálogo:", err);
      showToast("Error de conexión al cargar productos del servidor.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    fetchCatalogItems()
      .then((items) => {
        if (isMounted) {
          setProducts(items);
          onProductsLoaded?.(items.length);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Error al cargar catálogo:", err);
          showToast(
            "Error de conexión al cargar productos del servidor.",
            "error",
          );
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
  }, [onProductsLoaded, showToast]);

  // Toggle rápido de stock en mostrador
  const handleToggleStock = async (product) => {
    const nextSinStock = !product.sin_stock;

    // Actualización optimista local
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, sin_stock: nextSinStock } : p,
      ),
    );

    try {
      const res = await fetch(`${VITE_API_URL}/catalogo/${product.id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ sin_stock: nextSinStock }),
      });

      if (!res.ok) {
        throw new Error("No se pudo actualizar el stock.");
      }

      showToast(
        `${product.nombre_producto} marcado como ${
          nextSinStock ? "AGOTADO (Pausado)" : "DISPONIBLE EN STOCK"
        }`,
      );
    } catch (err) {
      console.error("Error al alternar stock:", err);
      await loadProducts();
      showToast("Error al actualizar el estado de stock.", "error");
    }
  };

  // Toggle de visibilidad en tienda
  const handleToggleActivo = async (product) => {
    const nextActivo = !product.activo;

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, activo: nextActivo } : p)),
    );

    try {
      await fetch(`${VITE_API_URL}/catalogo/${product.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ activo: nextActivo }),
      });

      showToast(
        `${product.nombre_producto} ahora está ${nextActivo ? "VISIBLE" : "OCULTO"} en tienda.`,
      );
    } catch (err) {
      console.error("Error al cambiar visibilidad:", err);
    }
  };

  // Guardar desde el Drawer (Crear o Editar)
  const handleSaveProduct = async (formData) => {
    setIsSaving(true);
    try {
      const isEdit = Boolean(formData.id);
      const url = isEdit
        ? `${VITE_API_URL}/catalogo/${formData.id}`
        : `${VITE_API_URL}/catalogo`;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        nombre_producto: formData.nombre_producto.trim(),
        slug:
          formData.slug.trim() ||
          formData.nombre_producto
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, ""),
        categoria: formData.categoria,
        especie: formData.especie || formData.categoria,
        unidad_medida: formData.unidad_medida,
        descripcion: formData.descripcion.trim(),
        precio: Number(formData.precio),
        precio_anterior: Number(formData.precio_anterior) || 0,
        badge: formData.badge?.trim() || null,
        rinde_personas: formData.rinde_personas?.trim() || null,
        opciones_corte: formData.opciones_corte || [],
        metodos_coccion: formData.metodos_coccion || [],
        sin_stock: Boolean(formData.sin_stock),
        activo: Boolean(formData.activo),
        destacar: Boolean(formData.destacar),
        gana_puntos: Boolean(formData.gana_puntos),
        puntos: Number(formData.puntos) || 0,
        calorias: formData.calorias !== "" ? Number(formData.calorias) : null,
        proteinas: formData.proteinas !== "" ? Number(formData.proteinas) : null,
        grasas: formData.grasas !== "" ? Number(formData.grasas) : null,
        imagen_url: formData.imagen_url || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo guardar en el servidor.");
      }

      const savedData = await res.json();
      const savedId = savedData.id || formData.id;

      // Eliminar promos quitadas por el usuario
      if (Array.isArray(formData.deletedPromoIds) && savedId) {
        for (const promoId of formData.deletedPromoIds) {
          await fetch(`${VITE_API_URL}/catalogo/${savedId}/promos/${promoId}`, {
            method: "DELETE",
            headers: authHeaders,
          }).catch(() => {});
        }
      }

      // Crear nuevas escalas de promoción agregadas
      if (Array.isArray(formData.newPromos) && savedId) {
        for (const pr of formData.newPromos) {
          await fetch(`${VITE_API_URL}/catalogo/${savedId}/promos`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            body: JSON.stringify({
              cantidad_kg: Number(pr.cantidad_kg),
              precio_promocional: Number(pr.precio_promocional),
              activa: true,
            }),
          }).catch(() => {});
        }
      }

      showToast(
        isEdit
          ? `Corte "${formData.nombre_producto}" actualizado con éxito.`
          : `Nuevo corte "${formData.nombre_producto}" agregado al catálogo.`
      );

      setDrawerOpen(false);
      setEditingProduct(null);
      await loadProducts();
    } catch (err) {
      console.error("Error al guardar producto:", err);
      showToast(err.message || "Error al guardar producto en catálogo.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Confirmar eliminación del producto
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`${VITE_API_URL}/catalogo/${deletingProduct.id}`, {
        method: "DELETE",
        headers: {
          ...authHeaders,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error ||
            "No se puede eliminar el producto. Si tiene pedidos asociados, pausalo en su lugar."
        );
      }

      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      showToast(`Corte "${deletingProduct.nombre_producto}" eliminado.`);
      setDeletingProduct(null);
    } catch (err) {
      console.error("Error al eliminar corte:", err);
      showToast(err.message || "Error al eliminar producto.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Edición inline de precio directo sobre la planilla
  const handleInlinePriceSave = async (product, rawPrice) => {
    const nextPrice = Math.round(Number(rawPrice));
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) return;
    if (Math.round(Number(product.precio) || 0) === nextPrice) return;

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, precio: nextPrice } : p)),
    );

    try {
      const res = await fetch(`${VITE_API_URL}/catalogo/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ precio: nextPrice }),
      });
      if (!res.ok) throw new Error();
      showToast(`${product.nombre_producto} actualizado a $${nextPrice.toLocaleString("es-AR")}.`);
    } catch {
      await loadProducts();
      showToast("No se pudo actualizar el precio.", "error");
    }
  };

  // Ajuste masivo por porcentaje
  const handleBulkPriceApply = async () => {
    const pct = parseFloat(bulkPct);
    if (!Number.isFinite(pct) || pct === 0) return;
    const labelCat = bulkCat === "todos" ? "todos los rubros" : bulkCat;
    if (
      !window.confirm(
        `Aplicar un ajuste de ${pct > 0 ? "+" : ""}${pct}% a ${labelCat} (redondeado a $50)?`,
      )
    ) {
      return;
    }

    setIsApplyingBulk(true);
    try {
      const res = await fetch(`${VITE_API_URL}/catalogo/ajuste-masivo`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ categoria: bulkCat, porcentaje: pct }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo aplicar el ajuste.");
      showToast(
        `Ajuste ${pct > 0 ? "+" : ""}${pct}% aplicado a ${data.actualizados || 0} cortes.`,
      );
      await loadProducts();
    } catch (err) {
      showToast(err.message || "Error al aplicar ajuste masivo.", "error");
    } finally {
      setIsApplyingBulk(false);
    }
  };

  // Estadísticas calculadas
  const total = products.length;
  const enStock = products.filter((p) => !p.sin_stock).length;
  const sinStock = products.filter((p) => p.sin_stock).length;
  const activos = products.filter((p) => p.activo !== false).length;

  return (
    <div className="space-y-4">
      {/* Barra de Título y Acción Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Planilla de Cortes, Precios y Stock
          </h1>
          <p className="text-xs text-slate-500">
            Editá precios directo en la tabla, pausá stock en 1 click o aplicá ajustes masivos por rubro.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isManager && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
              <span className="text-[11px] font-semibold text-slate-500 hidden xl:inline">
                Ajuste:
              </span>
              <select
                value={bulkCat}
                onChange={(e) => setBulkCat(e.target.value)}
                className="h-7 px-1.5 rounded border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-800 outline-none"
              >
                <option value="todos">Todos</option>
                <option value="vacuno">Vacuno</option>
                <option value="cerdo">Cerdo</option>
                <option value="pollo">Pollo</option>
                <option value="embutidos">Embutidos</option>
                <option value="preparados">Preparados</option>
                <option value="almacen">Almacén</option>
              </select>
              <input
                type="number"
                step="0.5"
                value={bulkPct}
                onChange={(e) => setBulkPct(e.target.value)}
                className="w-14 h-7 px-1.5 rounded border border-slate-200 text-xs font-bold text-right tabular-nums outline-none"
              />
              <span className="text-[11px] font-bold text-slate-500">%</span>
              <button
                type="button"
                onClick={handleBulkPriceApply}
                disabled={isApplyingBulk}
                className="h-7 px-2.5 rounded bg-slate-900 hover:bg-[#002244] text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
              >
                {isApplyingBulk ? "..." : "Aplicar"}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={loadProducts}
            disabled={isLoading}
            className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
            title="Recargar catálogo"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#002244]" : ""}`}
            />
          </button>

          {isManager && (
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setDrawerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#002244] hover:bg-[#1e3b6c] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
              <span>Nuevo corte</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Strip compacto de 1 fila */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200/90">
          <div className="text-[11px] font-semibold text-slate-500">
            Total catálogo
          </div>
          <div className="text-xl font-extrabold text-slate-900 tabular-nums mt-0.5">
            {total}
          </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200/90">
          <div className="text-[11px] font-semibold text-slate-500">
            En stock
          </div>
          <div className="text-xl font-extrabold text-emerald-700 tabular-nums mt-0.5">
            {enStock}
          </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200/90">
          <div className="text-[11px] font-semibold text-slate-500">
            Agotados / pausados
          </div>
          <div
            className={`text-xl font-extrabold tabular-nums mt-0.5 ${
              sinStock > 0 ? "text-[#c53030]" : "text-slate-900"
            }`}
          >
            {sinStock}
          </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200/90">
          <div className="text-[11px] font-semibold text-slate-500">
            Visibles en tienda
          </div>
          <div className="text-xl font-extrabold text-slate-900 tabular-nums mt-0.5">
            {activos}
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar corte o rubro (ej: Asado, Nalga, Chorizo)..."
            className="w-full h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#002244] rounded-lg text-xs font-medium transition-colors outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 md:pb-0 no-scrollbar">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            {["todos", "vacuno", "cerdo", "pollo", "embutidos", "preparados", "almacen"].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] capitalize transition-colors cursor-pointer whitespace-nowrap ${
                    categoryFilter === cat
                      ? "bg-white text-slate-900 font-bold shadow-2xs"
                      : "text-slate-600 font-semibold hover:text-slate-900"
                  }`}
                >
                  {cat === "todos" ? "Todos" : cat}
                </button>
              ),
            )}
          </div>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="h-8 bg-slate-50 border border-slate-200 rounded-lg px-2.5 text-xs text-slate-700 font-semibold outline-none cursor-pointer"
          >
            <option value="todos">Todos los estados</option>
            <option value="en_stock">Solo en stock</option>
            <option value="sin_stock">Solo agotados</option>
          </select>
        </div>
      </div>

      {/* Tabla y Cards de Productos */}
      <ProductTable
        products={products}
        onEditProduct={
          isManager
            ? (p) => {
                setEditingProduct(p);
                setDrawerOpen(true);
              }
            : null
        }
        onDeleteProduct={isManager ? (p) => setDeletingProduct(p) : null}
        onInlinePriceSave={isManager ? handleInlinePriceSave : null}
        onToggleStock={handleToggleStock}
        onToggleActivo={handleToggleActivo}
        searchTerm={searchTerm}
        categoryFilter={categoryFilter}
        stockFilter={stockFilter}
      />

      {/* Drawer de Edición y Creación con Drag & Drop Cloudinary */}
      <ProductDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSave={handleSaveProduct}
        isSaving={isSaving}
      />

      {/* Modal de Confirmación de Eliminación */}
      {deletingProduct && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 transition-all"
          onClick={() => !isDeleting && setDeletingProduct(null)}
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
                Eliminar este corte?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Estás por eliminar{" "}
                <span className="font-black text-slate-800">
                  "{deletingProduct.nombre_producto}"
                </span>
                . Si tiene pedidos previos o forma parte de combos, te recomendamos pausar su disponibilidad en su lugar.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
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
                {isDeleting ? "Eliminando..." : "Eliminar Corte"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
