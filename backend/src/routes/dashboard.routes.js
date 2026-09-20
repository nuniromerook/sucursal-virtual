// backend/src/routes/dashboard.routes.js
const { Router } = require("express");
const { getDashboardResumen } = require("../controllers/dashboard.controller");
const { requireAuth } = require("../utils/auth");

const router = Router();

router.get("/dashboard/resumen", requireAuth, getDashboardResumen);

module.exports = router;
