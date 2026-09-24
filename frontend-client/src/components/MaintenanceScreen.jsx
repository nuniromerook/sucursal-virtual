// frontend-client/src/components/MaintenanceScreen.jsx
import React, { useState } from "react";
import {
  ExternalLink,
  MapPin,
  Clock,
  Lock,
  ArrowRight,
  X,
} from "lucide-react";

export default function MaintenanceScreen({ onUnlock }) {
  const [showModal, setShowModal] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [clickCount, setClickCount] = useState(0);

  const handleLogoClick = () => {
    const nextCount = clickCount + 1;
    if (nextCount >= 3) {
      setShowModal(true);
      setClickCount(0);
    } else {
      setClickCount(nextCount);
      setTimeout(() => setClickCount(0), 3000);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const cleanKey = passkey.trim().toLowerCase();
    if (cleanKey === "valette2026" || cleanKey === "valette" || cleanKey === "admin2026") {
      onUnlock();
    } else {
      setErrorMsg("Clave incorrecta. Intentá nuevamente.");
      setPasskey("");
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-800 flex flex-col justify-between items-center px-4 py-8 sm:py-12 selection:bg-main-blue selection:text-white font-sans">
      {/* ─── Botón de Acceso Discreto (Esquina Superior) ─── */}
      <div className="w-full max-w-2xl flex justify-end">
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="text-neutral-300 hover:text-neutral-600 transition-colors p-2 rounded-lg"
          title="Acceso"
          aria-label="Acceso"
        >
          <Lock className="size-4" />
        </button>
      </div>

      {/* ─── Contenedor Central Minimalista ─── */}
      <main className="w-full max-w-xl mx-auto flex flex-col items-center text-center my-auto py-6">
        {/* Logo con interacción de 3 clics */}
        <div
          onClick={handleLogoClick}
          className="cursor-pointer select-none mb-6 transition-transform hover:scale-105 active:scale-95"
          title="Abastecedora Valette"
        >
          <img
            src="/favicon.svg"
            alt="Abastecedora Valette"
            className="size-20 sm:size-24 mx-auto object-contain drop-shadow-xs"
          />
        </div>

        {/* Marca y Estado */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 uppercase mb-1">
          Abastecedora Valette
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-8">
          Sitio web en mantenimiento
        </p>

        {/* Botón Estético Principal */}
        <a
          href="https://abastecedoravalette.com"
          className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-main-blue hover:bg-main-blue/90 text-white font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all active:scale-98 group mb-10"
        >
          <span>Visitar sitio web oficial (abastecedoravalette.com)</span>
          <ArrowRight className="size-4 text-white/80 group-hover:translate-x-1 transition-transform" />
        </a>

        {/* Separador fino */}
        <div className="w-16 h-px bg-neutral-200 mb-8" />

        {/* ─── Sucursales y Horarios (Luis Guillón y Moreno) ─── */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {/* Sucursal Luis Guillón */}
          <div className="border border-neutral-200/90 rounded-xl p-4 bg-neutral-50/50">
            <h2 className="text-xs font-bold text-main-blue uppercase tracking-wider mb-2">
              Sucursal Luis Guillón
            </h2>
            <p className="text-sm font-semibold text-neutral-800 flex items-start gap-2 mb-1.5">
              <MapPin className="size-4 text-neutral-500 shrink-0 mt-0.5" />
              <span>Av. Luciano Valette 1696</span>
            </p>
            <p className="text-xs text-neutral-500 flex items-center gap-2">
              <Clock className="size-3.5 text-neutral-400 shrink-0" />
              <span>Lun. a Sáb. de 07:00 a 15:00 hs</span>
            </p>
          </div>

          {/* Sucursal Moreno */}
          <div className="border border-neutral-200/90 rounded-xl p-4 bg-neutral-50/50">
            <h2 className="text-xs font-bold text-main-blue uppercase tracking-wider mb-2">
              Sucursal Moreno
            </h2>
            <p className="text-sm font-semibold text-neutral-800 flex items-start gap-2 mb-1.5">
              <MapPin className="size-4 text-neutral-500 shrink-0 mt-0.5" />
              <span>Av. del Libertador 4200</span>
            </p>
            <p className="text-xs text-neutral-500 flex items-center gap-2">
              <Clock className="size-3.5 text-neutral-400 shrink-0" />
              <span>Lun. a Sáb. de 06:00 a 15:00 hs</span>
            </p>
          </div>
        </div>
      </main>

      {/* ─── Pie de Página Simple ─── */}
      <footer className="w-full max-w-xl text-center py-4 text-xs text-neutral-400">
        © {new Date().getFullYear()} Abastecedora Valette. Todos los derechos reservados.
      </footer>

      {/* ─── Modal de PIN / Clave ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-neutral-200 rounded-2xl max-w-xs w-full p-6 text-neutral-900 shadow-xl relative">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setErrorMsg("");
                setPasskey("");
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="size-8 rounded-lg bg-main-blue/10 text-main-blue flex items-center justify-center">
                <Lock className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900">Acceso</h3>
            </div>

            <p className="text-xs text-neutral-500 mb-4 leading-normal">
              Ingresá la clave para acceder a la vista previa:
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <input
                  type="password"
                  autoFocus
                  value={passkey}
                  onChange={(e) => {
                    setPasskey(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder="Clave de acceso..."
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue text-sm"
                />
                {errorMsg && (
                  <p className="text-xs text-red-600 font-medium mt-1">
                    {errorMsg}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setErrorMsg("");
                  }}
                  className="flex-1 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-main-blue hover:bg-main-blue/90 text-xs font-bold text-white transition-colors"
                >
                  Ingresar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
