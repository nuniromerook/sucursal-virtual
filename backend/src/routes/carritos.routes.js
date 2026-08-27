// backend/src/routes/carritos.routes.js
const express = require("express");
const router = express.Router();
const {
  sincronizarCarrito,
  getCarrito,
  updateItemCarrito,
  clearCarritoDB,
} = require("../controllers/carritos.controller");
const { requireAuth } = require("../utils/auth");

// Todas las rutas requieren JWT de cliente autenticado

// Sincronizar carrito local con DB (al login o al montar la app)
router.post("/carritos/sincronizar", requireAuth, sincronizarCarrito);

// Obtener carrito activo del cliente desde DB
router.get("/carritos/mi-carrito", requireAuth, getCarrito);

// Actualizar cantidad de un ítem (también sirve para agregar si no existe)
router.patch(
  "/carritos/mi-carrito/item/:catalogoId",
  requireAuth,
  updateItemCarrito
);

// Vaciar el carrito (logout / clearCart)
router.delete("/carritos/mi-carrito", requireAuth, clearCarritoDB);

module.exports = router;
