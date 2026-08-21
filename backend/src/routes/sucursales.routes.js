// src/routes/sucursales.routes.js
const { Router } = require("express");
const {
  getAllSucursales,
  getSucursal,
  createSucursal,
} = require("../controllers/sucursales.controller");

const router = Router();

router.get("/sucursales", getAllSucursales);
router.get("/sucursales/:slug", getSucursal);
router.post("/sucursales", createSucursal);

module.exports = router;
