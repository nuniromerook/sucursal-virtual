// admin/src/pages/MetricasPage.jsx
import React from "react";
import { Printer, TrendingUp, Scale, CheckCircle2, Clock } from "lucide-react";
import { useAdmin } from "../context/AdminContext";

export default function MetricasPage() {
  const { selectedSucursal } = useAdmin();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Cierre Operativo & Despachos de Carnicería
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Balance de kilogramos despachados y rendimiento diario en {selectedSucursal?.nombre || "Sucursal"}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer w-fit"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Imprimir Reporte</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Facturación Estimada Hoy</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">$ 184.500</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-bold">↑ 14% vs día anterior</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Kilos de Carne Despachados</span>
            <Scale className="w-4 h-4 text-[#002244]" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">42.8 kg</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Vacuno: 28kg | Cerdo: 14.8kg</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Pedidos Completados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">16 pedidos</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Ticket promedio: $ 11.530</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Tiempo Promedio de Corte</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">18 min</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Dentro del objetivo de mostrador</div>
        </div>
      </div>
    </div>
  );
}
