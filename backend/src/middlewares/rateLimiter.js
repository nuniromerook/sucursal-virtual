// backend/src/middlewares/rateLimiter.js
const rateLimit = require("express-rate-limit");

/**
 * Limitador estricto para autenticación y recuperación de credenciales
 * (10 intentos cada 15 minutos por IP)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error:
      "Demasiados intentos desde esta dirección IP. Por favor, espere 15 minutos antes de volver a intentar.",
  },
});

/**
 * Limitador para servicios de IA (Google Gemini)
 * Previene agotamiento de cuotas y costos imprevistos
 * (15 peticiones por minuto por IP)
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error:
      "Ha superado el límite de generación con Inteligencia Artificial. Espere un minuto antes de generar otra ficha.",
  },
});

/**
 * Limitador para creación de pedidos
 * Previene ataques de flooding o denegación de servicio sobre la base de datos
 * (25 pedidos cada 10 minutos por IP)
 */
const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 25,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error:
      "Demasiados pedidos registrados en un corto período. Por favor, espere unos minutos.",
  },
});

/**
 * Limitador global para uso general de la API pública
 * (1000 peticiones cada 15 minutos por IP)
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error:
      "Límite general de solicitudes a la API alcanzado. Por favor, espere unos minutos.",
  },
});

module.exports = {
  authLimiter,
  aiLimiter,
  orderLimiter,
  apiLimiter,
};
