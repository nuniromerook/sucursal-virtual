import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Package, Sparkles, Percent, Save } from "lucide-react";
import { API_URL } from "../../../config/api";
import { formatMoney } from "../../../utils/formatters";

export default function CombosBuilder() {
  const [productos, setProductos] = useState([]);
  const [comboName, setComboName] = useState("");
  const [comboDesc, setComboDesc] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]); // { producto, cantidad }
  const [descuentoGlobal, setDescuentoGlobal] = useState(10); // % de descuento

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch(`${API_URL}/catalogo`);
        if (res.ok) {
          const data = await res.json();
          setProductos(data);
        }
      } catch (err) {
        console.error("Error al cargar catálogo:", err);
      }
    };
    fetchCatalog();
  }, []);

  const addItem = (prod) => {
    if (items.find((i) => i.producto.id === prod.id)) return;
    setItems([...items, { producto: prod, cantidad: 1 }]);
  };

  const updateItemQty = (id, delta) => {
    setItems(items.map((i) => {
      if (i.producto.id === id) {
        return { ...i, cantidad: Math.max(0.5, Number(i.cantidad) + delta) };
      }
      return i;
    }));
  };

  const removeItem = (id) => {
    setItems(items.filter((i) => i.producto.id !== id));
  };

  const subtotalOriginal = items.reduce((acc, item) => acc + (Number(item.producto.precio) * item.cantidad), 0);
  const totalConDescuento = subtotalOriginal * (1 - descuentoGlobal / 100);

  const filteredProducts = productos.filter((p) => 
    p.nombre_producto.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 flex items-center gap-2">
            <Package className="size-6 text-main-blue" />
            Creador de Combos
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Armá promociones agrupando productos. El descuento se calcula automáticamente.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-main-blue hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm">
          <Save className="size-4" />
          Guardar Combo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lado izquierdo: Buscador de productos */}
        <div className="lg:col-span-1 border border-neutral-200 bg-white rounded-xl shadow-2xs overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
            <h2 className="font-bold text-neutral-800 mb-3 text-sm uppercase tracking-wide">
              Catálogo de Productos
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <input 
                type="text"
                placeholder="Buscar carne, pollo, cerdo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-300 text-sm focus:ring-2 focus:ring-main-blue/30 outline-none"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {filteredProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 hover:bg-neutral-50 rounded-lg group transition-colors">
                <div className="flex items-center gap-3">
                  <img src={p.imagen_url || "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=200"} className="size-10 rounded-md object-cover" alt="" />
                  <div>
                    <p className="text-sm font-bold text-neutral-900">{p.nombre_producto}</p>
                    <p className="text-xs text-neutral-500">{formatMoney(p.precio)} / {p.unidad_medida}</p>
                  </div>
                </div>
                <button 
                  onClick={() => addItem(p)}
                  className="size-8 rounded-full bg-blue-50 text-main-blue flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-main-blue hover:text-white"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Lado derecho: Estructura del combo */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-neutral-200 bg-white rounded-xl shadow-2xs p-5">
            <h2 className="font-bold text-neutral-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="size-4 text-amber-500" />
              Detalles del Combo
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Nombre del Combo</label>
                <input 
                  type="text"
                  placeholder="Ej: Combo Asado Familiar"
                  value={comboName}
                  onChange={(e) => setComboName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:ring-2 focus:ring-main-blue/30 outline-none font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Descuento Global (%)</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={descuentoGlobal}
                    onChange={(e) => setDescuentoGlobal(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm font-bold focus:ring-2 focus:ring-emerald-500/30 outline-none"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Descripción corta</label>
                <input 
                  type="text"
                  placeholder="Ej: Ideal para 4 personas, incluye chorizo y morcilla."
                  value={comboDesc}
                  onChange={(e) => setComboDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:ring-2 focus:ring-main-blue/30 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border border-neutral-200 bg-white rounded-xl shadow-2xs overflow-hidden flex flex-col h-[380px]">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <h2 className="font-bold text-neutral-800 text-sm uppercase tracking-wide">
                Productos en el Combo ({items.length})
              </h2>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-50">
                  <Package className="size-12 mb-2 text-neutral-400" />
                  <p className="text-sm font-medium text-neutral-500">Agregá productos desde el catálogo</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.producto.id} className="flex items-center justify-between border border-neutral-200 p-3 rounded-xl bg-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <img src={item.producto.imagen_url || "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=200"} className="size-12 rounded-md object-cover" alt="" />
                      <div>
                        <p className="text-sm font-bold text-neutral-900">{item.producto.nombre_producto}</p>
                        <p className="text-xs text-neutral-500">{formatMoney(item.producto.precio)} / {item.producto.unidad_medida}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateItemQty(item.producto.id, -0.5)} className="size-7 rounded bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center font-bold text-neutral-600">-</button>
                        <span className="w-10 text-center font-bold text-sm">{item.cantidad} {item.producto.unidad_medida}</span>
                        <button onClick={() => updateItemQty(item.producto.id, 0.5)} className="size-7 rounded bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center font-bold text-neutral-600">+</button>
                      </div>
                      
                      <div className="w-24 text-right">
                        <p className="font-bold text-neutral-900">{formatMoney(item.producto.precio * item.cantidad)}</p>
                      </div>

                      <button onClick={() => removeItem(item.producto.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totalizador Footer */}
            <div className="border-t border-neutral-200 bg-neutral-900 p-5 text-white flex items-end justify-between">
              <div>
                <p className="text-sm text-neutral-400 mb-1">Resumen del Combo</p>
                <p className="text-xs text-neutral-400">
                  Subtotal regular: <span className="line-through">{formatMoney(subtotalOriginal)}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2 mb-1">
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Ahorro: {formatMoney(subtotalOriginal - totalConDescuento)}
                  </span>
                </div>
                <p className="text-3xl font-black tracking-tight text-white">
                  {formatMoney(totalConDescuento)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
