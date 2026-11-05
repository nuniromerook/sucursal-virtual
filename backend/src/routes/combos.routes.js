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

const { requireAuth } = require("../utils/auth");

const router = Router();

router.get("/combos", getCombos);
router.get("/combos/:id", getComboById);
router.post("/combos", requireAuth, createCombo);
router.put("/combos/:id", requireAuth, updateCombo);
router.patch("/combos/:id/estado", requireAuth, toggleActivoCombo);
router.delete("/combos/:id", requireAuth, deleteCombo);

module.exports = router;
