// backend/src/controllers/catalogo.controller.js
const pool = require("../db");

// Subconsulta reutilizada: arma el array de promos activas de un producto
// como jsonb, para no tener que hacer un segundo fetch desde el frontend.
const PROMOS_ACTIVAS_SUBQUERY = `
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'cantidad_kg', p.cantidad_kg,
          'precio_promocional', p.precio_promocional
        ) ORDER BY p.cantidad_kg
      )
      FROM catalogo_promos p
      WHERE p.catalogo_id = c.id AND p.activa = true
    ),
    '[]'::jsonb
  ) AS promos
`;

// GET /catalogo
// Listado completo. Filtros opcionales por query string:
//   ?activo=true    -> solo productos visibles en la tienda
//   ?destacar=true  -> solo productos destacados
// El ecommerce va a pedir con filtros; el panel admin generalmente pide
// todo sin filtrar, para poder gestionar incluso lo que está inactivo.
const getCatalogo = async (req, res) => {
  const { activo, destacar } = req.query;

  const condiciones = [];
  const valores = [];

  if (activo !== undefined) {
    valores.push(activo === "true");
    condiciones.push(`c.activo = $${valores.length}`);
  }

  if (destacar !== undefined) {
    valores.push(destacar === "true");
    condiciones.push(`c.destacar = $${valores.length}`);
  }

  const whereClause = condiciones.length
    ? `WHERE ${condiciones.join(" AND ")}`
    : "";

  try {
    const result = await pool.query(
      `SELECT c.*, ${PROMOS_ACTIVAS_SUBQUERY}
       FROM catalogo c
       ${whereClause}
       ORDER BY c.nombre_producto`,
      valores,
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener el catálogo:", error.message);
    res.status(500).json({ error: "Error al obtener el catálogo" });
  }
};

// GET /catalogo/:id
// Acepta id numérico o slug. Por default solo trae promos activas; el panel
// admin puede pedir también las inactivas con ?incluir_promos_inactivas=true
// para poder gestionarlas (reactivar, editar) desde ProductEditor.
const getCatalogoItem = async (req, res) => {
  const { id } = req.params;
  const incluirInactivas = req.query.incluir_promos_inactivas === "true";

  const promosSubquery = incluirInactivas
    ? `
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', p.id,
              'cantidad_kg', p.cantidad_kg,
              'precio_promocional', p.precio_promocional,
              'activa', p.activa
            ) ORDER BY p.cantidad_kg
          )
          FROM catalogo_promos p
          WHERE p.catalogo_id = c.id
        ),
        '[]'::jsonb
      ) AS promos
    `
    : PROMOS_ACTIVAS_SUBQUERY;

  try {
    const result = await pool.query(
      `SELECT c.*, ${promosSubquery}
       FROM catalogo c
       WHERE c.id::text = $1 OR c.slug = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener el producto:", error.message);
    res.status(500).json({ error: "Error al obtener el producto" });
  }
};

// POST /catalogo
const createCatalogoItem = async (req, res) => {
  const {
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
    precio,
    precio_anterior,
    activo,
    destacar,
    gana_puntos,
    puntos,
  } = req.body;

  if (!nombre_producto || !slug || !especie) {
    return res.status(400).json({
      error: "Faltan campos obligatorios: nombre_producto, slug o especie",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO catalogo (
         nombre_producto, slug, descripcion, especie, categoria,
         imagen_url, unidad_medida, calorias, proteinas, grasas,
         precio, precio_anterior, activo, destacar, gana_puntos, puntos
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        nombre_producto,
        slug,
        descripcion || null,
        especie,
        categoria || null,
        imagen_url || null,
        unidad_medida || "kg",
        calorias ?? null,
        proteinas ?? null,
        grasas ?? null,
        precio ?? 0,
        precio_anterior ?? 0,
        activo ?? true,
        destacar ?? false,
        gana_puntos ?? false,
        puntos ?? 0,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "Ya existe un producto con ese slug" });
    }

    console.error("Error al crear el producto:", error.message);
    res.status(500).json({ error: "Error al crear el producto" });
  }
};

// PUT /catalogo/:id
const updateCatalogoItem = async (req, res) => {
  const { id } = req.params;
  const {
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
    precio,
    precio_anterior,
    activo,
    destacar,
    gana_puntos,
    puntos,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE catalogo SET
         nombre_producto = $1,
         slug = $2,
         descripcion = $3,
         especie = $4,
         categoria = $5,
         imagen_url = $6,
         unidad_medida = $7,
         calorias = $8,
         proteinas = $9,
         grasas = $10,
         precio = $11,
         precio_anterior = $12,
         activo = $13,
         destacar = $14,
         gana_puntos = $15,
         puntos = $16,
         actualizado_en = now()
       WHERE id = $17
       RETURNING *`,
      [
        nombre_producto,
        slug,
        descripcion || null,
        especie,
        categoria || null,
        imagen_url || null,
        unidad_medida || "kg",
        calorias ?? null,
        proteinas ?? null,
        grasas ?? null,
        precio ?? 0,
        precio_anterior ?? 0,
        activo ?? true,
        destacar ?? false,
        gana_puntos ?? false,
        puntos ?? 0,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "Ya existe un producto con ese slug" });
    }

    console.error("Error al actualizar el producto:", error.message);
    res.status(500).json({ error: "Error al actualizar el producto" });
  }
};

// PATCH /catalogo/:id/estado
// Atajo liviano para togglear "activo" sin reenviar el formulario completo.
const toggleActivoCatalogoItem = async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  if (typeof activo !== "boolean") {
    return res
      .status(400)
      .json({ error: "El campo 'activo' debe ser true o false" });
  }

  try {
    const result = await pool.query(
      `UPDATE catalogo SET activo = $1, actualizado_en = now() WHERE id = $2 RETURNING *`,
      [activo, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al cambiar el estado del producto:", error.message);
    res.status(500).json({ error: "Error al cambiar el estado del producto" });
  }
};

// DELETE /catalogo/:id
const deleteCatalogoItem = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM catalogo WHERE id = $1 RETURNING id`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    // 23503 = violación de foreign key: hay stock_sucursal o pedido_items
    // apuntando a este producto. No lo dejamos caer, sugerimos desactivar.
    if (error.code === "23503") {
      return res.status(409).json({
        error:
          "No se puede eliminar: el producto tiene stock o pedidos asociados. Desactivalo en su lugar.",
      });
    }

    console.error("Error al eliminar el producto:", error.message);
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
};

// POST /catalogo/:id/promos
// Crea un tramo de promo por cantidad para un producto (ej: 2kg x $1.234).
const createPromo = async (req, res) => {
  const { id } = req.params; // catalogo_id
  const { cantidad_kg, precio_promocional, activa } = req.body;

  if (!cantidad_kg || !precio_promocional) {
    return res.status(400).json({
      error: "Faltan campos obligatorios: cantidad_kg o precio_promocional",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO catalogo_promos (catalogo_id, cantidad_kg, precio_promocional, activa)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, cantidad_kg, precio_promocional, activa ?? true],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    // 23505 = ya existe una promo para esa cantidad_kg en este producto
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Ya existe una promo para esa cantidad en este producto",
      });
    }

    // 23503 = el catalogo_id no corresponde a ningún producto
    if (error.code === "23503") {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    console.error("Error al crear la promo:", error.message);
    res.status(500).json({ error: "Error al crear la promo" });
  }
};

// PUT /catalogo/:id/promos/:promoId
const updatePromo = async (req, res) => {
  const { id, promoId } = req.params;
  const { cantidad_kg, precio_promocional, activa } = req.body;

  try {
    const result = await pool.query(
      `UPDATE catalogo_promos
       SET cantidad_kg = $1, precio_promocional = $2, activa = $3
       WHERE id = $4 AND catalogo_id = $5
       RETURNING *`,
      [cantidad_kg, precio_promocional, activa ?? true, promoId, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Promo no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Ya existe una promo para esa cantidad en este producto",
      });
    }

    console.error("Error al actualizar la promo:", error.message);
    res.status(500).json({ error: "Error al actualizar la promo" });
  }
};

// DELETE /catalogo/:id/promos/:promoId
const deletePromo = async (req, res) => {
  const { id, promoId } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM catalogo_promos WHERE id = $1 AND catalogo_id = $2 RETURNING id`,
      [promoId, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Promo no encontrada" });
    }

    res.json({ message: "Promo eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la promo:", error.message);
    res.status(500).json({ error: "Error al eliminar la promo" });
  }
};

module.exports = {
  getCatalogo,
  getCatalogoItem,
  createCatalogoItem,
  updateCatalogoItem,
  toggleActivoCatalogoItem,
  deleteCatalogoItem,
  createPromo,
  updatePromo,
  deletePromo,
};
