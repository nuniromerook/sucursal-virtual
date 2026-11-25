// src/components/home/BranchesSection.jsx
import React from "react";
import { ArrowRight, MessageCircle, MapPin, Clock } from "lucide-react";
import { useLocation, CASA_CENTRAL_BRANCH } from "@/context/LocationContext";
import { getBranchOpenStatus } from "@/utils/horarios";

export const BranchesSection = () => {
  const { selectedBranch } = useLocation();
  const branch = selectedBranch || CASA_CENTRAL_BRANCH;
  const openStatus = getBranchOpenStatus(branch);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
        <div>
          <span className="text-xs font-bold text-[#003366] uppercase tracking-wider">
            Sucursal Central · Zona Sur
          </span>
          <div className=" flex justify-between items-center text-xl font-black text-slate-900 mt-1">
            Luis Guillon{" "}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                  openStatus.isOpen
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                ● {openStatus.badgeText}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sucursal abierta al público, retiro express sin fila y envíos a
            domicilio en el día.
          </p>
        </div>
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs text-slate-600">
            <p className="flex items-center gap-1.5 font-medium">
              <MapPin className="size-4 text-[#003366] shrink-0" />
              <span>
                {branch.direccion ||
                  "Av. Luciano Valette 1696, Luis Guillon, Provincia de Buenos Aires"}
              </span>
            </p>
            <p className="flex items-center gap-1.5 font-medium">
              <Clock className="size-4 text-[#003366] shrink-0" />
              <span>
                {branch.horario_atencion ||
                  branch.horario ||
                  "Lunes a Sábados de 07:00 a 15:00hs y Domingos de 08:00 a 13:00hs"}
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
    </>
  );
};
