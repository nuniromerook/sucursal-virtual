// backend/src/routes/notificaciones.routes.js
const { Router } = require("express");
const {
  getNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
  crearNotificacion,
  suscribirPush,
  getPublicKey,
} = require("../controllers/notificaciones.controller");

const router = Router();

router.get("/notificaciones", getNotificaciones);
router.get("/notificaciones/push/public-key", getPublicKey);
router.patch("/notificaciones/marcar-todas-leidas", marcarTodasLeidas);
router.patch("/notificaciones/:id/leida", marcarLeida);
router.post("/notificaciones", crearNotificacion);
router.post("/notificaciones/push/subscribe", suscribirPush);

module.exports = router;
