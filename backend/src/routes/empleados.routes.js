const { Router } = require("express");
const {
  getEmpleadosBySucursal,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado,
  loginEmpleado,
  getMeEmpleado,
} = require("../controllers/empleados.controller");
const { requireAuth } = require("../utils/auth");

const router = Router();

router.post("/empleados/login", loginEmpleado);
router.get("/empleados/me", requireAuth, getMeEmpleado);

router.get("/sucursales/:id/empleados", getEmpleadosBySucursal);
router.post("/sucursales/:id/empleados", createEmpleado);
router.put("/empleados/:id", updateEmpleado);
router.delete("/empleados/:id", deleteEmpleado);

module.exports = router;
