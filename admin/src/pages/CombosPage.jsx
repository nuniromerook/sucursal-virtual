// admin/src/pages/CombosPage.jsx
import React, { useState, useEffect } from "react";
import { Plus, Tag, RefreshCw } from "lucide-react";
import { VITE_API_URL } from "../config/api";
import { useAdmin } from "../context/AdminContext";
import { useAuth } from "../context/AuthContext";
import { formatMoney } from "../utils/formatters";

export default function CombosPage() {
  const { selectedSucursal, showToast } = useAdmin();
  const { authHeaders } = useAuth();
  const [combos, setCombos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCombos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${VITE_API_URL}/combos`);
      if (res.ok) {
        const data = await res.json();
        setCombos(Array.isArray(data) ? data : []);
      } else {
        // Fallback demo combos
        setCombos([
          {
            id: 1,
            nombre: "Combo Asado Familiar",
            descripcion: "2 kg Asado de Tira + 1 kg Vacío + 4 Chorizos Bombón",
            precio: 42500,
            precio_anterior: 48000,
            ahorro: "$ 5.500",
            activo: true,
            imagen_url: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400",
          },
          {
            id: 2,
            nombre: "Combo Milanesas Semanales",
            descripcion: "2 kg Nalga Feteada + 1 kg Suprema Fileteada",
            precio: 28500,
            precio_anterior: 31000,
            ahorro: "$ 2.500",
            activo: true,
            imagen_url: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=400",
          },
          {
            id: 3,
            nombre: "Combo Parrillero Cerdo",
            descripcion: "2 kg Pechito con Manta + 1 kg Matambre + 4 Chorizos",
            precio: 31900,
            precio_anterior: 35000,
            ahorro: "$ 3.100",
            activo: true,
            imagen_url: "https://images.unsplash.com/photo-1514944298352-78d1232876b5?q=80&w=400",
          },
        ]);
      }
    } catch {
      // Fallback
      setCombos([
        {
          id: 1,
          nombre: "Combo Asado Familiar",
          descripcion: "2 kg Asado de Tira + 1 kg Vacío + 4 Chorizos Bombón",
          precio: 42500,
          precio_anterior: 48000,
          ahorro: "$ 5.500",
          activo: true,
          imagen_url: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCombos();
  }, [selectedSucursal]);

  const toggleComboActivo = (id) => {
    setCombos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, activo: !c.activo } : c))
    );
    showToast("Estado de combo actualizado.");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Combos Ahorro & Ofertas Especiales
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Paquetes armados con descuento global para incentivar el ticket promedio.
          </p>
        </div>

        <button
          type="button"
          onClick={() => showToast("Editor de armado de combos")}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#002244] hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Armar Nuevo Combo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {combos.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs flex flex-col"
          >
            <div className="h-40 bg-slate-100 overflow-hidden relative">
              <img
                src={c.imagen_url || "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400"}
                alt={c.nombre}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                Ahorro: {c.ahorro || "$ 3.000"}
              </span>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="font-extrabold text-slate-900 text-sm">{c.nombre}</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">{c.descripcion}</div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-black text-slate-900 text-base">
                    {formatMoney(c.precio)}
                  </div>
                  {c.precio_anterior > c.precio && (
                    <div className="text-[11px] text-slate-400 line-through font-medium">
                      {formatMoney(c.precio_anterior)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleComboActivo(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all active:scale-95 ${
                      c.activo
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    {c.activo ? "Activo" : "Pausado"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
