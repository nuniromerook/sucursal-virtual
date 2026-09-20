const { Router } = require("express");
const {
  createPedido,
  getPedidoById,
  actualizarEstadoPedido,
  cotizarEnvio,
} = require("../controllers/pedidos.controller");
const { requireAuth } = require("../utils/auth");
const { orderLimiter } = require("../middlewares/rateLimiter");

const router = Router();

router.post("/pedidos", orderLimiter, createPedido);
router.get("/pedidos/:id", getPedidoById);
router.put("/pedidos/:id/estado", requireAuth, actualizarEstadoPedido);
router.post("/pedidos/cotizar-envio", cotizarEnvio);

module.exports = router;
