// src/controllers/products.controller.js
const pool = require("../db");

// GET /products/home?sucursal_id=1
const getHomeProducts = async (req, res) => {
  const { sucursal_id } = req.query;

  if (!sucursal_id) {
    return res.status(400).json({ error: "Falta el parámetro sucursal_id" });
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
         i.gana_puntos,
         i.puntos,
         i.destacado,
         COUNT(p.id) FILTER (WHERE p.estado = 'disponible') AS paquetes_disponibles,
         MIN(p.precio_final) FILTER (WHERE p.estado = 'disponible') AS precio_desde
       FROM catalogo c
       JOIN inventario i ON c.id = i.catalogo_id
       LEFT JOIN paquetes p ON p.inventario_id = i.id
       WHERE i.sucursal_id = $1 AND i.activo = true
       GROUP BY c.id, i.id
       ORDER BY c.nombre_producto`,
      [sucursal_id],
    );

    const mappedProducts = result.rows.map((row) => ({
      id: row.id,
      name: row.nombre_producto,
      slug: row.slug,
      categoria: row.categoria,
      especie: row.especie,
      imageSrc:
        row.imagen_url ||
        "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800",
      imageAlt: row.nombre_producto,
      price: Number(row.precio_por_kg || 0),
      previousPrice: row.precio_anterior ? Number(row.precio_anterior) : null,
      earnsPoints: Boolean(row.gana_puntos),
      points: row.puntos || 0,
      destacado: Boolean(row.destacado),
      unidad_medida: row.unidad_medida || "kg",
      paquetesDisponibles: parseInt(row.paquetes_disponibles, 10),
      precioDesde: row.precio_desde ? Number(row.precio_desde) : null,
    }));

    // Agrupamos en Backend según los criterios requeridos
    const destacados = mappedProducts.filter((p) => p.destacado).slice(0, 10);
    const ofertas = mappedProducts
      .filter((p) => p.previousPrice && p.previousPrice > p.price)
      .slice(0, 10);

    res.json({
      destacados,
      ofertas,
      todos: mappedProducts,
    });
  } catch (error) {
    console.error("Error al obtener productos para Home:", error.message);
    res.status(500).json({ error: "Error interno al cargar la portada" });
  }
};

// GET /products?sucursal_id=1
const getProducts = async (req, res) => {
  const { sucursal_id } = req.query;

  if (!sucursal_id) {
    return res.status(400).json({ error: "Falta el parámetro sucursal_id" });
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
           i.gana_puntos,
           i.puntos,
           COUNT(p.id) FILTER (WHERE p.estado = 'disponible') AS paquetes_disponibles,
           MIN(p.precio_final) FILTER (WHERE p.estado = 'disponible') AS precio_desde
         FROM catalogo c
         JOIN inventario i ON c.id = i.catalogo_id
         LEFT JOIN paquetes p ON p.inventario_id = i.id
         WHERE i.sucursal_id = $1
         GROUP BY c.id, i.id
         ORDER BY c.nombre_producto`,
      [sucursal_id],
    );

    const productos = result.rows.map((row) => ({
      ...row,
      paquetes_disponibles: parseInt(row.paquetes_disponibles, 10),
    }));

    res.json(productos);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

// GET /products/:id_or_slug?sucursal_id=1
const getProduct = async (req, res) => {
  const { id } = req.params; // Puede ser ID o slug
  const { sucursal_id } = req.query;

  if (!sucursal_id) {
    return res.status(400).json({ error: "Falta el parámetro sucursal_id" });
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
         c.grasas,
         i.id AS inventario_id,
         i.precio_por_kg,
         i.precio_anterior
       FROM catalogo c
       JOIN inventario i ON c.id = i.catalogo_id
       WHERE (c.slug = $1 OR c.id::text = $1)
         AND i.sucursal_id = $2`,
      [id, sucursal_id],
    );

    if (productoResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Producto no encontrado en esta sucursal" });
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
    console.error(error.message);
    res.status(500).json({ error: "Error al obtener el producto" });
  }
};

// GET /products
// Listado general de productos (sin sucursal) — todo el catálogo
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
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO catalogo (nombre_producto, slug, descripcion, especie, categoria, imagen_url, unidad_medida, calorias, proteinas, grasas) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
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
  getHomeProducts,
};
