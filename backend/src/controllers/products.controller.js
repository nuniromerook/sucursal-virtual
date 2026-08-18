// src/controllers/products.controller.js
const pool = require("../db");

// GET /products
// Listado general de productos (sin sucursal)
// Solo devuelve productos activos del catálogo
const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM catalogo ORDER BY nombre_producto`,
    );

    res.json(result.rows);
  } catch (error) {
    res.json({ error: "Error al obtener productos" });
  }
};

// GET /products?sucursal_id=1
// Listado general por sucursal — trae un resumen de precio y disponibilidad
const getProducts = async (req, res) => {
  const { sucursal_id } = req.query;

  if (!sucursal_id) {
    return res.json({ error: "Falta el parámetro sucursal_id" });
  }

  try {
    const result = await pool.query(
      `SELECT 
           c.id,
           c.nombre_producto,
           c.slug,
           c.imagen_url,
           c.especie,
           c.categoria,
           c.unidad_medida,
           i.precio_por_kg,
           i.precio_anterior,
           COUNT(p.id) FILTER (WHERE p.estado = 'disponible') AS paquetes_disponibles,
           MIN(p.precio_final) FILTER (WHERE p.estado = 'disponible') AS precio_desde
         FROM catalogo c
         JOIN inventario i ON c.id = i.catalogo_id
         LEFT JOIN paquetes p ON p.inventario_id = i.id
         WHERE i.sucursal_id = $1
           AND c.activo = true
         GROUP BY c.id, i.id
         ORDER BY c.nombre_producto`,
      [sucursal_id],
    );

    // Postgres devuelve COUNT() como string (bigint) — lo convertimos a número
    const productos = result.rows.map((row) => ({
      ...row,
      paquetes_disponibles: parseInt(row.paquetes_disponibles, 10),
    }));

    res.json(productos);
  } catch (error) {
    res.json({ error: "Error al obtener productos" });
  }
};

// GET /products/:id?sucursal_id=1
// Detalle — trae el producto + TODOS sus paquetes disponibles (el selector)
const getProduct = async (req, res) => {
  const { id } = req.params;
  const { sucursal_id } = req.query;

  if (!sucursal_id) {
    return res.json({ error: "Falta el parámetro sucursal_id" });
  }

  try {
    const productoResult = await pool.query(
      `SELECT 
         c.id,
         c.nombre_producto,
         c.slug,
         c.descripcion,
         c.imagen_url,
         c.especie,
         c.categoria,
         c.unidad_medida,
         c.calorias,
         c.proteinas,
         c.grasas_totales,
         i.id AS inventario_id,
         i.precio_por_kg,
         i.precio_anterior
       FROM catalogo c
       JOIN inventario i ON c.id = i.catalogo_id
       WHERE c.id = $1
         AND i.sucursal_id = $2
         AND c.activo = true`,
      [id, sucursal_id],
    );

    if (productoResult.rows.length === 0) {
      return res.json({ error: "Producto no encontrado en esta sucursal" });
    }

    const producto = productoResult.rows[0];

    const paquetesResult = await pool.query(
      `SELECT id, peso, precio_final
       FROM paquetes
       WHERE inventario_id = $1
         AND estado = 'disponible'
       ORDER BY peso ASC`,
      [producto.inventario_id],
    );

    res.json({
      ...producto,
      paquetes: paquetesResult.rows,
    });
  } catch (error) {
    res.json({ error: "Error al obtener el producto" });
  }
};

// GET /products/:id
// Detalle — trae el producto desde el catálogo
const getProductFromCatalog = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`SELECT * FROM catalogo WHERE id = $1`, [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.json({ error: "Error al obtener el producto" });
  }
};

// POST /products
// Crear un nuevo producto
const createProduct = async (req, res) => {
  const {
    activo,
    nombre_producto,
    slug,
    especie,
    categoria,
    unidad_medida,
    descripcion,
    proteinas,
    calorias,
    grasas,
    imagen_url,
    destacado,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO catalogo (nombre_producto, slug, descripcion, especie, categoria, imagen_url, unidad_medida, calorias, proteinas, grasas, activo, destacado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        nombre_producto,
        slug,
        descripcion,
        especie,
        categoria,
        imagen_url,
        unidad_medida,
        calorias,
        proteinas,
        grasas,
        activo,
        destacado,
      ],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.log(error.message);
    res.json({ error: "Error al crear el producto" });
  }
};

module.exports = {
  getAllProducts,
  getProducts,
  getProduct,
  getProductFromCatalog,
  createProduct,
};
