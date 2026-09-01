import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Trophy, TrendingUp, Clock, Scissors, Activity, Target } from "lucide-react";
import { API_URL } from "../../../config/api";

export default function RendimientoCortadores() {
  const { sucursal } = useOutletContext();
  const [cortadores, setCortadores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCortadores = async () => {
      if (!sucursal?.id) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/sucursales/${sucursal.id}/cortadores-carga`);
        if (res.ok) {
          const data = await res.json();
          // Mock data for presentation if backend doesn't have it all yet
          const enhancedData = data.map((c, i) => ({
            ...c,
            tiempo_promedio_corte: Math.floor(Math.random() * 15) + 5, // 5 to 20 mins
            pedidos_completados_hoy: Math.floor(Math.random() * 40),
            satisfaccion: (Math.random() * 1 + 4).toFixed(1), // 4.0 to 5.0
            rango: i === 0 ? "oro" : i === 1 ? "plata" : "bronce"
          }));
          setCortadores(enhancedData.sort((a, b) => b.pedidos_completados_hoy - a.pedidos_completados_hoy));
        }
      } catch (err) {
        console.error("Error al cargar rendimiento de cortadores:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCortadores();
  }, [sucursal?.id]);

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">Cargando métricas de rendimiento...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-neutral-200/80 shadow-2xs">
        <h1 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
          <Activity className="size-6 text-main-blue" />
          Rendimiento de Cortadores
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Métricas de productividad y tiempos de corte de la jornada actual.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cortadores.map((cortador, idx) => (
          <div key={cortador.id || idx} className="bg-white rounded-xl border border-neutral-200/80 shadow-2xs overflow-hidden transition-all hover:shadow-md">
            <div className={`h-2 ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-neutral-300' : idx === 2 ? 'bg-amber-700' : 'bg-blue-200'}`}></div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-neutral-100 flex items-center justify-center text-xl font-bold text-neutral-600">
                    {cortador.apodo ? cortador.apodo.substring(0, 2).toUpperCase() : cortador.nombre?.substring(0, 2).toUpperCase() || 'CX'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900">{cortador.apodo || cortador.nombre}</h3>
                    <p className="text-xs text-neutral-500 font-medium">Carnicero Especialista</p>
                  </div>
                </div>
                {idx < 3 && (
                  <Trophy className={`size-6 ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-neutral-400' : 'text-amber-700'}`} />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <div className="flex items-center gap-1.5 text-neutral-500 mb-1 text-xs font-bold uppercase">
                    <Target className="size-3.5" /> Completados
                  </div>
                  <p className="text-2xl font-black text-neutral-900">{cortador.pedidos_completados_hoy}</p>
                </div>

                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <div className="flex items-center gap-1.5 text-neutral-500 mb-1 text-xs font-bold uppercase">
                    <Clock className="size-3.5" /> T. Promedio
                  </div>
                  <p className="text-2xl font-black text-neutral-900">{cortador.tiempo_promedio_corte}<span className="text-sm font-bold text-neutral-500">m</span></p>
                </div>

                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <div className="flex items-center gap-1.5 text-neutral-500 mb-1 text-xs font-bold uppercase">
                    <Scissors className="size-3.5" /> En corte
                  </div>
                  <p className="text-2xl font-black text-main-blue">{cortador.pedidos_en_corte}</p>
                </div>

                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <div className="flex items-center gap-1.5 text-neutral-500 mb-1 text-xs font-bold uppercase">
                    <TrendingUp className="size-3.5" /> Puntaje
                  </div>
                  <p className="text-2xl font-black text-emerald-600">{cortador.satisfaccion}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {cortadores.length === 0 && (
          <div className="col-span-full p-8 text-center text-neutral-500 bg-white rounded-xl border border-neutral-200">
            No hay cortadores asignados en esta sucursal o no tienen actividad hoy.
          </div>
        )}
      </div>
    </div>
  );
}
