// src/routes/inventario.routes.js
const { Router } = require("express");
const {
  getResumenSucursal,
  getStockSucursal,
  createInventario,
  createPaquete,
} = require("../controllers/inventario.controller");

const router = Router();

router.get("/inventario/resumen", getResumenSucursal);
router.get("/inventario", getStockSucursal);

router.post("/inventario", createInventario);
router.post("/paquetes", createPaquete);

module.exports = router;
