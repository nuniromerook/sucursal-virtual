// src/routes/inventario.routes.js
const { Router } = require("express");
const {
  getResumenSucursal,
  getStockSucursal,
  createInventario,
  createPaquete,
  updatePaquete,
  deletePaquete,
  updatePrecioInventario,
} = require("../controllers/inventario.controller");

const router = Router();

router.get("/inventario/resumen", getResumenSucursal);
router.get("/inventario", getStockSucursal);

router.post("/inventario", createInventario);
router.put("/inventario/precio", updatePrecioInventario);

router.post("/paquetes", createPaquete);
router.put("/paquetes/:id", updatePaquete);
router.delete("/paquetes/:id", deletePaquete);

module.exports = router;
