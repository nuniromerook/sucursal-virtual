// frontend-client/src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ArrowLeft, Home, User, AlertCircle } from "lucide-react";

export default function NotFound({
  title = "Página no encontrada",
  message = "La página o comprobante que estás buscando no existe, fue movido o no tenés permisos para visualizarlo.",
  showHomeButton = true,
  showProfileButton = true,
}) {
  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center bg-white rounded-lg p-6 sm:p-8 border border-neutral-200/80 shadow-2xs space-y-5">
        <div className="size-16 rounded-full bg-red-50 text-main-red border border-red-200/80 flex items-center justify-center mx-auto shadow-2xs">
          <AlertCircle className="size-8 stroke-[2.2px]" />
        </div>

        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-main-red bg-red-50 px-2.5 py-0.5 rounded border border-red-200">
            Error 404
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight mt-2">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1.5 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
          {showHomeButton && (
            <Link
              to="/"
              className="px-5 py-2.5 rounded-lg bg-main-blue hover:bg-main-blue/90 text-white font-bold text-xs shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Home className="size-4" />
              <span>Volver a la Tienda</span>
            </Link>
          )}

          {showProfileButton && (
            <Link
              to="/perfil?tab=pedidos"
              className="px-5 py-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <User className="size-4" />
              <span>Ver mis compras</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
