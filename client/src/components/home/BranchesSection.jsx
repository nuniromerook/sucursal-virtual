// src/components/home/BranchesSection.jsx
import React from "react";
import {
  ArrowRight,
  MessageCircle,
  MapPin,
  Clock,
  Store,
  Truck,
} from "lucide-react";
import { useLocation, CASA_CENTRAL_BRANCH } from "@/context/LocationContext";
import { useToast } from "@/context/ToastContext";

export const BranchesSection = () => {
  const { selectedBranch, deliveryMode, setDeliveryMode } = useLocation();
  const { showToast } = useToast();

  const branch = selectedBranch || CASA_CENTRAL_BRANCH;

  const handleModeChange = (mode) => {
    setDeliveryMode(mode);
    showToast(
      mode === "pickup"
        ? "Modalidad seleccionada: Retiro en Casa Central"
        : "Modalidad seleccionada: Envío a Domicilio desde Casa Central",
    );
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div>
          <span className="text-xs font-bold text-[#003366] uppercase tracking-wider">
            Casa Central · Zona Sur
          </span>
          <h3 className="text-lg font-black text-slate-900 mt-0.5">
            Sucursal Luis Guillon
          </h3>
          <p className="text-xs text-slate-500">
            Mostrador de corte artesanal, retiro express sin fila y envíos a
            domicilio en el día.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleModeChange("pickup")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              deliveryMode === "pickup"
                ? "bg-[#003366] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Store className="size-3.5" />
            <span>Retiro en Mostrador</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("delivery")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              deliveryMode === "delivery"
                ? "bg-[#003366] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Truck className="size-3.5" />
            <span>Envío a Domicilio</span>
          </button>
        </div>
      </div>

      <div className="pt-5">
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-[#003366]/10 text-[#003366] text-[11px] font-black uppercase tracking-wide">
                Casa Central Oficial
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                ● Abierto Ahora
              </span>
            </div>

            <h4 className="text-lg font-extrabold text-slate-900">
              Abastecedora Valette — {branch.nombre}
            </h4>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs text-slate-600">
              <p className="flex items-center gap-1.5 font-medium">
                <MapPin className="size-4 text-[#003366] shrink-0" />
                <span>
                  Av. Luciano Valette 1696, Luis Guillon, Provincia de Buenos
                  Aires
                </span>
              </p>
              <p className="flex items-center gap-1.5 font-medium">
                <Clock className="size-4 text-[#003366] shrink-0" />
                <span>
                  Lunes a Sábados de 07:00 a 15:00hs y Domingos de 08:00 a
                  13:00hs
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
            <a
              href={`https://wa.me/549${branch.telefono || "1135534033"}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
            >
              <MessageCircle className="size-4" />
              <span>WhatsApp Mostrador</span>
              <ArrowRight className="size-3.5" />
            </a>
            <a
              href="https://maps.google.com/?q=Av.+Luciano+Valette+1696,+Luis+Guillon,+Provincia+de+Buenos+Aires"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Cómo llegar
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
