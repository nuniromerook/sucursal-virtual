// backend/src/routes/dashboard.routes.js
const { Router } = require("express");
const { getDashboardResumen } = require("../controllers/dashboard.controller");

const router = Router();

router.get("/dashboard/resumen", getDashboardResumen);

module.exports = router;
