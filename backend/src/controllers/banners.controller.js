// backend/src/controllers/banners.controller.js
const pool = require("../db");

/**
 * GET /banners
 * Devuelve todos los banners publicitarios activos ordenados
 */
const getBanners = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM banners_publicidad WHERE activo = true ORDER BY orden ASC, id ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener banners:", error.message);
    res.status(500).json({ error: "Error al obtener banners publicitarios" });
  }
};

/**
 * POST /banners/:id/impresion
 * Incrementa las impresiones publicitarias de un banner
 */
const registrarImpresionBanner = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE banners_publicidad SET impresiones = impresiones + 1 WHERE id = $1`,
      [id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error al registrar impresión:", error.message);
    res.status(500).json({ error: "Error al registrar impresión" });
  }
};

/**
 * POST /banners/:id/click
 * Incrementa los clics de un banner publicitario
 */
const registrarClickBanner = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE banners_publicidad SET clics = clics + 1 WHERE id = $1`,
      [id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error al registrar clic:", error.message);
    res.status(500).json({ error: "Error al registrar clic" });
  }
};

/**
 * POST /banners
 * Crea un nuevo banner publicitario (Admin)
 */
const createBanner = async (req, res) => {
  const { titulo, imagen_desktop_url, imagen_mobile_url, enlace_url, orden = 0, activo = true } = req.body;

  if (!imagen_desktop_url || !imagen_mobile_url) {
    return res.status(400).json({ error: "Las URLs de imagen desktop y mobile son obligatorias" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO banners_publicidad (titulo, imagen_desktop_url, imagen_mobile_url, enlace_url, orden, activo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [titulo, imagen_desktop_url, imagen_mobile_url, enlace_url, orden, activo]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear banner:", error.message);
    res.status(500).json({ error: "Error al crear banner publicitario" });
  }
};

/**
 * DELETE /banners/:id
 */
const deleteBanner = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM banners_publicidad WHERE id = $1`, [id]);
    res.json({ success: true, message: "Banner eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar banner:", error.message);
    res.status(500).json({ error: "Error al eliminar banner" });
  }
};

module.exports = {
  getBanners,
  registrarImpresionBanner,
  registrarClickBanner,
  createBanner,
  deleteBanner,
};
