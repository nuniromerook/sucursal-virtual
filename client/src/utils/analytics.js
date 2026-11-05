import { API_URL } from "@/config/api";

const visitedRoutesInSession = new Set();

export function getAnalyticsSesionId() {
  try {
    let id = localStorage.getItem("valette_sesion_id");
    if (!id) {
      id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem("valette_sesion_id", id);
    }
    return id;
  } catch {
    return `dev_${Date.now()}`;
  }
}

export function detectAnalyticsDevice() {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua) || window.innerWidth < 768) {
    return "mobile";
  }
  return "desktop";
}

/**
 * Registra una vista de página en PostgreSQL (metricas_visitas).
 * Evita duplicar la misma ruta dentro de la misma sesión de pestaña.
 */
export function trackPageView(ruta = "/") {
  const cleanRuta = String(ruta || "/").slice(0, 255);
  if (visitedRoutesInSession.has(cleanRuta)) return;
  visitedRoutesInSession.add(cleanRuta);

  const sesion_id = getAnalyticsSesionId();
  const dispositivo = detectAnalyticsDevice();

  fetch(`${API_URL}/analytics/visita`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ruta: cleanRuta,
      dispositivo,
      sesion_id,
    }),
  }).catch(() => {});
}

/**
 * Registra un evento de interacción en PostgreSQL (metricas_eventos).
 */
export function trackEvent(tipo_evento, elemento_id = null, metadata = {}) {
  if (!tipo_evento) return;

  const sesion_id = getAnalyticsSesionId();
  const dispositivo = detectAnalyticsDevice();

  fetch(`${API_URL}/analytics/evento`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo_evento: String(tipo_evento).slice(0, 100),
      elemento_id: elemento_id !== null && elemento_id !== undefined ? String(elemento_id).slice(0, 100) : null,
      metadata: {
        ...metadata,
        sesion_id,
        dispositivo,
      },
    }),
  }).catch(() => {});
}
