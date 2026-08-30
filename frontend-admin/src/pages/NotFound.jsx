// frontend-admin/src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Home, List, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center px-6 py-16 text-center select-none">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-xl space-y-6 animate-in fade-in zoom-in-95">
        <div className="relative mx-auto size-24 rounded-2xl bg-main-blue/10 flex items-center justify-center border border-main-blue/20">
          <img
            src="/favicon.svg"
            alt="Valette"
            className="size-16 object-contain"
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-main-red bg-red-50 border border-red-200 px-3 py-1 rounded-full">
            Error 404
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight pt-2">
            Página no encontrada
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
            La sección o comanda que estás buscando no existe, cambió de dirección o fue movida.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-main-blue hover:bg-main-blue/90 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <Home className="size-4" />
            <span>Inicio del Panel</span>
          </Link>

          <Link
            to="/catalogo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
          >
            <List className="size-4" />
            <span>Ver Catálogo</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
