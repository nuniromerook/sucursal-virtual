// frontend-client/src/config/api.js
// Configuración única y centralizada de API URL

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname.includes("abastecedoravalette.digital")) {
      return "https://api.abastecedoravalette.digital";
    }
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:3000";
    }
  }
  return "https://api.abastecedoravalette.digital";
};

export const API_URL = getApiUrl();
