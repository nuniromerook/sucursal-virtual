// backend/src/controllers/dashboard.controller.js
const pool = require("../db");

/**
 * GET /dashboard/resumen
 * Devuelve la vista 360° consolidada de la empresa para la Torre de Control (Inicio.jsx)
 */
const getDashboardResumen = async (req, res) => {
  const { rango = "hoy" } = req.query;

  let timeFilter = "p.creado_en >= CURRENT_DATE";
  let timeFilterSinAlias = "creado_en >= CURRENT_DATE";
  if (rango === "semana") {
    timeFilter = "p.creado_en >= CURRENT_DATE - INTERVAL '7 days'";
    timeFilterSinAlias = "creado_en >= CURRENT_DATE - INTERVAL '7 days'";
  } else if (rango === "mes") {
    timeFilter = "p.creado_en >= DATE_TRUNC('month', CURRENT_DATE)";
    timeFilterSinAlias = "creado_en >= DATE_TRUNC('month', CURRENT_DATE)";
  } else if (rango === "anio") {
    timeFilter = "p.creado_en >= DATE_TRUNC('year', CURRENT_DATE)";
    timeFilterSinAlias = "creado_en >= DATE_TRUNC('year', CURRENT_DATE)";
  }

  try {
    // 1. KPIs Globales Consolidados
    const kpisRes = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN estado_local != 'cancelado' THEN COALESCE(monto_total_final, monto_total_estimado) ELSE 0 END), 0) AS facturacion_total,
        COUNT(id) AS pedidos_total,
        COUNT(CASE WHEN estado_local = 'entregado' THEN 1 END) AS pedidos_entregados,
        COUNT(CASE WHEN estado_local IN ('solicitado', 'en_corte', 'pesado', 'listo', 'en_camino') THEN 1 END) AS pedidos_pendientes,
        COALESCE(AVG(CASE WHEN estado_local != 'cancelado' THEN COALESCE(monto_total_final, monto_total_estimado) END), 0) AS ticket_promedio
      FROM pedidos
      WHERE ${timeFilterSinAlias}
    `);

    const kpi = kpisRes.rows[0];

    // 2. Kilos totales despachados por especie
    const kgRes = await pool.query(`
      SELECT 
        LOWER(COALESCE(c.especie, 'vacuno')) AS especie,
        COALESCE(SUM(pi.cantidad_kg_solicitada), 0) AS total_kg
      FROM pedido_items pi
      JOIN pedidos p ON pi.pedido_id = p.id
      JOIN catalogo c ON pi.catalogo_id = c.id
      WHERE p.estado_local != 'cancelado' AND ${timeFilter}
      GROUP BY LOWER(COALESCE(c.especie, 'vacuno'))
    `);

    const kgMap = { vacuno: 0, cerdo: 0, pollo: 0, elaborados: 0, total: 0 };
    kgRes.rows.forEach((r) => {
      const esp = r.especie;
      const kg = parseFloat(r.total_kg) || 0;
      if (esp.includes("cerdo")) kgMap.cerdo += kg;
      else if (esp.includes("pollo")) kgMap.pollo += kg;
      else if (esp.includes("elaborad") || esp.includes("embutid") || esp.includes("preparad")) kgMap.elaborados += kg;
      else kgMap.vacuno += kg;
      kgMap.total += kg;
    });

    // 3. Tablero de Red de Sucursales
    const sucursalesRes = await pool.query(`
      SELECT 
        s.id,
        s.nombre,
        s.ciudad,
        s.slug,
        s.activa,
        s.direccion,
        s.telefono,
        COALESCE(
          (
            SELECT SUM(COALESCE(p.monto_total_final, p.monto_total_estimado))
            FROM pedidos p
            WHERE p.sucursal_id = s.id AND p.estado_local != 'cancelado' AND ${timeFilter}
          ), 0
        ) AS facturacion_hoy,
        COALESCE(
          (
            SELECT COUNT(p.id)
            FROM pedidos p
            WHERE p.sucursal_id = s.id AND p.estado_local IN ('solicitado', 'en_corte', 'pesado', 'listo', 'en_camino')
          ), 0
        ) AS pedidos_pendientes,
        COALESCE(
          (
            SELECT COUNT(e.id)
            FROM empleados e
            WHERE e.sucursal_id = s.id AND e.activo = true
          ), 0
        ) AS empleados_activos
      FROM sucursales s
      ORDER BY s.id ASC
    `);

    // 4. Últimos pedidos en vivo (Live feed)
    const ultimosPedidosRes = await pool.query(`
      SELECT 
        p.id,
        p.estado_local AS estado,
        COALESCE(p.monto_total_final, p.monto_total_estimado) AS monto,
        p.tipo_entrega,
        p.creado_en,
        c.nombre AS cliente_nombre,
        s.nombre AS sucursal_nombre,
        s.slug AS sucursal_slug
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
      JOIN sucursales s ON p.sucursal_id = s.id
      ORDER BY p.creado_en DESC
      LIMIT 8
    `);

    // 5. Cortes Ganadores (Top vendidos de la cadena)
    const topCortesRes = await pool.query(`
      SELECT 
        c.id,
        c.nombre_producto,
        c.especie,
        c.imagen_url,
        SUM(pi.cantidad_kg_solicitada) AS total_kg_vendidos,
        COUNT(DISTINCT p.id) AS total_pedidos
      FROM pedido_items pi
      JOIN pedidos p ON pi.pedido_id = p.id
      JOIN catalogo c ON pi.catalogo_id = c.id
      WHERE p.estado_local != 'cancelado' AND ${timeFilter}
      GROUP BY c.id, c.nombre_producto, c.especie, c.imagen_url
      ORDER BY total_kg_vendidos DESC
      LIMIT 5
    `);

    res.json({
      rango,
      facturacion_total: parseFloat(kpi.facturacion_total) || 0,
      pedidos_total: parseInt(kpi.pedidos_total, 10) || 0,
      pedidos_entregados: parseInt(kpi.pedidos_entregados, 10) || 0,
      pedidos_pendientes: parseInt(kpi.pedidos_pendientes, 10) || 0,
      ticket_promedio: Math.round(parseFloat(kpi.ticket_promedio) || 0),
      volumen_kg: {
        total: Math.round(kgMap.total * 10) / 10,
        vacuno: Math.round(kgMap.vacuno * 10) / 10,
        cerdo: Math.round(kgMap.cerdo * 10) / 10,
        pollo: Math.round(kgMap.pollo * 10) / 10,
        elaborados: Math.round(kgMap.elaborados * 10) / 10,
      },
      sucursales: sucursalesRes.rows.map((s) => ({
        ...s,
        facturacion_hoy: parseFloat(s.facturacion_hoy) || 0,
        pedidos_pendientes: parseInt(s.pedidos_pendientes, 10) || 0,
        empleados_activos: parseInt(s.empleados_activos, 10) || 0,
      })),
      ultimos_pedidos: ultimosPedidosRes.rows,
      cortes_ganadores: topCortesRes.rows.map((c) => ({
        ...c,
        total_kg_vendidos: parseFloat(c.total_kg_vendidos) || 0,
        total_pedidos: parseInt(c.total_pedidos, 10) || 0,
      })),
    });
  } catch (error) {
    console.error("Error al obtener resumen del dashboard:", error);
    res.status(500).json({ error: "Error al obtener resumen del dashboard" });
  }
};

module.exports = {
  getDashboardResumen,
};
