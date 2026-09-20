// frontend/src/hooks/useAnalytics.js
import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { VITE_API_URL } from "../config/api";
import { hasConsent, getCookie, setCookie } from "../utils/cookies";

export function useAnalytics() {
  const location = useLocation();
  const lastPathRef = useRef("");

  const enviarVisita = useCallback((ruta) => {
    // Respetar la privacidad: Solo registrar analíticas si el usuario otorgó consentimiento
    if (!hasConsent("analytics")) return;

    // Obtener o generar sesión anónima en cookie/sessionStorage
    let sesionId = getCookie("valette_sesion_id") || sessionStorage.getItem("valette_sesion_id");
    if (!sesionId) {
      sesionId = "ses_" + Math.random().toString(36).substring(2, 12);
      try {
        sessionStorage.setItem("valette_sesion_id", sesionId);
        setCookie("valette_sesion_id", sesionId, 1);
      } catch {}
    }

    const dispositivo = window.innerWidth < 768 ? "mobile" : "desktop";

    // Enviar visita de forma asíncrona no bloqueante
    fetch(`${VITE_API_URL}/analytics/visita`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ruta,
        dispositivo,
        sesion_id: sesionId,
      }),
    }).catch(() => {
      // Silenciar errores de analytics para no interrumpir la navegación del usuario
    });
  }, []);

  useEffect(() => {
    const currentPath = location.pathname + location.search;
    if (lastPathRef.current === currentPath) return;
    lastPathRef.current = currentPath;

    enviarVisita(currentPath);
  }, [location, enviarVisita]);

  // Si el usuario acepta las cookies mientras está en la página, registrar la visita actual en vivo
  useEffect(() => {
    const handleConsentChange = (e) => {
      if (e.detail?.analytics && lastPathRef.current) {
        enviarVisita(lastPathRef.current);
      }
    };

    window.addEventListener("valette_cookie_consent_changed", handleConsentChange);
    return () =>
      window.removeEventListener("valette_cookie_consent_changed", handleConsentChange);
  }, [enviarVisita]);
}
