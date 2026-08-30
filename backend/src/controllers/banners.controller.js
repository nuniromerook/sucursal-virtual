// backend/src/controllers/banners.controller.js
const pool = require("../db");

/**
 * GET /banners
 * Devuelve todos los banners publicitarios activos ordenados (Tienda)
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
 * GET /banners/admin
 * Devuelve todos los banners con estadísticas completas para el panel de administración
 */
const getBannersAdmin = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *,
              CASE 
                WHEN impresiones > 0 THEN ROUND((clics::numeric / impresiones::numeric) * 100, 2)
                ELSE 0
              END AS ctr
       FROM banners_publicidad
       ORDER BY orden ASC, id ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener banners admin:", error.message);
    res.status(500).json({ error: "Error al obtener banners" });
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
  const {
    titulo,
    subtitulo = "",
    imagen_desktop_url,
    imagen_mobile_url,
    enlace_url = "/productos",
    badge_texto = "",
    badge_color = "rojo",
    boton_texto = "Ver más",
    orden = 0,
    activo = true,
  } = req.body;

  if (!imagen_desktop_url) {
    return res.status(400).json({ error: "La URL de imagen es obligatoria" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO banners_publicidad (
         titulo, subtitulo, imagen_desktop_url, imagen_mobile_url,
         enlace_url, badge_texto, badge_color, boton_texto, orden, activo
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        titulo || "Nuevo Banner",
        subtitulo,
        imagen_desktop_url,
        imagen_mobile_url || imagen_desktop_url,
        enlace_url,
        badge_texto,
        badge_color,
        boton_texto,
        orden,
        activo,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear banner:", error.message);
    res.status(500).json({ error: "Error al crear banner publicitario" });
  }
};

/**
 * PUT /banners/:id
 * Actualiza un banner existente
 */
const updateBanner = async (req, res) => {
  const { id } = req.params;
  const {
    titulo,
    subtitulo,
    imagen_desktop_url,
    imagen_mobile_url,
    enlace_url,
    badge_texto,
    badge_color,
    boton_texto,
    orden,
    activo,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE banners_publicidad
       SET titulo = COALESCE($1, titulo),
           subtitulo = COALESCE($2, subtitulo),
           imagen_desktop_url = COALESCE($3, imagen_desktop_url),
           imagen_mobile_url = COALESCE($4, imagen_mobile_url),
           enlace_url = COALESCE($5, enlace_url),
           badge_texto = COALESCE($6, badge_texto),
           badge_color = COALESCE($7, badge_color),
           boton_texto = COALESCE($8, boton_texto),
           orden = COALESCE($9, orden),
           activo = COALESCE($10, activo)
       WHERE id = $11
       RETURNING *`,
      [
        titulo,
        subtitulo,
        imagen_desktop_url,
        imagen_mobile_url,
        enlace_url,
        badge_texto,
        badge_color,
        boton_texto,
        orden,
        activo,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Banner no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar banner:", error.message);
    res.status(500).json({ error: "Error al actualizar banner" });
  }
};

/**
 * PATCH /banners/:id/estado
 */
const toggleActivoBanner = async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  try {
    const result = await pool.query(
      `UPDATE banners_publicidad SET activo = $1 WHERE id = $2 RETURNING *`,
      [activo, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Banner no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al cambiar estado de banner:", error.message);
    res.status(500).json({ error: "Error al actualizar estado" });
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
  getBannersAdmin,
  registrarImpresionBanner,
  registrarClickBanner,
  createBanner,
  updateBanner,
  toggleActivoBanner,
  deleteBanner,
};

