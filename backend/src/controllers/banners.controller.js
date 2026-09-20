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
      `SELECT b.*,
              CASE 
                WHEN b.impresiones > 0 THEN ROUND((b.clics::numeric / b.impresiones::numeric) * 100, 2)
                ELSE 0
              END AS ctr,
              COALESCE(p_stats.pedidos_count, 0)::integer AS pedidos_generados,
              COALESCE(p_stats.total_ventas, 0)::numeric(12,2) AS ventas_totales,
              CASE
                WHEN b.clics > 0 THEN ROUND((COALESCE(p_stats.pedidos_count, 0)::numeric / b.clics::numeric) * 100, 2)
                ELSE 0
              END AS conversion_rate
       FROM banners_publicidad b
       LEFT JOIN (
         SELECT banner_id,
                COUNT(id) AS pedidos_count,
                SUM(COALESCE(monto_total_final, monto_total_estimado, 0)) AS total_ventas
         FROM pedidos
         WHERE banner_id IS NOT NULL
         GROUP BY banner_id
       ) p_stats ON p_stats.banner_id = b.id
       ORDER BY b.orden ASC, b.id ASC`
    );
    res.json(result.rows);
  } catch (error) {
    // Si la columna banner_id aún estuviera en migración, responder con métricas estándar
    try {
      const fallback = await pool.query(
        `SELECT *,
                CASE 
                  WHEN impresiones > 0 THEN ROUND((clics::numeric / impresiones::numeric) * 100, 2)
                  ELSE 0
                END AS ctr,
                0 AS pedidos_generados,
                0 AS ventas_totales,
                0 AS conversion_rate
         FROM banners_publicidad
         ORDER BY orden ASC, id ASC`
      );
      return res.json(fallback.rows);
    } catch (fbErr) {
      console.error("Error al obtener banners admin:", fbErr.message);
      res.status(500).json({ error: "Error al obtener banners" });
    }
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

/**
 * POST /banners/reset-analytics
 * Restablece a 0 las impresiones y clics de todos los banners (Admin)
 */
const resetBannersAnalytics = async (req, res) => {
  try {
    await pool.query(`UPDATE banners_publicidad SET impresiones = 0, clics = 0`);
    res.json({
      success: true,
      message: "Todas las métricas de banners han sido reiniciadas a cero.",
    });
  } catch (error) {
    console.error("Error al reiniciar analíticas de banners:", error.message);
    res.status(500).json({ error: "Error al reiniciar analíticas de banners" });
  }
};

/**
 * POST /banners/:id/reset-analytics
 * Restablece a 0 las impresiones y clics de un banner individual (Admin)
 */
const resetSingleBannerAnalytics = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE banners_publicidad SET impresiones = 0, clics = 0 WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Banner no encontrado" });
    }
    res.json({
      success: true,
      message: `Métricas del banner '${result.rows[0].titulo}' reiniciadas a cero.`,
      banner: result.rows[0],
    });
  } catch (error) {
    console.error("Error al reiniciar métricas de banner:", error.message);
    res.status(500).json({ error: "Error al reiniciar métricas del banner" });
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
  resetBannersAnalytics,
  resetSingleBannerAnalytics,
};

