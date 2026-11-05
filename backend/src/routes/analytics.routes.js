// backend/src/routes/analytics.routes.js
const { Router } = require("express");
const {
  registrarVisita,
  registrarEvento,
  getResumenAnalytics,
} = require("../controllers/analytics.controller");
const { requireAuth } = require("../utils/auth");

const router = Router();

router.post("/analytics/visita", registrarVisita);
router.post("/analytics/evento", registrarEvento);
router.get("/analytics/resumen", requireAuth, getResumenAnalytics);

module.exports = router;
