// backend/src/routes/clientes.routes.js
const { Router } = require("express");
const {
  registroCliente,
  loginCliente,
  googleAuth,
  getPerfil,
  updatePerfil,
  updatePassword,
  getHistorialPedidos,
  getHistorialPuntos,
  validarCodigoReferido,
  solicitarRecuperacionPassword,
  restablecerPassword,
  getFavoritos,
  sincronizarFavoritos,
  toggleFavorito,
} = require("../controllers/clientes.controller");
const { requireAuth } = require("../utils/auth");
const { authLimiter } = require("../middlewares/rateLimiter");

const router = Router();

// ─── Rutas públicas ─────────────────────────────
router.post("/clientes/registro", authLimiter, registroCliente);
router.post("/clientes/login", authLimiter, loginCliente);
router.post("/clientes/google", googleAuth);
router.post(
  "/clientes/solicitar-recuperacion",
  authLimiter,
  solicitarRecuperacionPassword,
);
router.post("/clientes/restablecer-password", authLimiter, restablecerPassword);

// Validar código de referido (público, se llama desde el form de registro)
router.post("/clientes/referido/validar", validarCodigoReferido);

// ─── Rutas protegidas (requieren JWT) ───────────
router.get("/clientes/perfil", requireAuth, getPerfil);
router.put("/clientes/perfil", requireAuth, updatePerfil);
router.put("/clientes/password", requireAuth, updatePassword);
router.get("/clientes/pedidos", requireAuth, getHistorialPedidos);

// Historial de movimientos de puntos
router.get("/clientes/puntos/historial", requireAuth, getHistorialPuntos);

// Favoritos del cliente en PostgreSQL
router.get("/clientes/favoritos", requireAuth, getFavoritos);
router.post("/clientes/favoritos/sincronizar", requireAuth, sincronizarFavoritos);
router.post("/clientes/favoritos/toggle", requireAuth, toggleFavorito);

module.exports = router;
