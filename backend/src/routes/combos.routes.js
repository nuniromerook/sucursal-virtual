// backend/src/routes/combos.routes.js
const { Router } = require("express");
const {
  getCombos,
  getComboById,
  createCombo,
  updateCombo,
  toggleActivoCombo,
  deleteCombo,
} = require("../controllers/combos.controller");

const { requireAdmin } = require("../utils/auth");

const router = Router();

router.get("/combos", getCombos);
router.get("/combos/:id", getComboById);
router.post("/combos", requireAdmin, createCombo);
router.put("/combos/:id", requireAdmin, updateCombo);
router.patch("/combos/:id/estado", requireAdmin, toggleActivoCombo);
router.delete("/combos/:id", requireAdmin, deleteCombo);

module.exports = router;
