// src/controllers/inventario.controller.js
const pool = require("../db");

// GET /inventario/resumen?sucursal_id=1
// Números clave para el Overview de la sucursal
const getResumenSucursal = async (req, res) => {
  const { sucursal_id } = req.query;

  if (!sucursal_id) {
    return res.json({ error: "Falta el parámetro sucursal_id" });
  }

  try {
    const agregadosResult = await pool.query(
      `SELECT
         COUNT(DISTINCT i.catalogo_id) AS productos_con_precio,
         COUNT(p.id) FILTER (WHERE p.estado = 'disponible') AS paquetes_disponibles,
         COALESCE(SUM(p.precio_final) FILTER (WHERE p.estado = 'disponible'), 0) AS valor_stock_disponible
       FROM inventario i
       LEFT JOIN paquetes p ON p.inventario_id = i.id
       WHERE i.sucursal_id = $1`,
      [sucursal_id],
    );

    const totalCatalogoResult = await pool.query(
      `SELECT COUNT(*) AS total FROM catalogo`,
    );

    // Productos que ya tienen precio cargado en esta sucursal pero
    // ningún paquete disponible ahora mismo (hay que reponer)
    const sinStockResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM inventario i
       WHERE i.sucursal_id = $1
         AND NOT EXISTS (
           SELECT 1 FROM paquetes p
           WHERE p.inventario_id = i.id AND p.estado = 'disponible'
         )`,
      [sucursal_id],
    );

    const agregados = agregadosResult.rows[0];

    res.json({
      productos_con_precio: parseInt(agregados.productos_con_precio, 10),
      productos_total_catalogo: parseInt(totalCatalogoResult.rows[0].total, 10),
      paquetes_disponibles: parseInt(agregados.paquetes_disponibles, 10),
      valor_stock_disponible: parseInt(agregados.valor_stock_disponible, 10),
      productos_sin_stock: parseInt(sinStockResult.rows[0].total, 10),
    });
  } catch (error) {
    console.log(error.message);
    res.json({ error: "Error al obtener el resumen de la sucursal" });
  }
};

// GET /inventario?sucursal_id=1
// TODO el catálogo, con el precio y los paquetes que tenga cargados en esta
// sucursal puntual. Si un producto todavía no se cargó acá, inventario_id
// viene null — así el front sabe que hay que darlo de alta primero.
const getStockSucursal = async (req, res) => {
  const { sucursal_id } = req.query;

  if (!sucursal_id) {
    return res.json({ error: "Falta el parámetro sucursal_id" });
  }

  try {
    const productosResult = await pool.query(
      `SELECT
         c.id AS catalogo_id,
         c.nombre_producto,
         c.slug,
         c.imagen_url,
         c.unidad_medida,
         i.id AS inventario_id,
         i.precio_por_kg,
         i.precio_anterior
       FROM catalogo c
       LEFT JOIN inventario i
         ON i.catalogo_id = c.id AND i.sucursal_id = $1
       ORDER BY c.nombre_producto`,
      [sucursal_id],
    );

    const paquetesResult = await pool.query(
      `SELECT p.id, p.inventario_id, p.peso, p.precio_final, p.estado
       FROM paquetes p
       JOIN inventario i ON i.id = p.inventario_id
       WHERE i.sucursal_id = $1
       ORDER BY p.peso ASC`,
      [sucursal_id],
    );

    const productos = productosResult.rows.map((producto) => ({
      ...producto,
      paquetes: paquetesResult.rows.filter(
        (paquete) => paquete.inventario_id === producto.inventario_id,
      ),
    }));

    res.json(productos);
  } catch (error) {
    console.log(error.message);
    res.json({ error: "Error al obtener el stock de la sucursal" });
  }
};

// POST /inventario
// Da de alta el precio de un producto del catálogo en una sucursal puntual.
// Paso obligatorio antes de poder cargarle paquetes ahí.
const createInventario = async (req, res) => {
  const { catalogo_id, sucursal_id, precio_por_kg } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO inventario (catalogo_id, sucursal_id, precio_por_kg)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [catalogo_id, sucursal_id, precio_por_kg],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.log(error.message);
    res.json({ error: "Error al cargar el precio en esta sucursal" });
  }
};

// POST /paquetes
// Agrega un paquete cerrado (peso + precio final) al stock de un producto
// ya cargado en una sucursal.
const createPaquete = async (req, res) => {
  const { inventario_id, peso, precio_final } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO paquetes (inventario_id, peso, precio_final)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [inventario_id, peso, precio_final],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.log(error.message);
    res.json({ error: "Error al agregar el paquete" });
  }
};

// PUT /inventario/precio
// Actualiza el precio global del producto en la sucursal (afecta el cálculo de todo el stock)
const updatePrecioInventario = async (req, res) => {
  const { inventario_id, precio_por_kg, precio_anterior } = req.body;

  try {
    const result = await pool.query(
      `UPDATE inventario 
       SET precio_por_kg = $1, precio_anterior = $2 
       WHERE id = $3 RETURNING *`,
      [precio_por_kg, precio_anterior, inventario_id],
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar precio" });
  }
};

// DELETE /paquetes/:id
// Elimina un paquete de la base de datos
const deletePaquete = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(`DELETE FROM paquetes WHERE id = $1`, [id]);
    res.json({ message: "Paquete eliminado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar paquete" });
  }
};

// PUT /paquetes/:id
// Edita un paquete existente (peso o estado)
const updatePaquete = async (req, res) => {
  const { id } = req.params;
  const { peso, estado } = req.body;

  try {
    const result = await pool.query(
      `UPDATE paquetes 
       SET peso = $1, estado = $2 
       WHERE id = $3 RETURNING *`,
      [peso, estado, id],
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar paquete" });
  }
};

module.exports = {
  getResumenSucursal,
  getStockSucursal,
  createInventario,
  createPaquete,
  updatePrecioInventario,
  deletePaquete,
  updatePaquete,
};
