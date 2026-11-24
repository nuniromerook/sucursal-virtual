const { Router } = require("express");
const {
  getEmpleadosBySucursal,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado,
  loginEmpleado,
  getMeEmpleado,
  recuperarConMasterPin,
  cambiarPasswordEmpleado,
  getCortadoresConCarga,
} = require("../controllers/empleados.controller");
const { requireStaff, requireAdmin } = require("../utils/auth");
const { authLimiter } = require("../middlewares/rateLimiter");

const router = Router();

router.post("/empleados/login", authLimiter, loginEmpleado);
router.post("/empleados/recuperar-maestro", authLimiter, recuperarConMasterPin);
router.get("/empleados/me", requireStaff, getMeEmpleado);
router.put("/empleados/cambiar-password", requireStaff, cambiarPasswordEmpleado);

router.get("/sucursales/:id/empleados", requireAdmin, getEmpleadosBySucursal);
router.get("/sucursales/:id/cortadores-carga", requireStaff, getCortadoresConCarga);
router.post("/sucursales/:id/empleados", requireAdmin, createEmpleado);
router.put("/empleados/:id", requireAdmin, updateEmpleado);
router.delete("/empleados/:id", requireAdmin, deleteEmpleado);

module.exports = router;
