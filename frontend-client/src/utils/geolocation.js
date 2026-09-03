// frontend-client/src/utils/geolocation.js

/**
 * Coordenadas fijas de la Casa Central / Sucursal Luis Guillón
 * Av. Luciano Valette 3910, B1838 Luis Guillón, Provincia de Buenos Aires
 */
export const SUCURSAL_LUIS_GUILLON = {
  nombre: "Luis Guillón",
  direccion: "Av. Luciano Valette 3910",
  ciudad: "Luis Guillón, Buenos Aires",
  telefono: "1135534033",
  whatsapp: "5491135534033",
  lat: -34.7926481,
  lng: -58.4569658,
};

// Radio de cobertura dinámico para envíos a domicilio (10 km)
export const RADIO_COBERTURA_KM = 10;

/**
 * Calcula la distancia en kilómetros entre dos coordenadas usando la fórmula del semiverseno (Haversine)
 */
export function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lat1 === undefined || lon1 === null || lon1 === undefined || lat2 === null || lat2 === undefined || lon2 === null || lon2 === undefined) return null;

  const R = 6371; // Radio medio de la Tierra en km
  const dLat = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const dLon = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((Number(lat1) * Math.PI) / 180) *
      Math.cos((Number(lat2) * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 1000) / 1000; // Precisión en metros (3 decimales)
}

/**
 * Formatea la distancia: si es menor a 1 km, la muestra en metros (ej: "450 mts"),
 * si es 1 km o más, en kilómetros con un decimal (ej: "2.4 km").
 */
export function formatearDistancia(distanciaKm) {
  if (distanciaKm === null || distanciaKm === undefined) return "";
  const num = Number(distanciaKm);
  if (isNaN(num)) return "";
  if (num < 1) {
    const metros = Math.round(num * 1000);
    return `${metros} mts`;
  }
  return `${num.toFixed(1)} km`;
}

/**
 * Obtiene la geolocalización del navegador mediante una Promesa
 */
export function obtenerUbicacionNavegador() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      return reject(new Error("Tu navegador o dispositivo no soporta geolocalización."));
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        guardarUbicacionLocal(coords);
        resolve(coords);
      },
      (err) => {
        let msg = "No se pudo obtener la ubicación.";
        if (err.code === 1) msg = "Permiso de ubicación denegado por el usuario.";
        if (err.code === 2) msg = "La ubicación no se encuentra disponible actualmente.";
        if (err.code === 3) msg = "Tiempo de espera de geolocalización agotado.";
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Guarda las coordenadas en el almacenamiento local
 */
export function guardarUbicacionLocal(coords) {
  try {
    localStorage.setItem("valette_coords", JSON.stringify(coords));
    window.dispatchEvent(new Event("valette_coords_updated"));
  } catch {
    // Ignorar si el almacenamiento local está deshabilitado
  }
}

/**
 * Lee las coordenadas guardadas en el almacenamiento local
 */
export function leerUbicacionLocal() {
  try {
    const raw = localStorage.getItem("valette_coords");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.lat === "number" && typeof parsed.lng === "number") {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}
