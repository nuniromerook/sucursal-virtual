const { Router } = require("express");
const {
  getAllSucursales,
  getSucursal,
  createSucursal,
  getMetricasSucursal,
  getPedidosSucursal,
} = require("../controllers/sucursales.controller");

const { requireAuth } = require("../utils/auth");

const router = Router();

router.get("/sucursales", getAllSucursales);
router.get("/sucursales/:id/metricas", requireAuth, getMetricasSucursal);
router.get("/sucursales/:id/pedidos", requireAuth, getPedidosSucursal);
router.get("/sucursales/:slug", getSucursal);
router.post("/sucursales", requireAuth, createSucursal);

module.exports = router;
