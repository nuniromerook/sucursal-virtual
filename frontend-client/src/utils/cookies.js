// frontend-client/src/utils/cookies.js

/**
 * Utilidades seguras para el manejo de cookies y consentimiento en Valette
 */

export const COOKIE_CONSENT_KEY = "valette_cookie_consent";
export const COOKIE_BANNER_REF_KEY = "valette_banner_ref";
export const COOKIE_SUCURSAL_PREF_KEY = "valette_preferred_sucursal";

/**
 * Establece una cookie en el navegador con parámetros seguros
 * @param {string} name - Nombre de la cookie
 * @param {string} value - Valor a almacenar
 * @param {number} days - Días de validez (por defecto 30)
 * @param {string} sameSite - 'Lax' | 'Strict' | 'None' (por defecto 'Lax')
 */
export function setCookie(name, value, days = 30, sameSite = "Lax") {
  try {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = "expires=" + d.toUTCString();
    const isSecure = window.location.protocol === "https:";
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
      value
    )};${expires};path=/;SameSite=${sameSite}${isSecure ? ";Secure" : ""}`;
  } catch (e) {
    console.warn("No se pudo guardar la cookie:", name, e);
  }
}

/**
 * Obtiene el valor de una cookie por su nombre
 * @param {string} name - Nombre de la cookie
 * @returns {string|null} - Valor desencriptado o null
 */
export function getCookie(name) {
  try {
    const cname = encodeURIComponent(name) + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") {
        c = c.substring(1);
      }
      if (c.indexOf(cname) === 0) {
        return c.substring(cname.length, c.length);
      }
    }
  } catch (e) {
    console.warn("No se pudo leer la cookie:", name, e);
  }
  return null;
}

/**
 * Elimina una cookie del navegador
 * @param {string} name - Nombre de la cookie
 */
export function deleteCookie(name) {
  try {
    document.cookie = `${encodeURIComponent(
      name
    )}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
  } catch (e) {
    console.warn("No se pudo borrar la cookie:", name, e);
  }
}

/**
 * Obtiene el estado actual del consentimiento de cookies
 * @returns {{
 *   accepted: boolean,
 *   analytics: boolean,
 *   marketing: boolean,
 *   preferences: boolean,
 *   timestamp: number
 * }|null}
 */
export function getCookieConsent() {
  try {
    // 1. Intentar leer desde cookie técnica
    const rawCookie = getCookie(COOKIE_CONSENT_KEY);
    if (rawCookie) {
      return JSON.parse(rawCookie);
    }
    // 2. Respaldo en localStorage por sincronización de pestañas
    const rawStorage = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (rawStorage) {
      return JSON.parse(rawStorage);
    }
  } catch (e) {
    console.warn("Error leyendo consentimiento de cookies:", e);
  }
  return null;
}

/**
 * Guarda las preferencias de consentimiento del usuario
 * @param {{
 *   analytics: boolean,
 *   marketing: boolean,
 *   preferences: boolean
 * }} preferences
 */
export function setCookieConsent({ analytics = false, marketing = false, preferences = false }) {
  const consentData = {
    accepted: true,
    necessary: true, // Siempre activas
    analytics: Boolean(analytics),
    marketing: Boolean(marketing),
    preferences: Boolean(preferences),
    timestamp: Date.now(),
    version: 1,
  };

  const serialized = JSON.stringify(consentData);

  // Guardar en cookie por 180 días (6 meses)
  setCookie(COOKIE_CONSENT_KEY, serialized, 180);

  // Sincronizar en localStorage
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, serialized);
  } catch {}

  // Notificar a todos los hooks y componentes en tiempo real
  window.dispatchEvent(
    new CustomEvent("valette_cookie_consent_changed", { detail: consentData })
  );

  return consentData;
}

/**
 * Verifica si una categoría específica tiene consentimiento otorgado
 * @param {'necessary'|'analytics'|'marketing'|'preferences'} category
 * @returns {boolean}
 */
export function hasConsent(category) {
  if (category === "necessary") return true;
  const consent = getCookieConsent();
  if (!consent) return false;
  return Boolean(consent[category]);
}
