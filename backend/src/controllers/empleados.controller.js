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

module.exports = {
  getEmpleadosBySucursal,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado,
};
