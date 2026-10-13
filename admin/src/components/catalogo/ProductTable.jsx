// admin/src/components/catalogo/ProductTable.jsx
import React, { useMemo } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { formatMoney } from "../../utils/formatters";

export default function ProductTable({
  products,
  onEditProduct,
  onDeleteProduct,
  onToggleStock,
  onToggleActivo,
  searchTerm,
  categoryFilter,
  stockFilter,
}) {
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return products.filter((p) => {
      const matchTerm =
        !term ||
        p.nombre_producto?.toLowerCase().includes(term) ||
        p.categoria?.toLowerCase().includes(term);

      const matchCat =
        categoryFilter === "todos" ||
        p.categoria?.toLowerCase() === categoryFilter.toLowerCase();

      let matchStock = true;
      if (stockFilter === "en_stock") matchStock = !p.sin_stock;
      if (stockFilter === "sin_stock") matchStock = Boolean(p.sin_stock);

      return matchTerm && matchCat && matchStock;
    });
  }, [products, searchTerm, categoryFilter, stockFilter]);

  if (filteredProducts.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 text-xs font-medium">
        No se encontraron productos que coincidan con los filtros aplicados.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* VISTA MÓVIL: CARDS SIMPLES Y NATIVAS (< md) */}
      <div className="md:hidden space-y-2.5">
        {filteredProducts.map((p) => {
          const hasDiscount =
            Number(p.precio_anterior) > 0 &&
            Number(p.precio_anterior) > Number(p.precio);

          return (
            <div
              key={p.id}
              className={`bg-white p-3.5 rounded-2xl border shadow-xs flex flex-col gap-2.5 transition-colors ${
                p.sin_stock
                  ? "border-rose-200/90 bg-rose-50/20"
                  : "border-slate-200/80"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                {/* Foto Cuadrada */}
                <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 relative">
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
                  {p.sin_stock && (
                    <span className="absolute inset-0 bg-rose-900/60 flex items-center justify-center text-[9px] text-white font-black tracking-wider">
                      AGOTADO
                    </span>
                  )}
                </div>

                {/* Datos del corte (Simple, directo) */}
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-sm text-slate-900 leading-tight">
                    {p.nombre_producto}
                  </div>

                  <div className="text-[11px] text-slate-500 capitalize flex items-center gap-1.5 mt-0.5 font-medium">
                    <span>{p.categoria}</span>
                    <span className="text-slate-300">•</span>
                    <span className="uppercase text-[10px] font-bold text-slate-600">
                      Venta x {p.unidad_medida || "kg"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-black text-[#002244] text-sm">
                      {formatMoney(p.precio)}{" "}
                      <span className="text-[10px] font-normal text-slate-500">
                        /{p.unidad_medida || "kg"}
                      </span>
                    </span>
                    {hasDiscount && (
                      <span className="line-through text-slate-400 text-xs font-medium">
                        {formatMoney(p.precio_anterior)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones táctiles de mostrador */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onToggleStock(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    !p.sin_stock
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                      : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      !p.sin_stock ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  ></span>
                  <span>{!p.sin_stock ? "En Stock" : "Agotado"}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEditProduct(p)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Editar</span>
                  </button>

                  {onDeleteProduct && (
                    <button
                      type="button"
                      onClick={() => onDeleteProduct(p)}
                      title="Eliminar producto"
                      className="size-8 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl border border-slate-200 hover:border-rose-200 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* VISTA ESCRITORIO: TABLA LIMPIA Y CONCISA (>= md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4 w-16 text-center">Foto</th>
                <th className="py-3 px-4">Producto & Categoría</th>
                <th className="py-3 px-4">Precio Vigente</th>
                <th className="py-3 px-4 text-center">Stock Mostrador</th>
                <th className="py-3 px-4 text-center">Visible Tienda</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const hasDiscount =
                  Number(p.precio_anterior) > 0 &&
                  Number(p.precio_anterior) > Number(p.precio);

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      p.sin_stock ? "bg-rose-50/20" : ""
                    }`}
                  >
                    {/* Foto */}
                    <td className="py-3 px-4 text-center">
                      <div className="w-11 h-11 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 mx-auto">
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
                    </td>

                    {/* Producto & Categoría */}
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900 text-sm">
                        {p.nombre_producto}
                      </div>
                      <div className="text-[11px] text-slate-500 capitalize flex items-center gap-1.5 mt-0.5 font-medium">
                        <span>{p.categoria}</span>
                        <span className="text-slate-300">•</span>
                        <span className="uppercase text-[10px] font-bold text-slate-600">
                          Venta x {p.unidad_medida || "kg"}
                        </span>
                      </div>
                    </td>

                    {/* Precio Vigente */}
                    <td className="py-3 px-4">
                      <div className="font-black text-slate-900 text-sm">
                        {formatMoney(p.precio)}{" "}
                        <span className="text-[10px] font-medium text-slate-500">
                          /{p.unidad_medida || "kg"}
                        </span>
                      </div>
                      {hasDiscount && (
                        <div className="text-[11px] text-slate-400 line-through font-medium">
                          {formatMoney(p.precio_anterior)}
                        </div>
                      )}
                    </td>

                    {/* Stock Mostrador */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleStock(p)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                          !p.sin_stock
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            !p.sin_stock ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        ></span>
                        <span>{!p.sin_stock ? "En Stock" : "Agotado"}</span>
                      </button>
                    </td>

                    {/* Visible Tienda */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleActivo(p)}
                        title={
                          p.activo
                            ? "Visible en la tienda"
                            : "Oculto de la tienda"
                        }
                        className="inline-flex items-center justify-center p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer active:scale-95"
                      >
                        <span
                          className={`w-3 h-3 rounded-full transition-colors ${
                            p.activo ? "bg-[#002244]" : "bg-slate-300"
                          }`}
                        ></span>
                      </button>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => onEditProduct(p)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer active:scale-95"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Editar</span>
                        </button>

                        {onDeleteProduct && (
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(p)}
                            title="Eliminar corte"
                            className="size-8 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl border border-slate-200 hover:border-rose-200 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                          >
                            <Trash2 className="size-3.5" />
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

        <div className="p-3.5 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div>Mostrando {filteredProducts.length} productos en la lista</div>
          <div className="text-[11px] text-slate-400 hidden sm:block">
            💡 Tocá en "En Stock / Agotado" para pausar un corte de mostrador en 1 clic.
          </div>
        </div>
      </div>
    </div>
  );
}
