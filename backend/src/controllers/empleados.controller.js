// backend/src/controllers/empleados.controller.js
const pool = require("../db");

/**
 * GET /sucursales/:id/empleados
 * Obtiene el equipo de una sucursal con el conteo de pedidos fraccionados hoy
 */
const getEmpleadosBySucursal = async (req, res) => {
  const { id } = req.params;

  try {
    const sucRes = await pool.query(
      `SELECT id FROM sucursales WHERE id::text = $1 OR slug = $1 LIMIT 1`,
      [id]
    );

    if (sucRes.rows.length === 0) {
      return res.status(404).json({ error: "Sucursal no encontrada" });
    }

    const sucursalId = sucRes.rows[0].id;

    const result = await pool.query(
      `SELECT 
         e.*,
         COALESCE(
           (
             SELECT COUNT(p.id) 
             FROM pedidos p 
             WHERE p.cortador_id = e.id AND p.creado_en >= CURRENT_DATE AND p.estado_local != 'cancelado'
           ), 0
         ) AS pedidos_hoy
       FROM empleados e
       WHERE e.sucursal_id = $1
       ORDER BY e.rol, e.nombre`,
      [sucursalId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener empleados:", error.message);
    res.status(500).json({ error: "Error al obtener los empleados de la sucursal" });
  }
};

/**
 * POST /sucursales/:id/empleados
 * Da de alta un nuevo empleado en la sucursal
 */
const createEmpleado = async (req, res) => {
  const { id } = req.params;
  const { nombre, apodo, rol, telefono, activo = true } = req.body;

  if (!nombre || !rol) {
    return res.status(400).json({ error: "Nombre y rol son requeridos." });
  }

  try {
    const sucRes = await pool.query(
      `SELECT id FROM sucursales WHERE id::text = $1 OR slug = $1 LIMIT 1`,
      [id]
    );

    if (sucRes.rows.length === 0) {
      return res.status(404).json({ error: "Sucursal no encontrada" });
    }

    const sucursalId = sucRes.rows[0].id;

    const result = await pool.query(
      `INSERT INTO empleados (nombre, apodo, rol, sucursal_id, telefono, activo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nombre.trim(), apodo ? apodo.trim() : null, rol, sucursalId, telefono || null, activo]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear empleado:", error.message);
    res.status(500).json({ error: "Error al crear el empleado" });
  }
};

/**
 * PUT /empleados/:id
 * Modifica datos de un empleado
 */
const updateEmpleado = async (req, res) => {
  const { id } = req.params;
  const { nombre, apodo, rol, telefono, activo } = req.body;

  try {
    const result = await pool.query(
      `UPDATE empleados
       SET nombre = COALESCE($1, nombre),
           apodo = COALESCE($2, apodo),
           rol = COALESCE($3, rol),
           telefono = COALESCE($4, telefono),
           activo = COALESCE($5, activo)
       WHERE id = $6
       RETURNING *`,
      [nombre, apodo, rol, telefono, activo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Empleado no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar empleado:", error.message);
    res.status(500).json({ error: "Error al actualizar el empleado" });
  }
};

/**
 * DELETE /empleados/:id
 * Desactiva o elimina un empleado
 */
const deleteEmpleado = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM empleados WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Empleado no encontrado" });
    }

    res.json({ message: "Empleado eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar empleado:", error.message);
    res.status(500).json({ error: "Error al eliminar el empleado" });
  }
};

/**
 * POST /empleados/login
 * Autentica un empleado o administrador del panel
 */
const loginEmpleado = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Debe ingresar su correo/usuario y contraseña." });
  }

  const cleanIdent = email.trim().toLowerCase();

  try {
    const result = await pool.query(
      `SELECT e.id, e.nombre, e.apodo, e.rol, e.email, e.password, e.sucursal_id, e.telefono, e.activo,
              s.nombre AS sucursal_nombre, s.slug AS sucursal_slug
       FROM empleados e
       LEFT JOIN sucursales s ON s.id = e.sucursal_id
       WHERE LOWER(TRIM(COALESCE(e.email, ''))) = $1
          OR LOWER(TRIM(COALESCE(e.nombre, ''))) = $1
          OR LOWER(TRIM(COALESCE(e.apodo, ''))) = $1
       LIMIT 1`,
      [cleanIdent]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales de acceso incorrectas." });
    }

    const emp = result.rows[0];

    if (!emp.activo) {
      return res.status(403).json({ error: "Su cuenta de usuario está desactivada." });
    }

    if (!emp.password) {
      return res.status(401).json({ error: "Usuario sin contraseña asignada. Contacte al administrador." });
    }

    const { verifyPassword, generateToken } = require("../utils/auth");
    let valid = verifyPassword(password, emp.password);

    // Fallback si la contraseña fue insertada como texto plano directamente en la base
    if (!valid && emp.password === password) {
      valid = true;
    }

    if (!valid) {
      return res.status(401).json({ error: "Credenciales de acceso incorrectas." });
    }

    const token = generateToken({
      id: emp.id,
      email: emp.email,
      nombre: emp.nombre,
      rol: emp.rol,
      sucursal_id: emp.sucursal_id,
    });

    const { password: _, ...userSafe } = emp;

    res.json({
      success: true,
      message: "Sesión iniciada correctamente",
      token,
      user: userSafe,
    });
  } catch (error) {
    console.error("Error en login de empleado:", error);
    res.status(500).json({ error: "Error interno al iniciar sesión." });
  }
};

/**
 * GET /empleados/me
 * Retorna datos del empleado/admin logueado
 */
const getMeEmpleado = async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: "No autorizado." });
  }

  try {
    const result = await pool.query(
      `SELECT e.id, e.nombre, e.apodo, e.rol, e.email, e.sucursal_id, e.telefono, e.activo,
              s.nombre AS sucursal_nombre, s.slug AS sucursal_slug
       FROM empleados e
       LEFT JOIN sucursales s ON s.id = e.sucursal_id
       WHERE e.id = $1 AND e.activo = true
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado o inactivo." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener sesión de empleado:", error);
    res.status(500).json({ error: "Error al consultar usuario." });
  }
};

/**
 * POST /empleados/recuperar-maestro
 * Restablece la contraseña de un admin/empleado usando el PIN Maestro de rescate
 */
const recuperarConMasterPin = async (req, res) => {
  const { email, masterPin, newPassword } = req.body;

  if (!email || !masterPin || !newPassword) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  const expectedPin = process.env.ADMIN_MASTER_PIN || "Valette2026Master!";
  if (masterPin.trim() !== expectedPin.trim()) {
    return res.status(401).json({ error: "El PIN Maestro de rescate es incorrecto." });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: "La nueva contraseña debe tener al menos 4 caracteres." });
  }

  const cleanIdent = email.trim().toLowerCase();

  try {
    const result = await pool.query(
      `SELECT e.id, e.nombre, e.apodo, e.rol, e.email, e.sucursal_id, e.telefono, e.activo,
              s.nombre AS sucursal_nombre, s.slug AS sucursal_slug
       FROM empleados e
       LEFT JOIN sucursales s ON s.id = e.sucursal_id
       WHERE LOWER(TRIM(COALESCE(e.email, ''))) = $1
          OR LOWER(TRIM(COALESCE(e.nombre, ''))) = $1
          OR LOWER(TRIM(COALESCE(e.apodo, ''))) = $1
       LIMIT 1`,
      [cleanIdent]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No se encontró ningún usuario con ese correo o nombre." });
    }

    const emp = result.rows[0];
    const { hashPassword, generateToken } = require("../utils/auth");
    const newHash = hashPassword(newPassword);

    await pool.query(
      `UPDATE empleados SET password = $1 WHERE id = $2`,
      [newHash, emp.id]
    );

    const token = generateToken({
      id: emp.id,
      email: emp.email,
      nombre: emp.nombre,
      rol: emp.rol,
      sucursal_id: emp.sucursal_id,
    });

    res.json({
      success: true,
      message: "¡Contraseña restablecida exitosamente!",
      token,
      user: emp,
    });
  } catch (error) {
    console.error("Error al restablecer contraseña con PIN Maestro:", error);
    res.status(500).json({ error: "Error al restablecer la contraseña." });
  }
};

/**
 * PUT /empleados/cambiar-password
 * Permite a un empleado/admin logueado cambiar su contraseña
 */
const cambiarPasswordEmpleado = async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: "No autorizado." });
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Debe ingresar la contraseña actual y la nueva." });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: "La nueva contraseña debe tener al menos 4 caracteres." });
  }

  try {
    const result = await pool.query(
      `SELECT id, password FROM empleados WHERE id = $1 LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const emp = result.rows[0];
    const { verifyPassword, hashPassword } = require("../utils/auth");

    let valid = verifyPassword(currentPassword, emp.password);
    if (!valid && emp.password === currentPassword) {
      valid = true;
    }

    if (!valid) {
      return res.status(400).json({ error: "La contraseña actual no es correcta." });
    }

    const newHash = hashPassword(newPassword);
    await pool.query(`UPDATE empleados SET password = $1 WHERE id = $2`, [newHash, emp.id]);

    res.json({
      success: true,
      message: "¡Tu contraseña fue actualizada correctamente!",
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ error: "Error al actualizar contraseña." });
  }
};

module.exports = {
  getEmpleadosBySucursal,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado,
  loginEmpleado,
  getMeEmpleado,
  recuperarConMasterPin,
  cambiarPasswordEmpleado,
};


