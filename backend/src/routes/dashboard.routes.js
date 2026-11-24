// backend/src/routes/dashboard.routes.js
const { Router } = require("express");
const { getDashboardResumen } = require("../controllers/dashboard.controller");
const { requireAdmin } = require("../utils/auth");

const router = Router();

router.get("/dashboard/resumen", requireAdmin, getDashboardResumen);

module.exports = router;
