// backend/src/controllers/analytics.controller.js
const pool = require("../db");

/**
 * POST /analytics/visita
 * Registra una vista de página (Page View)
 */
const registrarVisita = async (req, res) => {
  const { ruta = "/", dispositivo = "desktop", sesion_id } = req.body;

  try {
    await pool.query(
      `INSERT INTO metricas_visitas (ruta, dispositivo, sesion_id)
       VALUES ($1, $2, $3)`,
      [ruta.slice(0, 255), dispositivo.slice(0, 50), sesion_id ? sesion_id.slice(0, 100) : null]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error al registrar visita:", error.message);
    res.status(500).json({ error: "Error al registrar métrica de visita" });
  }
};

/**
 * POST /analytics/evento
 * Registra un evento de interacción (clic en producto, búsqueda, etc.)
 */
const registrarEvento = async (req, res) => {
  const { tipo_evento, elemento_id, metadata = {} } = req.body;

  if (!tipo_evento) {
    return res.status(400).json({ error: "tipo_evento es requerido" });
  }

  try {
    await pool.query(
      `INSERT INTO metricas_eventos (tipo_evento, elemento_id, metadata)
       VALUES ($1, $2, $3)`,
      [tipo_evento.slice(0, 100), elemento_id ? String(elemento_id).slice(0, 100) : null, metadata]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error al registrar evento:", error.message);
    res.status(500).json({ error: "Error al registrar evento" });
  }
};

/**
 * GET /analytics/resumen
 * Retorna métricas de tráfico consolidadas para el panel de administración
 */
const getResumenAnalytics = async (req, res) => {
  const { rango = "hoy" } = req.query;

  let timeFilter = "creado_en >= CURRENT_DATE";
  if (rango === "semana") timeFilter = "creado_en >= CURRENT_DATE - INTERVAL '7 days'";
  if (rango === "mes") timeFilter = "creado_en >= DATE_TRUNC('month', CURRENT_DATE)";
  if (rango === "anio") timeFilter = "creado_en >= DATE_TRUNC('year', CURRENT_DATE)";

  try {
    // 1. Total visitas y visitantes únicos
    const visitasRes = await pool.query(
      `SELECT
         COUNT(id) AS total_visitas,
         COUNT(DISTINCT COALESCE(sesion_id, id::text)) AS visitantes_unicos,
         COUNT(CASE WHEN LOWER(dispositivo) = 'mobile' THEN 1 END) AS visitas_mobile,
         COUNT(CASE WHEN LOWER(dispositivo) != 'mobile' THEN 1 END) AS visitas_desktop
       FROM metricas_visitas
       WHERE ${timeFilter}`
    );

    const vData = visitasRes.rows[0];

    // 2. Páginas / Rutas más visitadas
    const paginasRes = await pool.query(
      `SELECT
         ruta,
         COUNT(id) AS visitas
       FROM metricas_visitas
       WHERE ${timeFilter}
       GROUP BY ruta
       ORDER BY visitas DESC
       LIMIT 6`
    );

    // 3. Métricas publicitarias (Banners)
    const bannersRes = await pool.query(
      `SELECT
         COALESCE(SUM(impresiones), 0) AS total_impresiones,
         COALESCE(SUM(clics), 0) AS total_clics
       FROM banners_publicidad
       WHERE activo = true`
    );

    const bData = bannersRes.rows[0];
    const imp = Number(bData.total_impresiones);
    const cli = Number(bData.total_clics);
    const ctr = imp > 0 ? ((cli / imp) * 100).toFixed(1) : 0;

    res.json({
      rango,
      total_visitas: Number(vData.total_visitas),
      visitantes_unicos: Number(vData.visitantes_unicos),
      dispositivos: {
        mobile: Number(vData.visitas_mobile),
        desktop: Number(vData.visitas_desktop),
        porcentaje_mobile: Number(vData.total_visitas) > 0
          ? Math.round((Number(vData.visitas_mobile) / Number(vData.total_visitas)) * 100)
          : 0,
      },
      paginas_top: paginasRes.rows.map((p) => ({
        ruta: p.ruta,
        visitas: Number(p.visitas),
      })),
      publicidad: {
        impresiones: imp,
        clics: cli,
        ctr: `${ctr}%`,
      },
    });
  } catch (error) {
    console.error("Error al obtener resumen de analíticas:", error);
    res.status(500).json({ error: "Error al obtener resumen de analíticas" });
  }
};

module.exports = {
  registrarVisita,
  registrarEvento,
  getResumenAnalytics,
};
