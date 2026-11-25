// src/utils/cookieConsent.js
const CONSENT_KEY = "valette_cookie_consent";
const SESSION_DISMISS_KEY = "valette_cookie_banner_dismissed";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 días

function readCookie(name) {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name, value, maxAgeSeconds = MAX_AGE_SECONDS) {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location?.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
}

/**
 * Devuelve "accepted" | "essential" | null
 */
export function getCookieConsent() {
  const fromCookie = readCookie(CONSENT_KEY);
  if (fromCookie === "accepted" || fromCookie === "essential") {
    return fromCookie;
  }
  try {
    const fromStorage = localStorage.getItem(CONSENT_KEY);
    if (fromStorage === "accepted" || fromStorage === "essential") {
      return fromStorage;
    }
  } catch {
    // Storage bloqueado
  }
  return null;
}

export function setCookieConsent(value) {
  if (value !== "accepted" && value !== "essential") return;
  writeCookie(CONSENT_KEY, value);
  try {
    localStorage.setItem(CONSENT_KEY, value);
    if (value === "essential") {
      localStorage.removeItem("valette_sesion_id");
    }
  } catch {
    // Storage bloqueado
  }
}

export function isBannerDismissedForSession() {
  try {
    return sessionStorage.getItem(SESSION_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissBannerForSession() {
  try {
    sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
  } catch {
    // Storage bloqueado
  }
}

/**
 * Permite analítica interna anónima salvo que el usuario haya elegido "essential".
 */
export function isAnalyticsAllowed() {
  return getCookieConsent() !== "essential";
}
