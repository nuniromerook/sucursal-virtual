// src/components/home/BranchesSection.jsx
import React from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useLocation } from "@/context/LocationContext";
import { useToast } from "@/context/ToastContext";

export const BranchesSection = () => {
  const { selectBranch, sucursales, setDeliveryMode } = useLocation();
  const { showToast } = useToast();

  const handleSelect = (branch) => {
    selectBranch(branch);
    setDeliveryMode("pickup");
    showToast(`Sucursal activa cambiada a: ${branch.nombre} (Modo Retiro)`);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div>
          <span className="text-xs font-bold text-[#003366] uppercase tracking-wider">
            Atención Presencial & Retiro
          </span>
          <h3 className="text-lg font-black text-slate-900 mt-0.5">
            Nuestras Sucursales Físicas
          </h3>
          <p className="text-xs text-slate-500">
            Ambas sedes equipadas con mostradores de corte artesanal y retiro
            express.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDeliveryMode("pickup")}
            className="px-4 py-2 rounded-xl bg-[#003366] text-white text-xs font-bold hover:bg-valette-dark transition-colors cursor-pointer"
          >
            Retirar en Mostrador
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
        {sucursales.map((branch) => (
          <div
            key={branch.id}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-[#003366] uppercase tracking-wide">
                  {branch.id === 1 ? "Casa Central" : "Sucursal Oeste"}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  ● Abierto Ahora
                </span>
              </div>
              <h4 className="text-base font-extrabold text-slate-900">
                Sucursal {branch.nombre}
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {branch.direccion}, {branch.ciudad}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Horarios: {branch.horario}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Teléfono: {branch.telefono}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
              <a
                href={`https://wa.me/54${branch.telefono}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline"
              >
                <MessageCircle className="size-3.5" />
                <span>WhatsApp de mostrador</span>
                <ArrowRight className="size-3" />
              </a>
              <button
                type="button"
                onClick={() => handleSelect(branch)}
                className="px-3 py-1.5 rounded-lg bg-valette-blue border border-slate-200 text-white font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Elegir esta
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
