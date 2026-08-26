// backend/src/routes/pedidos.routes.js
const { Router } = require("express");
const {
  createPedido,
  getPedidoById,
  cotizarEnvio,
} = require("../controllers/pedidos.controller");

const router = Router();

router.post("/pedidos", createPedido);
router.get("/pedidos/:id", getPedidoById);
router.post("/pedidos/cotizar-envio", cotizarEnvio);

module.exports = router;
