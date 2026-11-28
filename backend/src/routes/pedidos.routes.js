const { Router } = require("express");
const {
  createPedido,
  getPedidoById,
  actualizarEstadoPedido,
  cotizarEnvio,
} = require("../controllers/pedidos.controller");
const { requireAuth, requireStaff } = require("../utils/auth");
const { orderLimiter } = require("../middlewares/rateLimiter");

const router = Router();

router.post("/pedidos", orderLimiter, requireAuth, createPedido);
router.get("/pedidos/:id", getPedidoById);
router.put("/pedidos/:id/estado", requireStaff, actualizarEstadoPedido);
router.patch("/pedidos/:id/estado", requireStaff, actualizarEstadoPedido);
router.post("/pedidos/cotizar-envio", cotizarEnvio);

module.exports = router;
