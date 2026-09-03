// src/controllers/sucursales.controller.js
const pool = require("../db");

// GET /sucursales
// Listado liviano — lo usa la Sidebar para armar el menú dinámico
const getAllSucursales = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre, ciudad, slug, activa, horario_atencion, direccion, horarios_apertura FROM sucursales ORDER BY nombre`,
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

/**
 * GET /sucursales/:id/metricas
 * Devuelve métricas financieras, volumen en kg, top cortes ganadores y estancados
 * Filtro por rango: ?rango=hoy | semana | mes | anio
 */
const getMetricasSucursal = async (req, res) => {
  const { id } = req.params; // Puede ser id numérico o slug
  const { rango = "hoy" } = req.query;

  let timeFilter = "p.creado_en >= CURRENT_DATE";
  if (rango === "semana") timeFilter = "p.creado_en >= CURRENT_DATE - INTERVAL '7 days'";
  if (rango === "mes") timeFilter = "p.creado_en >= DATE_TRUNC('month', CURRENT_DATE)";
  if (rango === "anio") timeFilter = "p.creado_en >= DATE_TRUNC('year', CURRENT_DATE)";

  try {
    // 1. Obtener id de la sucursal
    const sucRes = await pool.query(
      `SELECT id, nombre, slug FROM sucursales WHERE id::text = $1 OR slug = $1 LIMIT 1`,
      [id]
    );

    if (sucRes.rows.length === 0) {
      return res.status(404).json({ error: "Sucursal no encontrada" });
    }

    const sucursalId = sucRes.rows[0].id;

    // 2. Métricas generales de pedidos y facturación
    const resumenRes = await pool.query(
      `SELECT
         COALESCE(SUM(COALESCE(p.monto_total_final, p.monto_total_estimado)), 0) AS facturacion_total,
         COUNT(p.id) AS pedidos_total,
         COUNT(CASE WHEN p.estado_local = 'entregado' THEN 1 END) AS pedidos_completados,
         COUNT(CASE WHEN p.estado_local NOT IN ('entregado', 'cancelado') THEN 1 END) AS pedidos_pendientes,
         COALESCE(AVG(COALESCE(p.monto_total_final, p.monto_total_estimado)), 0) AS ticket_promedio
       FROM pedidos p
       WHERE p.sucursal_id = $1 AND ${timeFilter} AND p.estado_local != 'cancelado'`,
      [sucursalId]
    );

    const resumen = resumenRes.rows[0];

    // 3. Volumen de kg y desglose por especie
    const kgRes = await pool.query(
      `SELECT
         COALESCE(SUM(pi.cantidad_kg_solicitada), 0) AS total_kg,
         COALESCE(SUM(CASE WHEN LOWER(c.especie) = 'vacuno' THEN pi.cantidad_kg_solicitada ELSE 0 END), 0) AS vacuno_kg,
         COALESCE(SUM(CASE WHEN LOWER(c.especie) = 'cerdo' THEN pi.cantidad_kg_solicitada ELSE 0 END), 0) AS cerdo_kg,
         COALESCE(SUM(CASE WHEN LOWER(c.especie) = 'pollo' THEN pi.cantidad_kg_solicitada ELSE 0 END), 0) AS pollo_kg,
         COALESCE(SUM(CASE WHEN LOWER(c.especie) NOT IN ('vacuno', 'cerdo', 'pollo') THEN pi.cantidad_kg_solicitada ELSE 0 END), 0) AS elaborados_kg
       FROM pedido_items pi
       JOIN pedidos p ON pi.pedido_id = p.id
       JOIN catalogo c ON pi.catalogo_id = c.id
       WHERE p.sucursal_id = $1 AND ${timeFilter} AND p.estado_local != 'cancelado'`,
      [sucursalId]
    );

    const kgData = kgRes.rows[0];

    // 4. Cortes Ganadores (Top 5 más vendidos en kg)
    const ganadoresRes = await pool.query(
      `SELECT
         c.id,
         c.nombre_producto,
         c.especie,
         c.imagen_url,
         c.precio,
         COALESCE(SUM(pi.cantidad_kg_solicitada), 0) AS kg_vendidos,
         COALESCE(SUM(pi.cantidad_kg_solicitada * COALESCE(pi.precio_por_kg_congelado, c.precio)), 0) AS total_facturado
       FROM pedido_items pi
       JOIN pedidos p ON pi.pedido_id = p.id
       JOIN catalogo c ON pi.catalogo_id = c.id
       WHERE p.sucursal_id = $1 AND ${timeFilter} AND p.estado_local != 'cancelado'
       GROUP BY c.id, c.nombre_producto, c.especie, c.imagen_url, c.precio
       ORDER BY kg_vendidos DESC
       LIMIT 5`,
      [sucursalId]
    );

    // 5. Cortes con menor rotación o estancados
    const estancadosRes = await pool.query(
      `SELECT
         c.id,
         c.nombre_producto,
         c.especie,
         c.imagen_url,
         c.precio,
         COALESCE(SUM(CASE WHEN p.sucursal_id = $1 AND ${timeFilter} AND p.estado_local != 'cancelado' THEN pi.cantidad_kg_solicitada ELSE 0 END), 0) AS kg_vendidos
       FROM catalogo c
       LEFT JOIN pedido_items pi ON c.id = pi.catalogo_id
       LEFT JOIN pedidos p ON pi.pedido_id = p.id
       WHERE c.activo = true
       GROUP BY c.id, c.nombre_producto, c.especie, c.imagen_url, c.precio
       ORDER BY kg_vendidos ASC, c.nombre_producto ASC
       LIMIT 5`,
      [sucursalId]
    );

    res.json({
      sucursal: sucRes.rows[0],
      rango,
      facturacion_total: Number(resumen.facturacion_total),
      pedidos_total: Number(resumen.pedidos_total),
      pedidos_completados: Number(resumen.pedidos_completados),
      pedidos_pendientes: Number(resumen.pedidos_pendientes),
      ticket_promedio: Math.round(Number(resumen.ticket_promedio)),
      volumen_kg: {
        total: Number(kgData.total_kg),
        vacuno: Number(kgData.vacuno_kg),
        cerdo: Number(kgData.cerdo_kg),
        pollo: Number(kgData.pollo_kg),
        elaborados: Number(kgData.elaborados_kg),
      },
      cortes_ganadores: ganadoresRes.rows.map((row) => ({
        ...row,
        kg_vendidos: Number(row.kg_vendidos),
        total_facturado: Number(row.total_facturado),
      })),
      cortes_estancados: estancadosRes.rows.map((row) => ({
        ...row,
        kg_vendidos: Number(row.kg_vendidos),
      })),
    });
  } catch (error) {
    console.error("Error al obtener métricas de sucursal:", error);
    res.status(500).json({ error: "Error al calcular métricas de la sucursal" });
  }
};

/**
 * GET /sucursales/:id/pedidos
 * Devuelve todos los pedidos de la sucursal con sus items y clientes
 */
const getPedidosSucursal = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.query;

  try {
    const sucRes = await pool.query(
      `SELECT id FROM sucursales WHERE id::text = $1 OR slug = $1 LIMIT 1`,
      [id]
    );

    if (sucRes.rows.length === 0) {
      return res.status(404).json({ error: "Sucursal no encontrada" });
    }

    const sucursalId = sucRes.rows[0].id;

    let query = `
      SELECT
        p.*,
        p.estado_local AS estado,
        p.monto_total_final AS monto_final_real,
        c.nombre AS cliente_nombre,
        c.usuario AS cliente_usuario,
        c.telefono AS cliente_telefono,
        c.email AS cliente_email,
        e.nombre AS cortador_nombre,
        e.apodo AS cortador_apodo,
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', pi.id,
                'catalogo_id', pi.catalogo_id,
                'nombre_producto', cat.nombre_producto,
                'cantidad_kg', pi.cantidad_kg_solicitada,
                'precio_al_agregar', pi.precio_por_kg_congelado,
                'unidad_medida', cat.unidad_medida,
                'especie', cat.especie,
                'categoria', cat.categoria,
                'imagen_url', cat.imagen_url
              )
            )
            FROM pedido_items pi
            JOIN catalogo cat ON pi.catalogo_id = cat.id
            WHERE pi.pedido_id = p.id
          ),
          '[]'::jsonb
        ) AS items
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN empleados e ON p.cortador_id = e.id
      WHERE p.sucursal_id = $1
    `;

    const params = [sucursalId];

    if (estado && estado !== "todos") {
      params.push(estado);
      query += ` AND p.estado_local = $2`;
    }

    query += ` ORDER BY p.creado_en DESC LIMIT 100`;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener pedidos de sucursal:", error);
    res.status(500).json({ error: "Error al obtener pedidos de la sucursal" });
  }
};

module.exports = {
  getAllSucursales,
  getSucursal,
  createSucursal,
  getMetricasSucursal,
  getPedidosSucursal,
};
