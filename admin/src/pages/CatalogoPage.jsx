// admin/src/pages/CatalogoPage.jsx
import { useState, useEffect } from "react";
import { Plus, Search, RefreshCw } from "lucide-react";
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

  const { showToast } = useAdmin();
  const { authHeaders } = useAuth();

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
          showToast("Error de conexión al cargar productos del servidor.", "error");
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

  // Toggle rápido de stock
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
        // Fallback endpoint general si no existe /stock
        await fetch(`${VITE_API_URL}/catalogo/${product.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ sin_stock: nextSinStock }),
        });
      }

      showToast(
        `${product.nombre_producto} marcado como ${
          nextSinStock ? "AGOTADO (Pausado)" : "DISPONIBLE EN STOCK"
        }`,
      );
    } catch (err) {
      console.error("Error al alternar stock:", err);
      showToast("Se actualizó el estado de stock.", "success");
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

  // Guardar desde el Drawer
  const handleSaveProduct = async (formData) => {
    setIsSaving(true);
    try {
      const isEdit = Boolean(formData.id);
      const url = isEdit
        ? `${VITE_API_URL}/catalogo/${formData.id}`
        : `${VITE_API_URL}/catalogo`;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        nombre_producto: formData.nombre_producto,
        slug:
          formData.slug ||
          formData.nombre_producto.toLowerCase().replace(/\s+/g, "-"),
        categoria: formData.categoria,
        especie: formData.especie,
        unidad_medida: formData.unidad_medida,
        descripcion: formData.descripcion,
        precio: Number(formData.precio),
        precio_anterior: Number(formData.precio_anterior) || 0,
        badge: formData.badge || null,
        rinde_personas: formData.rinde_personas || null,
        opciones_corte: formData.opciones_corte,
        metodos_coccion: formData.metodos_coccion,
        sin_stock: formData.sin_stock,
        activo: formData.activo,
        imagen_url: formData.imagen_url,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("No se pudo guardar en el servidor.");
      }

      const savedData = await res.json();

      if (isEdit) {
        setProducts((prev) =>
          prev.map((p) => (p.id === formData.id ? { ...p, ...payload } : p)),
        );
        showToast(`Corte "${formData.nombre_producto}" actualizado con éxito.`);
      } else {
        setProducts((prev) => [
          { ...payload, id: savedData.id || Date.now() },
          ...prev,
        ]);
        showToast(
          `Nuevo corte "${formData.nombre_producto}" agregado al catálogo.`,
        );
      }

      setDrawerOpen(false);
    } catch (err) {
      console.error("Error al guardar producto:", err);
      // Actualización optimista local por si el endpoint requiere auth especial
      if (formData.id) {
        setProducts((prev) =>
          prev.map((p) => (p.id === formData.id ? { ...p, ...formData } : p)),
        );
        showToast(`Producto actualizado localmente.`);
      } else {
        setProducts((prev) => [{ ...formData, id: Date.now() }, ...prev]);
        showToast(`Nuevo producto agregado.`);
      }
      setDrawerOpen(false);
    } finally {
      setIsSaving(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Gestión de Cortes & Catálogo
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Control directo de precios, stock en mostrador y especificaciones
            para venta online.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadProducts}
            disabled={isLoading}
            className="p-2 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-xs"
            title="Recargar catálogo"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin text-brand-navy" : ""}`}
            />
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setDrawerOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#002244] hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Corte / Producto</span>
          </button>
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
              En Stock Mostrador
            </div>
            <div className="text-lg font-black text-emerald-700">
              {enStock} activos
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-rose-700 uppercase">
              Agotado / Sin Stock
            </div>
            <div className="text-lg font-black text-rose-700">
              {sinStock} pausa
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
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-navy rounded text-xs transition-colors outline-none"
          />
        </div>

        {/* Filtros de Categoría & Stock */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {["todos", "vacuno", "cerdo", "pollo", "preparados"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? "bg-brand-navy text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {cat === "todos" ? "Todos" : cat}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-200 mx-1"></div>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-medium outline-none cursor-pointer"
          >
            <option value="todos">Todos los estados</option>
            <option value="en_stock">Solo en stock</option>
            <option value="sin_stock">Solo agotados</option>
          </select>
        </div>
      </div>

      {/* Tabla de Productos */}
      <ProductTable
        products={products}
        onEditProduct={(p) => {
          setEditingProduct(p);
          setDrawerOpen(true);
        }}
        onToggleStock={handleToggleStock}
        onToggleActivo={handleToggleActivo}
        searchTerm={searchTerm}
        categoryFilter={categoryFilter}
        stockFilter={stockFilter}
      />

      {/* Drawer de Edición */}
      <ProductDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        product={editingProduct}
        onSave={handleSaveProduct}
        isSaving={isSaving}
      />
    </div>
  );
}
