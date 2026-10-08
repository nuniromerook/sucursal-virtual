// src/config/api.js
// Configuración centralizada de API URL para sucursal-virtual-1.0

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // En producción en el dominio oficial
    if (hostname.includes("abastecedoravalette.digital")) {
      return "https://api.abastecedoravalette.digital";
    }
  }
  // En desarrollo local o fallback, apunta a la VPS oficial que ya tiene PostgreSQL y CORS activo
  return "https://api.abastecedoravalette.digital";
};

export const API_URL = getApiUrl();
export const VITE_API_URL = API_URL;
export default API_URL;
