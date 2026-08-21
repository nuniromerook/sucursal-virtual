// src/controllers/sucursales.controller.js
const pool = require("../db");

// GET /sucursales
// Listado liviano — lo usa la Sidebar para armar el menú dinámico
const getAllSucursales = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre, ciudad, slug, activa FROM sucursales ORDER BY nombre`,
    );

    res.json(result.rows);
  } catch (error) {
    console.log(error.message);
    res.json({ error: "Error al obtener las sucursales" });
  }
};

// GET /sucursales/:slug
// Detalle completo de una sucursal (lo usa Sucursal.jsx)
const getSucursal = async (req, res) => {
  const { slug } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM sucursales WHERE slug = $1`,
      [slug],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sucursal no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.log(error.message);
    res.json({ error: "Error al obtener la sucursal" });
  }
};

// POST /sucursales
// Alta de una nueva sucursal
const createSucursal = async (req, res) => {
  const {
    nombre,
    direccion,
    ciudad,
    latitud,
    longitud,
    telefono,
    horario_atencion,
    slug,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO sucursales
         (nombre, direccion, ciudad, latitud, longitud, telefono, horario_atencion, slug)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        nombre,
        direccion,
        ciudad,
        latitud || null,
        longitud || null,
        telefono,
        horario_atencion,
        slug,
      ],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.log(error.message);
    res.json({ error: "Error al crear la sucursal" });
  }
};

module.exports = {
  getAllSucursales,
  getSucursal,
  createSucursal,
};
