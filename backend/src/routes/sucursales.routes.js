const { Router } = require("express");
const {
  getAllSucursales,
  getSucursal,
  createSucursal,
  updateSucursal,
  getMetricasSucursal,
  getPedidosSucursal,
} = require("../controllers/sucursales.controller");

const { requireStaff, requireAdmin } = require("../utils/auth");

const router = Router();

router.get("/sucursales", getAllSucursales);
router.get("/sucursales/:id/metricas", requireAdmin, getMetricasSucursal);
router.get("/sucursales/:id/pedidos", requireStaff, getPedidosSucursal);
router.get("/sucursales/:slug", getSucursal);
router.post("/sucursales", requireAdmin, createSucursal);
router.put("/sucursales/:id", requireAdmin, updateSucursal);

module.exports = router;
