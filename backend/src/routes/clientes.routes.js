// backend/src/routes/clientes.routes.js
const { Router } = require("express");
const {
  registroCliente,
  loginCliente,
  googleAuth,
  getPerfil,
  updatePerfil,
  getHistorialPedidos,
} = require("../controllers/clientes.controller");
const { requireAuth } = require("../utils/auth");

const router = Router();

// Rutas públicas
router.post("/clientes/registro", registroCliente);
router.post("/clientes/login", loginCliente);
router.post("/clientes/google", googleAuth);

// Rutas protegidas (Requieren Token JWT)
router.get("/clientes/perfil", requireAuth, getPerfil);
router.put("/clientes/perfil", requireAuth, updatePerfil);
router.get("/clientes/pedidos", requireAuth, getHistorialPedidos);

module.exports = router;
