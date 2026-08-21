// Si definís VITE_API_URL en un .env, se usa esa (ideal para producción).
// Si no, se arma automáticamente con el mismo host desde el que se abrió
// el panel — así funciona igual en localhost, en la IP del wifi, o en
// cualquier otra red, sin tocar código.
// frontend/src/config/api.js
export const API_URL =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
