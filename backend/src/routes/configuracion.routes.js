// backend/src/routes/configuracion.routes.js
const { Router } = require("express");
const {
  getHomeConfig,
  updateHomeConfig,
  getAllConfig,
} = require("../controllers/configuracion.controller");
const { requireAdmin } = require("../utils/auth");

const router = Router();

router.get("/configuracion/home", getHomeConfig);
router.put("/configuracion/home", requireAdmin, updateHomeConfig);
router.get("/configuracion", requireAdmin, getAllConfig);

module.exports = router;
