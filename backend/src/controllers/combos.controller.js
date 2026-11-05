// backend/src/controllers/combos.controller.js
const pool = require("../db");

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

// GET /combos
const getCombos = async (req, res) => {
  try {
    const { incluir_inactivos } = req.query;
    const soloActivos = incluir_inactivos !== "true";

    const whereClause = soloActivos ? "WHERE c.activo = true" : "";

    const query = `
      SELECT 
        c.id, 
        c.nombre, 
        c.slug, 
        c.descripcion, 
        c.precio::numeric, 
        c.precio_anterior::numeric, 
        c.kilos::numeric, 
        c.rinde, 
        c.badge, 
        c.puntos, 
        c.activo, 
        c.orden, 
        c.creado_en, 
        c.actualizado_en,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ci.id,
              'catalogo_id', cat.id,
              'nombre', cat.nombre_producto,
              'slug', cat.slug,
              'categoria', cat.categoria,
              'especie', cat.especie,
              'imagen_url', cat.imagen_url,
              'unidad_medida', cat.unidad_medida,
              'precio_unitario', cat.precio::numeric,
              'sin_stock', COALESCE(cat.sin_stock, false),
              'cantidad_o_peso', ci.cantidad_o_peso,
              'peso_kg', ci.peso_kg::numeric,
              'descripcion_item', ci.descripcion_item,
              'orden', ci.orden
            ) ORDER BY ci.orden ASC, ci.id ASC
          ) FILTER (WHERE ci.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM combos c
      LEFT JOIN combo_items ci ON ci.combo_id = c.id
      LEFT JOIN catalogo cat ON cat.id = ci.catalogo_id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.orden ASC, c.id DESC;
    `;

    const { rows } = await pool.query(query);

    const combosFormateados = rows.map((combo) => {
      const items = Array.isArray(combo.items) ? combo.items : [];

      let precioRegularTotal = 0;
      let totalKilosCalc = 0;

      items.forEach((it) => {
        const peso = Number(it.peso_kg) || 1;
        const precioUnit = Number(it.precio_unitario) || 0;
        precioRegularTotal += peso * precioUnit;
        totalKilosCalc += peso;
      });

      const precioCombo = Number(combo.precio) || 0;
      const ahorroCalculado = Math.max(0, precioRegularTotal - precioCombo);
      const precioAnterior =
        Number(combo.precio_anterior) > 0
          ? Number(combo.precio_anterior)
          : precioRegularTotal;

      return {
        ...combo,
        precio: precioCombo,
        precio_anterior: precioAnterior,
        precio_regular_calculado: precioRegularTotal,
        ahorro: ahorroCalculado,
        kilos: Number(combo.kilos) > 0 ? Number(combo.kilos) : totalKilosCalc,
        items,
      };
    });

    res.json(combosFormateados);
  } catch (err) {
    console.error("Error al obtener combos:", err);
    res.status(500).json({ error: "Error al obtener combos del servidor." });
  }
};

// GET /combos/:id
const getComboById = async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(id);

    const whereClause = isNumeric ? "WHERE c.id = $1" : "WHERE c.slug = $1";

    const query = `
      SELECT 
        c.id, 
        c.nombre, 
        c.slug, 
        c.descripcion, 
        c.precio::numeric, 
        c.precio_anterior::numeric, 
        c.kilos::numeric, 
        c.rinde, 
        c.badge, 
        c.puntos, 
        c.activo, 
        c.orden, 
        c.creado_en, 
        c.actualizado_en,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ci.id,
              'catalogo_id', cat.id,
              'nombre', cat.nombre_producto,
              'slug', cat.slug,
              'categoria', cat.categoria,
              'especie', cat.especie,
              'imagen_url', cat.imagen_url,
              'unidad_medida', cat.unidad_medida,
              'precio_unitario', cat.precio::numeric,
              'sin_stock', COALESCE(cat.sin_stock, false),
              'cantidad_o_peso', ci.cantidad_o_peso,
              'peso_kg', ci.peso_kg::numeric,
              'descripcion_item', ci.descripcion_item,
              'orden', ci.orden
            ) ORDER BY ci.orden ASC, ci.id ASC
          ) FILTER (WHERE ci.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM combos c
      LEFT JOIN combo_items ci ON ci.combo_id = c.id
      LEFT JOIN catalogo cat ON cat.id = ci.catalogo_id
      ${whereClause}
      GROUP BY c.id;
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Combo no encontrado." });
    }

    const combo = rows[0];
    const items = Array.isArray(combo.items) ? combo.items : [];

    let precioRegularTotal = 0;
    let totalKilosCalc = 0;

    items.forEach((it) => {
      const peso = Number(it.peso_kg) || 1;
      const precioUnit = Number(it.precio_unitario) || 0;
      precioRegularTotal += peso * precioUnit;
      totalKilosCalc += peso;
    });

    const precioCombo = Number(combo.precio) || 0;
    const ahorroCalculado = Math.max(0, precioRegularTotal - precioCombo);
    const precioAnterior =
      Number(combo.precio_anterior) > 0
        ? Number(combo.precio_anterior)
        : precioRegularTotal;

    res.json({
      ...combo,
      precio: precioCombo,
      precio_anterior: precioAnterior,
      precio_regular_calculado: precioRegularTotal,
      ahorro: ahorroCalculado,
      kilos: Number(combo.kilos) > 0 ? Number(combo.kilos) : totalKilosCalc,
      items,
    });
  } catch (err) {
    console.error("Error al obtener combo:", err);
    res.status(500).json({ error: "Error al obtener detalle del combo." });
  }
};

// POST /combos
const createCombo = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      nombre,
      slug,
      descripcion,
      precio,
      precio_anterior,
      kilos,
      rinde,
      badge,
      puntos,
      activo,
      orden,
      items,
    } = req.body;

    if (!nombre || precio === undefined || precio === null) {
      return res
        .status(400)
        .json({ error: "El nombre y el precio del combo son obligatorios." });
    }

    const finalSlug = slug
      ? slugify(slug)
      : slugify(nombre) + "-" + Date.now().toString().slice(-4);
    const finalPrecio = Number(precio) || 0;
    const finalPrecioAnterior = Number(precio_anterior) || 0;
    const finalKilos = Number(kilos) || 0;
    const finalPuntos = Number(puntos) || 50;
    const finalActivo = activo !== false;
    const finalOrden = Number(orden) || 0;

    await client.query("BEGIN");

    const insertComboQuery = `
      INSERT INTO combos (
        nombre, slug, descripcion, precio, precio_anterior, kilos, rinde, badge, puntos, activo, orden
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;

    const { rows: comboRows } = await client.query(insertComboQuery, [
      nombre,
      finalSlug,
      descripcion || "",
      finalPrecio,
      finalPrecioAnterior,
      finalKilos,
      rinde || "6 a 8 personas",
      badge || "🔥 Combo Ahorro",
      finalPuntos,
      finalActivo,
      finalOrden,
    ]);

    const nuevoCombo = comboRows[0];

    // Insertar items referenciando catalogo(id)
    if (Array.isArray(items) && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it.catalogo_id) continue;

        const pesoKg = Number(it.peso_kg) || 1.0;
        const cantTexto = it.cantidad_o_peso || `${pesoKg} kg`;

        await client.query(
          `INSERT INTO combo_items (combo_id, catalogo_id, cantidad_o_peso, peso_kg, descripcion_item, orden)
           VALUES ($1, $2, $3, $4, $5, $6);`,
          [
            nuevoCombo.id,
            it.catalogo_id,
            cantTexto,
            pesoKg,
            it.descripcion_item || "",
            i + 1,
          ]
        );
      }
    }

    await client.query("COMMIT");

    res.status(201).json(nuevoCombo);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error al crear combo:", err);
    res
      .status(500)
      .json({ error: "Error al registrar nuevo combo en base de datos." });
  } finally {
    client.release();
  }
};

// PUT /combos/:id
const updateCombo = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      nombre,
      slug,
      descripcion,
      precio,
      precio_anterior,
      kilos,
      rinde,
      badge,
      puntos,
      activo,
      orden,
      items,
    } = req.body;

    if (!nombre || precio === undefined || precio === null) {
      return res
        .status(400)
        .json({ error: "El nombre y el precio del combo son obligatorios." });
    }

    const finalSlug = slug ? slugify(slug) : slugify(nombre);
    const finalPrecio = Number(precio) || 0;
    const finalPrecioAnterior = Number(precio_anterior) || 0;
    const finalKilos = Number(kilos) || 0;
    const finalPuntos = Number(puntos) || 50;
    const finalActivo = activo !== false;
    const finalOrden = Number(orden) || 0;

    await client.query("BEGIN");

    const updateQuery = `
      UPDATE combos SET
        nombre = $1,
        slug = $2,
        descripcion = $3,
        precio = $4,
        precio_anterior = $5,
        kilos = $6,
        rinde = $7,
        badge = $8,
        puntos = $9,
        activo = $10,
        orden = $11,
        actualizado_en = NOW()
      WHERE id = $12
      RETURNING *;
    `;

    const { rows: comboRows } = await client.query(updateQuery, [
      nombre,
      finalSlug,
      descripcion || "",
      finalPrecio,
      finalPrecioAnterior,
      finalKilos,
      rinde || "",
      badge || "",
      finalPuntos,
      finalActivo,
      finalOrden,
      id,
    ]);

    if (comboRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Combo no encontrado." });
    }

    // Si se enviaron items, reemplazar por completo
    if (Array.isArray(items)) {
      await client.query("DELETE FROM combo_items WHERE combo_id = $1;", [id]);

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it.catalogo_id) continue;

        const pesoKg = Number(it.peso_kg) || 1.0;
        const cantTexto = it.cantidad_o_peso || `${pesoKg} kg`;

        await client.query(
          `INSERT INTO combo_items (combo_id, catalogo_id, cantidad_o_peso, peso_kg, descripcion_item, orden)
           VALUES ($1, $2, $3, $4, $5, $6);`,
          [id, it.catalogo_id, cantTexto, pesoKg, it.descripcion_item || "", i + 1]
        );
      }
    }

    await client.query("COMMIT");

    res.json(comboRows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error al actualizar combo:", err);
    res
      .status(500)
      .json({ error: "Error al actualizar combo en base de datos." });
  } finally {
    client.release();
  }
};

// PATCH /combos/:id/estado
const toggleActivoCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    let query;
    let params;

    if (activo !== undefined) {
      query =
        "UPDATE combos SET activo = $1, actualizado_en = NOW() WHERE id = $2 RETURNING *;";
      params = [Boolean(activo), id];
    } else {
      query =
        "UPDATE combos SET activo = NOT activo, actualizado_en = NOW() WHERE id = $1 RETURNING *;";
      params = [id];
    }

    const { rows } = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Combo no encontrado." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error al alternar estado del combo:", err);
    res.status(500).json({ error: "Error al alternar estado del combo." });
  }
};

// DELETE /combos/:id
const deleteCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(
      "DELETE FROM combos WHERE id = $1;",
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "Combo no encontrado." });
    }

    res.json({ message: "Combo eliminado exitosamente." });
  } catch (err) {
    console.error("Error al eliminar combo:", err);
    res.status(500).json({ error: "Error al eliminar combo." });
  }
};

module.exports = {
  getCombos,
  getComboById,
  createCombo,
  updateCombo,
  toggleActivoCombo,
  deleteCombo,
};
