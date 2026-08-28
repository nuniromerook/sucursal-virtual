// backend/src/routes/empleados.routes.js
const { Router } = require("express");
const {
  getEmpleadosBySucursal,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado,
} = require("../controllers/empleados.controller");

const router = Router();

router.get("/sucursales/:id/empleados", getEmpleadosBySucursal);
router.post("/sucursales/:id/empleados", createEmpleado);
router.put("/empleados/:id", updateEmpleado);
router.delete("/empleados/:id", deleteEmpleado);

module.exports = router;
