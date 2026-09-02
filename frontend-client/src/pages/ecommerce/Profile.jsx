// frontend-client/src/pages/ecommerce/Profile.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { User, Sparkles, Package, Star, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../config/api";

// Módulos independientes de pestañas
import ComprasTab from "./profile-tabs/ComprasTab";
import MisDatosTab from "./profile-tabs/MisDatosTab";
import PuntosTab from "./profile-tabs/PuntosTab";

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  const { user, token, isAuthenticated, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState(tabParam || "pedidos"); // "pedidos" | "datos" | "puntos"
  const [pedidos, setPedidos] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);

  // Redirección si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/ingresar");
    } else if (!user?.referral_code) {
      refreshUser();
    }
  }, [isAuthenticated, user?.referral_code, navigate, refreshUser]);

  // Sincronizar activeTab con parámetro de URL
  useEffect(() => {
    if (tabParam && ["pedidos", "datos", "puntos"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Cambiar de pestaña y sincronizar query param en la URL
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
  };

  // Cargar historial de pedidos
  useEffect(() => {
    const fetchHistorial = async () => {
      if (!token) return;
      setLoadingPedidos(true);
      try {
        const res = await fetch(`${API_URL}/clientes/pedidos`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setPedidos(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error al cargar historial de pedidos:", err);
      } finally {
        setLoadingPedidos(false);
      }
    };

    fetchHistorial();
  }, [token]);

  if (!user) return null;

  const puntos = Number(user.puntos_acumulados) || 0;
  const perfilIncompleto = !user.perfil_completo;
  const nombreLimpio = user.nombre
    ? user.nombre.replace(/\s*\(@[^)]+\)/g, "").trim()
    : "Cliente Valette";

  const tabContainerRef = useRef(null);

  useEffect(() => {
    if (tabContainerRef.current) {
      const activeBtn = tabContainerRef.current.querySelector('[aria-selected="true"]');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [activeTab]);

  return (
    <div className="w-full min-h-screen pb-14">
      {/* ─── 1. Header Minimalista & Estratégico (Estilo Perfil Profesional) ─── */}
      <div className="bg-white border-b border-neutral-200/80 py-6 sm:py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-7">
          {/* Avatar con foto o iniciales */}
          <div className="relative size-18 sm:size-22 rounded-full bg-main-blue text-white font-black text-xl sm:text-2xl flex items-center justify-center shadow-2xs shrink-0 overflow-hidden ring-4 ring-main-blue/10 border-2 border-white">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={nombreLimpio}
                className="size-full object-cover"
              />
            ) : (
              nombreLimpio.substring(0, 2).toUpperCase()
            )}
          </div>

          {/* Información del Usuario */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                {nombreLimpio}
              </h1>

              {user.usuario && (
                <span className="text-xs font-bold text-main-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 font-mono">
                  @{user.usuario.replace(/^@/, "")}
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="size-3 text-emerald-600" />
                <span>Cliente Verificado</span>
              </span>
            </div>

            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-3 flex-wrap">
              <span>{user.email}</span>
              {user.telefono && (
                <>
                  <span className="text-neutral-300">•</span>
                  <span>WhatsApp: {user.telefono}</span>
                </>
              )}
            </p>

            {/* Fila de Métricas Estratégicas */}
            <div className="flex items-center gap-6 mt-4 pt-3 border-t border-neutral-100 text-xs">
              <button
                type="button"
                onClick={() => handleTabChange("pedidos")}
                className="flex items-baseline gap-1.5 cursor-pointer text-left group"
              >
                <span className="font-black text-base text-neutral-900 group-hover:text-main-blue transition-colors">
                  {pedidos.length}
                </span>
                <span className="text-neutral-500 font-medium">
                  {pedidos.length === 1 ? "Pedido" : "Pedidos"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("puntos")}
                className="flex items-baseline gap-1.5 cursor-pointer text-left group"
              >
                <span className="font-black text-base text-amber-600 flex items-center gap-1">
                  <Sparkles className="size-3.5 text-amber-500" />
                  {puntos}
                </span>
                <span className="text-neutral-500 font-medium group-hover:text-amber-700 transition-colors">
                  Puntos Valette
                </span>
              </button>

              <Link
                to="/favoritos"
                className="flex items-baseline gap-1.5 cursor-pointer text-left group"
              >
                <span className="font-black text-base text-amber-500 flex items-center gap-1">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                </span>
                <span className="text-neutral-500 font-medium group-hover:text-amber-600 transition-colors">
                  Mis Favoritos
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5">
        {/* ─── Banner de Gamificación para completar perfil ─── */}
        {perfilIncompleto && (
          <div className="mb-5 p-4 rounded-lg bg-blue-50 border border-blue-200 text-neutral-900 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-md bg-main-blue text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="size-4.5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-neutral-900 leading-snug">
                  ¡Completá tu @Usuario y WhatsApp para ganar +50 puntos de
                  regalo!
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Recibí avisos de corte, confirmación de pesaje y promociones
                  exclusivas.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleTabChange("datos")}
              className="px-3.5 py-1.5 bg-main-blue hover:bg-main-blue/90 text-white font-bold text-xs rounded-lg shadow-2xs transition-all whitespace-nowrap cursor-pointer shrink-0"
            >
              Completar Datos
            </button>
          </div>
        )}

        {/* ─── Selector de pestañas Scrolleable en Mobile ─── */}
        <div
          ref={tabContainerRef}
          role="tablist"
          className="bg-white rounded-lg p-1.5 border border-neutral-200/80 shadow-2xs flex items-center gap-1.5 mb-5 overflow-x-auto scrollbar-none flex-nowrap"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "pedidos"}
            onClick={() => handleTabChange("pedidos")}
            className={`py-2 px-3.5 rounded-md font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "pedidos"
                ? "bg-main-blue text-white shadow-2xs"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            <Package className="size-4 shrink-0" />
            <span>Compras ({pedidos.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "datos"}
            onClick={() => handleTabChange("datos")}
            className={`py-2 px-3.5 rounded-md font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "datos"
                ? "bg-main-blue text-white shadow-2xs"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            <User className="size-4 shrink-0" />
            <span>Mis Datos</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "puntos"}
            onClick={() => handleTabChange("puntos")}
            className={`py-2 px-3.5 rounded-md font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "puntos"
                ? "bg-amber-500 text-white shadow-2xs"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            <Sparkles className="size-4 shrink-0" />
            <span>Puntos & Referidos</span>
            <span className="text-[10px] font-black bg-white/20 px-1.5 py-0.2 rounded ml-0.5">
              {puntos}
            </span>
          </button>
        </div>

        {/* ─── Outlet de Contenido Modular ─── */}
        <div>
          {activeTab === "pedidos" && (
            <ComprasTab pedidos={pedidos} loading={loadingPedidos} />
          )}

          {activeTab === "datos" && <MisDatosTab />}

          {activeTab === "puntos" && <PuntosTab />}
        </div>
      </div>
    </div>
  );
}
