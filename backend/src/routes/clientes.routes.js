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
  getRecompensas,
  getRecompensasAdmin,
  createRecompensa,
  updateRecompensa,
  deleteRecompensa,
  getMisCanjes,
  canjearRecompensa,
  getClientesAdmin,
  ajustarPuntosClienteAdmin,
  getCanjesAdmin,
  actualizarEstadoCanjeAdmin,
} = require("../controllers/clientes.controller");
const { requireAuth, requireAdmin } = require("../utils/auth");
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

// Catálogo público de recompensas activas del Club Valette
router.get("/recompensas", getRecompensas);

// ─── Rutas protegidas (requieren JWT de cliente) ─
router.get("/clientes/perfil", requireAuth, getPerfil);
router.put("/clientes/perfil", requireAuth, updatePerfil);
router.put("/clientes/password", requireAuth, updatePassword);
router.get("/clientes/pedidos", requireAuth, getHistorialPedidos);

// Historial de movimientos de puntos y canjes
router.get("/clientes/puntos/historial", requireAuth, getHistorialPuntos);
router.get("/clientes/canjes", requireAuth, getMisCanjes);
router.post("/clientes/canjear", requireAuth, canjearRecompensa);

// Favoritos del cliente en PostgreSQL
router.get("/clientes/favoritos", requireAuth, getFavoritos);
router.post("/clientes/favoritos/sincronizar", requireAuth, sincronizarFavoritos);
router.post("/clientes/favoritos/toggle", requireAuth, toggleFavorito);

// ─── Rutas de administración (propietario / admin / encargado) ─
router.get("/recompensas/admin", requireAdmin, getRecompensasAdmin);
router.post("/recompensas", requireAdmin, createRecompensa);
router.put("/recompensas/:id", requireAdmin, updateRecompensa);
router.delete("/recompensas/:id", requireAdmin, deleteRecompensa);

router.get("/clientes/admin", requireAdmin, getClientesAdmin);
router.post("/clientes/admin/:id/puntos", requireAdmin, ajustarPuntosClienteAdmin);
router.get("/canjes/admin", requireAdmin, getCanjesAdmin);
router.patch("/canjes/admin/:id/estado", requireAdmin, actualizarEstadoCanjeAdmin);

module.exports = router;
