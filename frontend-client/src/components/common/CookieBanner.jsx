// frontend-client/src/components/common/CookieBanner.jsx
import React, { useState, useEffect } from "react";
import { Cookie, ShieldCheck, ChevronDown, ChevronUp, Check, Sliders } from "lucide-react";
import { getCookieConsent, setCookieConsent } from "../../utils/cookies";

export default function CookieBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Estados granulares de personalización
  const [analytics, setAnalytics] = useState(true);
  const [preferences, setPreferences] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    // Si ya existe consentimiento registrado, no mostrar
    const existing = getCookieConsent();
    if (!existing) {
      // Pequeño retardo no intrusivo (1.2s) para no competir con el primer renderizado LCP
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Escuchar evento para permitir al usuario reabrir el banner desde el pie de página
  useEffect(() => {
    const handleOpen = () => {
      const current = getCookieConsent();
      if (current) {
        setAnalytics(Boolean(current.analytics));
        setPreferences(Boolean(current.preferences));
        setMarketing(Boolean(current.marketing));
      }
      setShowConfig(true);
      setIsOpen(true);
    };

    window.addEventListener("valette_open_cookie_banner", handleOpen);
    return () => window.removeEventListener("valette_open_cookie_banner", handleOpen);
  }, []);

  const handleAcceptAll = () => {
    setCookieConsent({
      analytics: true,
      preferences: true,
      marketing: true,
    });
    setIsOpen(false);
  };

  const handleOnlyNecessary = () => {
    setCookieConsent({
      analytics: false,
      preferences: false,
      marketing: false,
    });
    setIsOpen(false);
  };

  const handleSaveCustom = () => {
    setCookieConsent({
      analytics,
      preferences,
      marketing,
    });
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <aside
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-lg z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/80 text-white rounded-2xl p-5 shadow-2xl ring-1 ring-white/10">
        {/* Cabecera */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/20 shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 id="cookie-banner-title" className="text-sm font-bold tracking-tight text-neutral-100">
                Tu privacidad en Abastecedora Valette
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full border border-neutral-700">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Seguro
              </span>
            </div>
            <p id="cookie-banner-desc" className="text-xs text-neutral-300 leading-relaxed">
              Utilizamos cookies para mantener tu carrito de compras activo, recordar tu sucursal habitual y optimizar las ofertas de cortes vacunos y promociones según tu preferencia.
            </p>
          </div>
        </div>

        {/* Panel de Configuración Granular Desplegable */}
        {showConfig && (
          <div className="mt-4 pt-4 border-t border-neutral-800 space-y-3">
            {/* Esenciales */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
              <div className="pr-3">
                <p className="text-xs font-semibold text-neutral-200">Técnicas y Esenciales</p>
                <p className="text-[11px] text-neutral-400">
                  Imprescindibles para el carrito, procesar pedidos y seguridad.
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold text-neutral-500 bg-neutral-800/80 px-2 py-1 rounded">
                Siempre Activas
              </span>
            </div>

            {/* Analíticas */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition">
              <div className="pr-3">
                <p className="text-xs font-semibold text-neutral-200">Analíticas y Rendimiento</p>
                <p className="text-[11px] text-neutral-400">
                  Nos ayudan a saber qué cortes se buscan más y agilizar la navegación.
                </p>
              </div>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-700 text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
              />
            </label>

            {/* Preferencias */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition">
              <div className="pr-3">
                <p className="text-xs font-semibold text-neutral-200">Preferencias de Sucursal</p>
                <p className="text-[11px] text-neutral-400">
                  Recuerda tu tienda más cercana (Luis Guillón) para acelerar tu compra.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences}
                onChange={(e) => setPreferences(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-700 text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
              />
            </label>

            {/* Marketing / Ofertas */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition">
              <div className="pr-3">
                <p className="text-xs font-semibold text-neutral-200">Promociones y Ofertas</p>
                <p className="text-[11px] text-neutral-400">
                  Permite atribuir los descuentos de banners de asado y combos activos.
                </p>
              </div>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-700 text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
              />
            </label>
          </div>
        )}

        {/* Acciones */}
        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => setShowConfig((prev) => !prev)}
            className="text-xs text-neutral-400 hover:text-neutral-200 inline-flex items-center gap-1.5 transition py-1 order-2 sm:order-1"
          >
            <Sliders className="w-3.5 h-3.5 text-neutral-400" />
            {showConfig ? "Ocultar detalles" : "Personalizar"}
            {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            {showConfig ? (
              <button
                type="button"
                onClick={handleSaveCustom}
                className="w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 border border-neutral-700"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Guardar selección
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOnlyNecessary}
                className="flex-1 sm:flex-none bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 text-xs font-medium px-3.5 py-2 rounded-xl transition border border-neutral-700/60"
              >
                Solo necesarias
              </button>
            )}

            <button
              type="button"
              onClick={handleAcceptAll}
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-red-900/30 transition flex items-center justify-center gap-1.5"
            >
              Aceptar todas
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
