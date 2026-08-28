const { Router } = require("express");
const {
  getAllSucursales,
  getSucursal,
  createSucursal,
  getMetricasSucursal,
  getPedidosSucursal,
} = require("../controllers/sucursales.controller");

const router = Router();

router.get("/sucursales", getAllSucursales);
router.get("/sucursales/:id/metricas", getMetricasSucursal);
router.get("/sucursales/:id/pedidos", getPedidosSucursal);
router.get("/sucursales/:slug", getSucursal);
router.post("/sucursales", createSucursal);

module.exports = router;
