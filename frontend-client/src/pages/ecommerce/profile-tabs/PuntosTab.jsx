// frontend-client/src/pages/ecommerce/profile-tabs/PuntosTab.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Gift,
  TrendingUp,
  Star,
  Copy,
  Check,
  Share2,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { VITE_API_URL } from "../../../config/api";

export default function PuntosTab() {
  const { user, token } = useAuth();
  const toast = useToast();

  const [historialPuntos, setHistorialPuntos] = useState([]);
  const [loadingPuntos, setLoadingPuntos] = useState(false);
  const [copied, setCopied] = useState(false);

  const puntos = Number(user?.puntos_acumulados) || 0;

  const fetchHistorialPuntos = useCallback(async () => {
    if (!token) return;
    setLoadingPuntos(true);
    try {
      const res = await fetch(`${VITE_API_URL}/clientes/puntos/historial`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistorialPuntos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error al cargar historial de puntos:", err);
    } finally {
      setLoadingPuntos(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHistorialPuntos();
  }, [fetchHistorialPuntos]);

  const copyReferralCode = () => {
    if (!user?.referral_code) return;
    navigator.clipboard.writeText(user.referral_code).then(() => {
      setCopied(true);
      toast.success("¡Código copiado al portapapeles!", {
        duration: 3000,
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareWhatsApp = () => {
    const code = user?.referral_code || "";
    const text = encodeURIComponent(
      `¡Sumate a Abastecedora Valette y ganá 50 puntos! Usá mi código al registrarte: ${code} 🥩 ${window.location.origin}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-5">
      {/* 1. Saldo de puntos */}
      <div className="bg-white border border-amber-300/80 rounded-lg p-5 sm:p-6 shadow-2xs flex items-center gap-4 bg-gradient-to-r from-amber-500/5 to-transparent">
        <div className="size-12 sm:size-14 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0 font-bold">
          <Sparkles className="size-6 sm:size-7" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">
            Tu saldo disponible
          </p>
          <p className="text-2xl sm:text-3xl font-black text-amber-950 leading-none">
            {puntos}
            <span className="text-sm sm:text-base font-bold text-amber-700 ml-1.5">
              puntos Valette
            </span>
          </p>
          <p className="text-xs text-amber-700/80 mt-1">
            Sumás puntos con cada compra identificada y por invitar amigos con
            tu código ✨
          </p>
        </div>
      </div>

      {/* 2. Código de referido */}
      {user?.referral_code && (
        <div className="bg-white border border-neutral-200/80 rounded-lg p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="size-5 text-main-blue" />
            <h3 className="font-black text-base text-neutral-900">
              Tu Código de Referido
            </h3>
          </div>
          <p className="text-xs text-neutral-500 mb-4">
            Compartí tu código con amigos. Cuando se registren y completen su
            perfil, ¡ambos ganan 50 puntos!
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-base font-black tracking-widest text-neutral-900 font-mono flex-1">
              <span>{user.referral_code}</span>
              <button
                type="button"
                onClick={copyReferralCode}
                className="text-xs font-bold text-main-blue hover:text-main-blue/80 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <Check className="size-4 text-emerald-600" />
                ) : (
                  <Copy className="size-4" />
                )}
                <span>{copied ? "Copiado" : "Copiar"}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={shareWhatsApp}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Share2 className="size-4" />
              <span>Compartir por WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Historial de movimientos detallado */}
      <div className="bg-white border border-neutral-200/80 rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-neutral-100 flex flex-col lg:flex-row lg:items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4.5 text-main-blue" />
            <h3 className="font-bold text-sm sm:text-base text-neutral-800">
              Historial de Movimientos de Puntos
            </h3>
          </div>
          <span className="text-xs font-bold text-neutral-400">
            {historialPuntos.length} movimientos
          </span>
        </div>

        {loadingPuntos ? (
          <div className="py-8 text-center text-neutral-400 text-xs animate-pulse">
            Cargando historial de puntos...
          </div>
        ) : historialPuntos.length === 0 ? (
          <div className="py-10 text-center text-neutral-400">
            <Star className="size-7 mx-auto mb-2 opacity-30 stroke-1" />
            <p className="text-xs sm:text-sm font-medium">
              Aún no tenés movimientos de puntos.
            </p>
            <p className="text-xs mt-0.5 text-neutral-400">
              ¡Hacé tu primera compra para empezar a sumar!
            </p>
          </div>
        ) : (
          <div className="flex flex-col overflow-x-auto divide-y divide-neutral-100">
            {historialPuntos.map((mov) => {
              const esGanado = Number(mov.puntos) > 0;
              const detalleMotivo =
                mov.descripcion ||
                mov.motivo ||
                (mov.tipo === "registro"
                  ? "Puntos de bienvenida por registro"
                  : mov.tipo === "perfil_completo"
                    ? "Bonificación por completar perfil"
                    : mov.tipo === "referido"
                      ? "Recompensa por amigo referido"
                      : mov.tipo === "compra"
                        ? "Puntos acumulados por compra"
                        : "Puntos acreditados");

              return (
                <div
                  key={mov.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-3 text-xs hover:bg-neutral-50/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs sm:text-sm text-neutral-900 leading-snug">
                      {detalleMotivo}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400">
                      <span>
                        {new Date(mov.creado_en).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {mov.pedido_id && (
                        <>
                          <span>|</span>
                          <span className="text-main-blue font-semibold">
                            Pedido #{mov.pedido_id}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <span
                    className={`font-black text-xs shrink-0 px-2.5 py-1 rounded-md border ${
                      esGanado
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : "text-neutral-700 bg-neutral-100 border-neutral-200"
                    }`}
                  >
                    {esGanado ? `+${mov.puntos}` : mov.puntos} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
