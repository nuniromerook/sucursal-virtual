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
const { requireAuth } = require("../utils/auth");
const { authLimiter } = require("../middlewares/rateLimiter");

const router = Router();

router.post("/empleados/login", authLimiter, loginEmpleado);
router.post("/empleados/recuperar-maestro", authLimiter, recuperarConMasterPin);
router.get("/empleados/me", requireAuth, getMeEmpleado);
router.put("/empleados/cambiar-password", requireAuth, cambiarPasswordEmpleado);

router.get("/sucursales/:id/empleados", requireAuth, getEmpleadosBySucursal);
router.get("/sucursales/:id/cortadores-carga", requireAuth, getCortadoresConCarga);
router.post("/sucursales/:id/empleados", requireAuth, createEmpleado);
router.put("/empleados/:id", requireAuth, updateEmpleado);
router.delete("/empleados/:id", requireAuth, deleteEmpleado);

module.exports = router;
