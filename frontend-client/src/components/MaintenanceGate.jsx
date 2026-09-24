// frontend-client/src/components/MaintenanceGate.jsx
import React, { useState, useEffect } from "react";
import MaintenanceScreen from "./MaintenanceScreen";
import { Lock, EyeOff } from "lucide-react";

const STORAGE_KEY = "valette_dev_access";
const VALID_KEYS = ["valette2026", "valette", "admin2026", "true"];

export default function MaintenanceGate({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  // ─── Detección de Enlace Mágico por URL (?preview=valette2026, ?access=valette2026, etc.) ───
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const previewParam =
        urlParams.get("preview") ||
        urlParams.get("access") ||
        urlParams.get("dev") ||
        urlParams.get("clave");

      if (previewParam && VALID_KEYS.includes(previewParam.toLowerCase().trim())) {
        localStorage.setItem(STORAGE_KEY, "true");
        setIsAuthorized(true);

        // Limpiar el parámetro de la barra de direcciones sin recargar
        urlParams.delete("preview");
        urlParams.delete("access");
        urlParams.delete("dev");
        urlParams.delete("clave");
        const newSearch = urlParams.toString();
        const newUrl =
          window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch (e) {
      console.error("Error al procesar enlace mágico:", e);
    }
  }, []);

  // ─── Control de noindex para robots mientras esté activo el modo mantenimiento ───
  useEffect(() => {
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!isAuthorized) {
      if (!metaRobots) {
        metaRobots = document.createElement("meta");
        metaRobots.name = "robots";
        document.head.appendChild(metaRobots);
      }
      metaRobots.content = "noindex, nofollow";
      document.title = "Abastecedora Valette — Próximamente Nueva Tienda Online";
    } else {
      if (metaRobots && metaRobots.content === "noindex, nofollow") {
        metaRobots.content = "index, follow";
      }
    }
  }, [isAuthorized]);

  const handleUnlock = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
    setIsAuthorized(true);
  };

  const handleLock = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setIsAuthorized(false);
  };

  if (!isAuthorized) {
    return <MaintenanceScreen onUnlock={handleUnlock} />;
  }

  return (
    <>
      {children}

      {/* ─── Botón Flotante Discreto para el Desarrollador / Equipo ─── */}
      <div className="fixed bottom-3 left-3 z-9999 flex items-center gap-1.5 bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-xl text-xs font-semibold select-none group">
        <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="text-[11px] text-slate-300">Vista Previa Activa</span>
        <button
          type="button"
          onClick={handleLock}
          className="ml-1.5 p-1 rounded-full hover:bg-white/20 text-slate-400 hover:text-white transition-colors"
          title="Bloquear y volver a pantalla de mantenimiento"
        >
          <EyeOff className="size-3.5" />
        </button>
      </div>
    </>
  );
}
