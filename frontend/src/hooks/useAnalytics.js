// frontend/src/hooks/useAnalytics.js
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { API_URL } from "../config/api";

export function useAnalytics() {
  const location = useLocation();
  const lastPathRef = useRef("");

  useEffect(() => {
    const currentPath = location.pathname + location.search;
    if (lastPathRef.current === currentPath) return;
    lastPathRef.current = currentPath;

    // Obtener o generar sesión anónima
    let sesionId = sessionStorage.getItem("valette_sesion_id");
    if (!sesionId) {
      sesionId = "ses_" + Math.random().toString(36).substring(2, 12);
      sessionStorage.setItem("valette_sesion_id", sesionId);
    }

    const dispositivo = window.innerWidth < 768 ? "mobile" : "desktop";

    // Enviar visita de forma asíncrona no bloqueante
    fetch(`${API_URL}/analytics/visita`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ruta: currentPath,
        dispositivo,
        sesion_id: sesionId,
      }),
    }).catch(() => {
      // Silenciar errores de analytics para no interrumpir al usuario
    });
  }, [location]);
}
