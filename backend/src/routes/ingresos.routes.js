// backend/src/routes/ingresos.routes.js
const { Router } = require("express");
const {
  getIngresos,
  createIngreso,
  updateIngreso,
  deleteIngreso,
} = require("../controllers/ingresos.controller");
const { requireAdmin } = require("../utils/auth");

const router = Router();

router.get("/ingresos", requireAdmin, getIngresos);
router.post("/ingresos", requireAdmin, createIngreso);
router.put("/ingresos/:id", requireAdmin, updateIngreso);
router.delete("/ingresos/:id", requireAdmin, deleteIngreso);

module.exports = router;
