// admin/src/components/catalogo/ProductTable.jsx
import { useMemo, useState } from "react";
import { Edit2, Trash2, ArrowUpDown } from "lucide-react";
import { formatMoney } from "../../utils/formatters";

const collator = new Intl.Collator("es-AR", {
  numeric: true,
  sensitivity: "base",
});

export default function ProductTable({
  products,
  onEditProduct,
  onDeleteProduct,
  onToggleStock,
  onToggleActivo,
  onInlinePriceSave,
  searchTerm,
  categoryFilter,
  stockFilter,
}) {
  const [sortConfig, setSortConfig] = useState({
    key: "nombre_producto",
    dir: "asc",
  });

  const toggleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const list = products.filter((p) => {
      const matchTerm =
        !term ||
        p.nombre_producto?.toLowerCase().includes(term) ||
        p.categoria?.toLowerCase().includes(term) ||
        String(p.id || "").includes(term);

      const matchCat =
        categoryFilter === "todos" ||
        p.categoria?.toLowerCase() === categoryFilter.toLowerCase();

      let matchStock = true;
      if (stockFilter === "en_stock") matchStock = !p.sin_stock;
      if (stockFilter === "sin_stock") matchStock = Boolean(p.sin_stock);

      return matchTerm && matchCat && matchStock;
    });

    const factor = sortConfig.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const k = sortConfig.key;
      if (k === "precio") {
        return factor * ((Number(a.precio) || 0) - (Number(b.precio) || 0));
      }
      if (k === "sin_stock") {
        return factor * (Number(Boolean(a.sin_stock)) - Number(Boolean(b.sin_stock)));
      }
      return factor * collator.compare(String(a[k] || ""), String(b[k] || ""));
    });
  }, [products, searchTerm, categoryFilter, stockFilter, sortConfig]);

  if (filteredProducts.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200/90 text-xs font-medium">
        No se encontraron cortes con los filtros aplicados.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* VISTA MÓVIL COMPACTA (< md) */}
      <div className="md:hidden space-y-2">
        {filteredProducts.map((p) => {
          const hasDiscount =
            Number(p.precio_anterior) > 0 &&
            Number(p.precio_anterior) > Number(p.precio);

          return (
            <div
              key={p.id}
              className={`bg-white p-3 rounded-xl border flex flex-col gap-2.5 ${
                p.sin_stock
                  ? "border-rose-200 bg-rose-50/20"
                  : "border-slate-200/90"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                  <img
                    src={
                      p.imagen_url ||
                      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400"
                    }
                    alt={p.nombre_producto}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400";
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {p.nombre_producto}
                  </div>
                  <div className="text-[11px] text-slate-500 capitalize flex items-center gap-1.5 mt-0.5">
                    <span>{p.categoria}</span>
                    <span className="text-slate-300">·</span>
                    <span className="uppercase text-[10px] font-semibold">
                      x {p.unidad_medida || "kg"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 tabular-nums">
                    <span className="font-extrabold text-slate-900 text-xs">
                      {formatMoney(p.precio)}/{p.unidad_medida || "kg"}
                    </span>
                    {hasDiscount && (
                      <span className="line-through text-slate-400 text-[11px]">
                        {formatMoney(p.precio_anterior)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onToggleStock(p)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border cursor-pointer ${
                    !p.sin_stock
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-[#c53030] border-rose-200"
                  }`}
                >
                  {!p.sin_stock ? "En stock" : "Agotado"}
                </button>

                <div className="flex items-center gap-1.5">
                  {onEditProduct && (
                    <button
                      type="button"
                      onClick={() => onEditProduct(p)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md text-[11px] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                  )}
                  {onDeleteProduct && (
                    <button
                      type="button"
                      onClick={() => onDeleteProduct(p)}
                      title="Eliminar corte"
                      className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-[#c53030] rounded-md border border-slate-200 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* VISTA ESCRITORIO: PLANILLA TABULAR ORDENABLE Y EDITABLE INLINE (>= md) */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200/90 shadow-native overflow-hidden">
        <div
          tabIndex={0}
          role="region"
          aria-labelledby="catalogo-table-caption"
          className="erp-table-wrapper"
        >
          <table className="erp-table min-w-[820px]">
            <caption id="catalogo-table-caption" className="sr-only-live">
              Planilla de cortes, precios y stock del catálogo
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  aria-sort={
                    sortConfig.key === "nombre_producto"
                      ? sortConfig.dir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  <button
                    type="button"
                    onClick={() => toggleSort("nombre_producto")}
                  >
                    <span>Corte / Producto</span>
                    <ArrowUpDown
                      className={`w-3 h-3 ${
                        sortConfig.key === "nombre_producto"
                          ? "opacity-100"
                          : "opacity-35"
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </th>
                <th
                  scope="col"
                  aria-sort={
                    sortConfig.key === "categoria"
                      ? sortConfig.dir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  <button
                    type="button"
                    onClick={() => toggleSort("categoria")}
                  >
                    <span>Rubro</span>
                    <ArrowUpDown
                      className={`w-3 h-3 ${
                        sortConfig.key === "categoria"
                          ? "opacity-100"
                          : "opacity-35"
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </th>
                <th
                  scope="col"
                  className="text-right"
                  aria-sort={
                    sortConfig.key === "precio"
                      ? sortConfig.dir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  <button type="button" onClick={() => toggleSort("precio")}>
                    <span>Precio vigente</span>
                    <ArrowUpDown
                      className={`w-3 h-3 ${
                        sortConfig.key === "precio"
                          ? "opacity-100"
                          : "opacity-35"
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </th>
                <th scope="col">Promos volumen</th>
                <th
                  scope="col"
                  aria-sort={
                    sortConfig.key === "sin_stock"
                      ? sortConfig.dir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  <button
                    type="button"
                    onClick={() => toggleSort("sin_stock")}
                  >
                    <span>Stock</span>
                    <ArrowUpDown
                      className={`w-3 h-3 ${
                        sortConfig.key === "sin_stock"
                          ? "opacity-100"
                          : "opacity-35"
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </th>
                <th scope="col" className="text-center">
                  Tienda
                </th>
                <th scope="col" className="text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const hasDiscount =
                  Number(p.precio_anterior) > 0 &&
                  Number(p.precio_anterior) > Number(p.precio);
                const promos = Array.isArray(p.promos)
                  ? p.promos.filter((pr) => pr.activa !== false)
                  : [];

                return (
                  <tr
                    key={p.id}
                    className={p.sin_stock ? "bg-rose-50/20" : ""}
                  >
                    <th scope="row" className="whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
                          <img
                            src={
                              p.imagen_url ||
                              "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400"
                            }
                            alt={p.nombre_producto}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src =
                                "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400";
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 leading-tight">
                            {p.nombre_producto}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            ID {p.id} · x {p.unidad_medida || "kg"}
                          </div>
                        </div>
                      </div>
                    </th>

                    <td className="capitalize text-slate-600 font-medium whitespace-nowrap">
                      {p.categoria}
                    </td>

                    <td className="text-right whitespace-nowrap">
                      {onInlinePriceSave ? (
                        <div className="inline-flex flex-col items-end">
                          <div className="inline-flex items-center gap-1">
                            <span className="text-[11px] text-slate-400 font-semibold">
                              $
                            </span>
                            <input
                              type="number"
                              step="50"
                              min="0"
                              key={`price-${p.id}-${p.precio}`}
                              defaultValue={Math.round(Number(p.precio) || 0)}
                              aria-label={`Precio de ${p.nombre_producto}`}
                              onBlur={(e) =>
                                onInlinePriceSave(p, e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") e.currentTarget.blur();
                              }}
                              className="erp-cell-input font-bold"
                            />
                            <span className="text-[10px] text-slate-400">
                              /{p.unidad_medida || "kg"}
                            </span>
                          </div>
                          {hasDiscount && (
                            <span className="text-[10px] text-slate-400 line-through tabular-nums pr-5">
                              Antes {formatMoney(p.precio_anterior)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="tabular-nums font-bold text-slate-900">
                          {formatMoney(p.precio)}
                          <span className="text-[10px] font-normal text-slate-400">
                            /{p.unidad_medida || "kg"}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="whitespace-nowrap">
                      {promos.length > 0 ? (
                        <span className="text-[11px] font-semibold text-slate-700 tabular-nums">
                          {promos[0].cantidad_kg}
                          {p.unidad_medida || "kg"} -&gt;{" "}
                          {formatMoney(promos[0].precio_promocional)}
                          {promos.length > 1 ? ` (+${promos.length - 1})` : ""}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Sin promo
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onToggleStock(p)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                          !p.sin_stock
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-rose-50 text-[#c53030] border-rose-200 hover:bg-rose-100"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            !p.sin_stock ? "bg-emerald-500" : "bg-[#c53030]"
                          }`}
                        />
                        <span>{!p.sin_stock ? "En stock" : "Agotado"}</span>
                      </button>
                    </td>

                    <td className="text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onToggleActivo(p)}
                        title={
                          p.activo
                            ? "Visible en la tienda"
                            : "Oculto de la tienda"
                        }
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                          p.activo
                            ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
                            : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        {p.activo ? "Visible" : "Oculto"}
                      </button>
                    </td>

                    <td className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 justify-end">
                        {onEditProduct && (
                          <button
                            type="button"
                            onClick={() => onEditProduct(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-md text-[11px] transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                            <span>Editar</span>
                          </button>
                        )}

                        {onDeleteProduct && (
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(p)}
                            title="Eliminar corte"
                            className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-[#c53030] rounded-md border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-3.5 py-2 border-t border-slate-200/80 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500 font-medium tabular-nums">
          <div>Mostrando {filteredProducts.length} cortes en la planilla</div>
          <div className="text-slate-400 hidden lg:block">
            {onInlinePriceSave
              ? "Hacé click en cualquier precio para editarlo directo (Enter para guardar)."
              : "Tocá En stock / Agotado para pausar un corte en 1 click."}
          </div>
        </div>
      </div>
    </div>
  );
}
