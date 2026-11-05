// backend/src/routes/carritos.routes.js
const express = require("express");
const router = express.Router();
const {
  sincronizarCarrito,
  getCarrito,
  updateItemCarrito,
  clearCarritoDB,
  registrarPasoCarrito,
  getCarritosActivos,
} = require("../controllers/carritos.controller");

// Sincronizar carrito local con DB (por sesion_id de dispositivo y/o JWT de cliente)
router.post("/carritos/sincronizar", sincronizarCarrito);

// Registrar avance o abandono en el embudo de compra (funnel tracking)
router.post("/carritos/paso", registrarPasoCarrito);

// Obtener carrito activo (por sesion_id o JWT)
router.get("/carritos/mi-carrito", getCarrito);

// Obtener carritos activos y embudo de abandono para inspección administrativa
router.get("/carritos/activos", getCarritosActivos);

// Actualizar cantidad de un ítem
router.patch("/carritos/mi-carrito/item/:catalogoId", updateItemCarrito);

// Vaciar el carrito
router.delete("/carritos/mi-carrito", clearCarritoDB);

module.exports = router;
