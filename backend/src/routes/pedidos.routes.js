const { Router } = require("express");
const {
  createPedido,
  getPedidoById,
  actualizarEstadoPedido,
  cotizarEnvio,
} = require("../controllers/pedidos.controller");

const router = Router();

router.post("/pedidos", createPedido);
router.get("/pedidos/:id", getPedidoById);
router.put("/pedidos/:id/estado", actualizarEstadoPedido);
router.post("/pedidos/cotizar-envio", cotizarEnvio);

module.exports = router;
