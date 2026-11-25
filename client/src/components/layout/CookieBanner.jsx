// src/components/layout/CookieBanner.jsx
import React, { useState } from "react";
import { Cookie, X, ChevronDown } from "lucide-react";
import {
  getCookieConsent,
  setCookieConsent,
  isBannerDismissedForSession,
  dismissBannerForSession,
} from "@/utils/cookieConsent";
import { trackPageView } from "@/utils/analytics";

export const CookieBanner = () => {
  const [visible, setVisible] = useState(
    () => getCookieConsent() === null && !isBannerDismissedForSession(),
  );

  if (!visible) return null;

  const handleAccept = () => {
    setCookieConsent("accepted");
    setVisible(false);
    if (typeof window !== "undefined") {
      trackPageView(`${window.location.pathname}${window.location.search || ""}`);
    }
  };

  const handleEssentialOnly = () => {
    setCookieConsent("essential");
    setVisible(false);
  };

  const handleDismiss = () => {
    dismissBannerForSession();
    setVisible(false);
  };

  return (
    <aside
      role="region"
      aria-label="Aviso de cookies"
      className="fixed bottom-19 left-3 right-3 lg:bottom-5 lg:left-5 lg:right-auto lg:w-[400px] z-45 animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl p-3.5 sm:p-4">
        <div className="flex items-start gap-3">
          <div
            className="size-9 rounded-xl bg-[#EFF4F9] text-[#003366] flex items-center justify-center shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <Cookie className="size-4.5 stroke-[2.2]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13px] font-extrabold text-slate-900 leading-snug">
                Usamos cookies para agilizar tu compra
              </p>
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Cerrar aviso de cookies"
                title="Cerrar"
                className="size-6 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center shrink-0 transition-colors cursor-pointer -mr-1 -mt-0.5"
              >
                <X className="size-3.5 stroke-[2.25]" aria-hidden="true" />
              </button>
            </div>

            <p className="text-[11.5px] text-slate-500 leading-relaxed mt-0.5">
              Recordamos tu carrito, tu dirección y métricas anónimas de uso.
            </p>

            {/* Detalle colapsable nativo sin JS extra */}
            <details className="group mt-2 text-[11px] text-slate-500">
              <summary className="inline-flex items-center gap-1 font-bold text-[#003366] hover:underline cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
                <span>Ver qué guardamos</span>
                <ChevronDown
                  className="size-3 transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <ul className="mt-2 space-y-1 bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 text-[11px] text-slate-600">
                <li>
                  <strong className="text-slate-800">Esenciales:</strong>{" "}
                  carrito, sesión, favoritos y dirección de entrega.
                </li>
                <li>
                  <strong className="text-slate-800">Analíticas:</strong>{" "}
                  visitas y búsquedas anónimas para mejorar el catálogo.
                </li>
              </ul>
            </details>

            {/* Acciones claras y equilibradas */}
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleAccept}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#003366] hover:bg-valette-dark text-white text-xs font-extrabold shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
              >
                Aceptar
              </button>
              <button
                type="button"
                onClick={handleEssentialOnly}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold active:scale-[0.98] transition-all cursor-pointer"
              >
                Solo esenciales
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CookieBanner;
