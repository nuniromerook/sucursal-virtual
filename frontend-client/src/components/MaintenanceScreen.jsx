// frontend-client/src/components/MaintenanceScreen.jsx
import React, { useState } from "react";
import {
  Store,
  ExternalLink,
  MessageCircle,
  MapPin,
  Clock,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
} from "lucide-react";
import icons from "../assets/icons/icons";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col justify-between selection:bg-amber-400 selection:text-slate-900 font-sans">
      {/* ─── Encabezado Sutil ─── */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer select-none group"
          title="Abastecedora Valette"
        >
          <div className="size-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center transition-transform group-hover:scale-105">
            <img src="/favicon.svg" alt="Valette" className="size-full object-contain" />
          </div>
          <div>
            <span className="font-black text-lg sm:text-xl tracking-tight text-white block leading-tight">
              ABASTECEDORA VALETTE
            </span>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block">
              Carnicería & Producción Propia
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="text-white/60 hover:text-white text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          <Lock className="size-3.5" />
          <span className="hidden sm:inline">Acceso Equipo</span>
        </button>
      </header>

      {/* ─── Contenido Central ─── */}
      <main className="w-full max-w-2xl mx-auto px-6 py-8 flex-1 flex flex-col items-center justify-center text-center">
        {/* Badge de estado */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-bold mb-6 backdrop-blur-md shadow-xs">
          <Sparkles className="size-4 text-amber-400 animate-pulse" />
          <span>Nueva Tienda Online en Preparación</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight mb-4">
          Estamos preparando nuestra nueva tienda virtual 🥩
        </h1>

        <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl mb-8">
          Nos encontramos realizando tareas de mantenimiento y puesta a punto de nuestro sistema de pedidos online. Muy pronto vas a poder comprar todos nuestros cortes seleccionados desde tu celular o computadora.
        </p>

        {/* ─── Tarjeta de redirección al sitio oficial ─── */}
        <div className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 sm:p-7 shadow-2xl mb-8 text-left transition-all hover:border-amber-400/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-1">
                Sitio Web Oficial
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                abastecedoravalette.com
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Conocé nuestra historia, productos y canales de atención habilitados.
              </p>
            </div>

            <a
              href="https://abastecedoravalette.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm sm:text-base shadow-lg transition-transform active:scale-95 shrink-0"
            >
              <span>Visitar Sitio Oficial</span>
              <ExternalLink className="size-4" />
            </a>
          </div>
        </div>

        {/* ─── Canales de Atención Directa ─── */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <a
            href="https://wa.me/5491155291717?text=Hola!%20Quería%20hacer%20una%20consulta%20sobre%20pedidos%20en%20Abastecedora%20Valette"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-colors border border-emerald-400/30"
          >
            <MessageCircle className="size-4" />
            <span>Consultas por WhatsApp</span>
          </a>

          <a
            href="https://www.instagram.com/abastecedora.valette/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-pink-600/80 hover:bg-pink-500 text-white font-bold text-sm shadow-md transition-colors border border-pink-400/30"
          >
            <img src={icons.instagram} alt="Instagram" className="size-4 filter brightness-0 invert" />
            <span>Seguinos en Instagram</span>
          </a>
        </div>
      </main>

      {/* ─── Footer Informativo ─── */}
      <footer className="w-full border-t border-white/10 bg-slate-950/40 backdrop-blur-md py-6 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-amber-400" />
              <span>Av. Luciano Valette 1696, Luis Guillón</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-amber-400" />
              <span>Lun a Sáb de 07:00 a 15:00 hs</span>
            </span>
          </div>

          <p>© {new Date().getFullYear()} Abastecedora Valette. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* ─── Modal de Acceso de Equipo / PIN Secreto ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-sm w-full p-6 text-white shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setErrorMsg("");
                setPasskey("");
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
                <Lock className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Acceso de Equipo</h3>
                <p className="text-xs text-slate-400">Desarrollo y Vista Previa</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Ingresá la clave de desarrollo para navegar la tienda virtual en este dispositivo:
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  autoFocus
                  value={passkey}
                  onChange={(e) => {
                    setPasskey(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder="Ingresá la clave de acceso..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-sm"
                />
                {errorMsg && (
                  <p className="text-xs text-rose-400 font-medium mt-1.5">
                    {errorMsg}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setErrorMsg("");
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-xs font-bold text-slate-950 transition-colors shadow-md"
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
