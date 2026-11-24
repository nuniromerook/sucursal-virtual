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

  // Estadísticas calculadas
  const total = products.length;
  const enStock = products.filter((p) => !p.sin_stock).length;
  const sinStock = products.filter((p) => p.sin_stock).length;
  const activos = products.filter((p) => p.activo !== false).length;

  return (
    <div className="space-y-4">
      {/* Barra de Título y Acción Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Gestión de Cortes & Catálogo
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Control directo de precios, stock en mostrador y fotos para venta online.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadProducts}
            disabled={isLoading}
            className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Recargar catálogo"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin text-[#002244]" : ""}`}
            />
          </button>

          {isManager && (
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setDrawerOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#002244] hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Corte / Producto</span>
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de Resumen Operativo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">
              Total Catálogo
            </div>
            <div className="text-lg font-black text-slate-900">
              {total} cortes
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-700 uppercase">
              En Stock
            </div>
            <div className="text-lg font-black text-emerald-700">
              {enStock} activos
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-rose-700 uppercase">
              Agotados / Sin Stock
            </div>
            <div className="text-lg font-black text-rose-700">
              {sinStock} pausados
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-sky-700 uppercase">
              Visibles en Tienda
            </div>
            <div className="text-lg font-black text-sky-700">
              {activos} publicados
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Buscador Rápido */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre (ej: Asado, Nalga, Chorizo)..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 focus:bg-white focus:border-[#002244] rounded-xl text-xs font-medium transition-colors outline-none"
          />
        </div>

        {/* Filtros de Categoría & Stock */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {["todos", "vacuno", "cerdo", "pollo", "preparados", "almacen"].map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer whitespace-nowrap ${
                  categoryFilter === cat
                    ? "bg-[#002244] text-white shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {cat === "todos" ? "Todos" : cat}
              </button>
            )
          )}

          <div className="h-4 w-px bg-slate-200 mx-1 shrink-0"></div>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-bold outline-none cursor-pointer"
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
                ¿Eliminar este corte?
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
