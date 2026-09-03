// backend/src/controllers/catalogo.controller.js
const pool = require("../db");
const { emitirCambioCatalogo } = require("../socket");

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
const getCatalogo = async (req, res) => {
  const { activo, destacar, categoria, especie, q, sucursal_id } = req.query;

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

  if (categoria) {
    valores.push(`%${categoria.trim().toLowerCase()}%`);
    condiciones.push(`LOWER(c.categoria) LIKE $${valores.length}`);
  }

  if (especie) {
    valores.push(`%${especie.trim().toLowerCase()}%`);
    condiciones.push(`LOWER(c.especie) LIKE $${valores.length}`);
  }

  let orderClause = "ORDER BY c.nombre_producto ASC";

  if (q) {
    const rawQ = q.trim().toLowerCase();
    const tokens = rawQ.split(/\s+/).filter(Boolean);

    tokens.forEach((token) => {
      valores.push(`%${token}%`);
      condiciones.push(`(
        LOWER(c.nombre_producto) LIKE $${valores.length} 
        OR LOWER(COALESCE(c.descripcion, '')) LIKE $${valores.length} 
        OR LOWER(COALESCE(c.especie, '')) LIKE $${valores.length} 
        OR LOWER(COALESCE(c.categoria, '')) LIKE $${valores.length}
      )`);
    });

    valores.push(`%${rawQ}%`);
    const qParamIndex = valores.length;
    orderClause = `ORDER BY 
      CASE 
        WHEN LOWER(c.nombre_producto) LIKE $${qParamIndex} THEN 1
        WHEN LOWER(COALESCE(c.descripcion, '')) LIKE $${qParamIndex} THEN 2
        ELSE 3
      END,
      c.nombre_producto ASC`;
  }

  const whereClause = condiciones.length
    ? `WHERE ${condiciones.join(" AND ")}`
    : "";

  try {
    const query = `SELECT c.*, 
              ${PROMOS_ACTIVAS_SUBQUERY},
              COALESCE((SELECT COUNT(*)::int FROM cliente_favoritos f WHERE f.catalogo_id = c.id), 0) AS total_favoritos,
              NOT c.sin_stock AS en_stock
       FROM catalogo c
       ${whereClause}
       ${orderClause}`;

    const result = await pool.query(query, valores);

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener el catálogo:", error.message);
    res.status(500).json({ error: "Error al obtener el catálogo", detalle: error.message });
  }
};

// GET /catalogo/:id
const getCatalogoItem = async (req, res) => {
  const { id } = req.params;
  const incluirInactivas = req.query.incluir_promos_inactivas === "true";
  const sucursal_id = req.query.sucursal_id;

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
    const query = `SELECT c.*, ${promosSubquery},
                    NOT c.sin_stock AS en_stock
             FROM catalogo c
             WHERE c.id::text = $1 OR c.slug = $1`;
    const valores = [id];

    const result = await pool.query(query, valores);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener el producto:", error.message);
    res.status(500).json({ error: "Error al obtener el producto", detalle: error.message });
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
    sin_stock,
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
         precio, precio_anterior, activo, destacar, gana_puntos, puntos, sin_stock
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
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
        sin_stock ?? false,
      ],
    );

    res.status(201).json(result.rows[0]);
    emitirCambioCatalogo({ tipo: "create", producto: result.rows[0] });
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
    sin_stock,
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
         sin_stock = $17,
         actualizado_en = now()
       WHERE id = $18
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
        sin_stock ?? false,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
    emitirCambioCatalogo({ tipo: "update", producto: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "Ya existe un producto con ese slug" });
    }

    console.error("Error al actualizar el producto:", error.message);
    res.status(500).json({ error: "Error al actualizar el producto", detalle: error.message });
  }
};

// PATCH /catalogo/:id/estado
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
    emitirCambioCatalogo({ tipo: "toggle_activo", producto: result.rows[0] });
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
    emitirCambioCatalogo({ tipo: "delete", id });
  } catch (error) {
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
const createPromo = async (req, res) => {
  const { id } = req.params;
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
    emitirCambioCatalogo({ tipo: "promo", productoId: id });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Ya existe una promo para esa cantidad en este producto",
      });
    }

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
       SET cantidad_kg = COALESCE($1, cantidad_kg),
           precio_promocional = COALESCE($2, precio_promocional),
           activa = COALESCE($3, activa)
       WHERE id = $4 AND catalogo_id = $5
       RETURNING *`,
      [cantidad_kg, precio_promocional, activa, promoId, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Promo no encontrada" });
    }

    res.json(result.rows[0]);
    emitirCambioCatalogo({ tipo: "promo", productoId: id });
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
    emitirCambioCatalogo({ tipo: "promo", productoId: id });
  } catch (error) {
    console.error("Error al eliminar la promo:", error.message);
    res.status(500).json({ error: "Error al eliminar la promo" });
  }
};

// POST /catalogo/:id/favorito
const toggleFavorito = async (req, res) => {
  const { id } = req.params;
  const { cliente_id } = req.body;

  if (!cliente_id) {
    return res.status(400).json({ error: "cliente_id es requerido para guardar en la cuenta" });
  }

  try {
    const existe = await pool.query(
      `SELECT id FROM cliente_favoritos WHERE cliente_id = $1 AND catalogo_id = $2`,
      [cliente_id, id]
    );

    if (existe.rows.length > 0) {
      await pool.query(
        `DELETE FROM cliente_favoritos WHERE cliente_id = $1 AND catalogo_id = $2`,
        [cliente_id, id]
      );
      return res.json({ isFavorite: false, message: "Eliminado de favoritos" });
    } else {
      await pool.query(
        `INSERT INTO cliente_favoritos (cliente_id, catalogo_id) VALUES ($1, $2)`,
        [cliente_id, id]
      );
      return res.json({ isFavorite: true, message: "Guardado en favoritos" });
    }
  } catch (error) {
    console.error("Error al alternar favorito:", error.message);
    res.status(500).json({ error: "Error al actualizar favorito" });
  }
};

// GET /catalogo/favoritos/ranking
const getFavoritosRanking = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         c.id,
         c.nombre_producto,
         c.especie,
         c.precio,
         c.imagen_url,
         COUNT(f.id) AS total_favoritos
       FROM catalogo c
       JOIN cliente_favoritos f ON c.id = f.catalogo_id
       GROUP BY c.id, c.nombre_producto, c.especie, c.precio, c.imagen_url
       ORDER BY total_favoritos DESC
       LIMIT 6`
    );

    res.json(result.rows.map((r) => ({ ...r, total_favoritos: Number(r.total_favoritos) })));
  } catch (error) {
    console.error("Error al obtener ranking de favoritos:", error.message);
    res.status(500).json({ error: "Error al obtener ranking de favoritos" });
  }
};

// GET /catalogo/favoritos/cliente/:clienteId
const getFavoritosCliente = async (req, res) => {
  const { clienteId } = req.params;
  try {
    const result = await pool.query(
      `SELECT catalogo_id FROM cliente_favoritos WHERE cliente_id = $1`,
      [clienteId]
    );
    const ids = result.rows.map((r) => r.catalogo_id);
    res.json({ favoritos: ids });
  } catch (error) {
    console.error("Error al obtener favoritos del cliente:", error.message);
    res.status(500).json({ error: "Error al obtener favoritos" });
  }
};

// POST /catalogo/favoritos/sincronizar
const sincronizarFavoritos = async (req, res) => {
  const { cliente_id, ids = [] } = req.body;
  if (!cliente_id) {
    return res.status(400).json({ error: "cliente_id es requerido" });
  }

  try {
    if (Array.isArray(ids) && ids.length > 0) {
      for (const catId of ids) {
        await pool.query(
          `INSERT INTO cliente_favoritos (cliente_id, catalogo_id) 
           VALUES ($1, $2) 
           ON CONFLICT (cliente_id, catalogo_id) DO NOTHING`,
          [cliente_id, catId]
        );
      }
    }

    const result = await pool.query(
      `SELECT catalogo_id FROM cliente_favoritos WHERE cliente_id = $1`,
      [cliente_id]
    );
    const favs = result.rows.map((r) => r.catalogo_id);
    res.json({ success: true, favoritos: favs });
  } catch (error) {
    console.error("Error al sincronizar favoritos:", error.message);
    res.status(500).json({ error: "Error al sincronizar favoritos" });
  }
};

// POST /catalogo/generar-ficha-ia
const generarFichaIA = async (req, res) => {
  try {
    const { nombre_producto, especie_sugerida, unidad_sugerida } = req.body;
    if (!nombre_producto || !nombre_producto.trim()) {
      return res.status(400).json({ error: "El nombre del producto es obligatorio." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "No se encuentra configurada GEMINI_API_KEY en el servidor.",
      });
    }

    const prompt = `
Sos el maestro carnicero de "Abastecedora Valette", una carnicería tradicional de barrio y distribuidora de carnes en Luis Guillón (Zona Sur de Buenos Aires).
Hablas con la calidez, cercanía y conocimiento de un carnicero de confianza argentino: entusiasta pero con los pies en la tierra, sin frases pomposas ni lenguaje artificial de marketing.

Generá la ficha técnica y gastronómica para el producto: "${nombre_producto.trim()}".
${especie_sugerida ? `Especie sugerida: ${especie_sugerida}.` : ""}
${unidad_sugerida ? `Unidad sugerida: ${unidad_sugerida}.` : ""}

Debes responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
{
  "slug": "slug-limpio-en-kebab-case",
  "especie": "vacuno" | "cerdo" | "pollo" | "general",
  "categoria": "vacuno" | "cerdo" | "pollo" | "preparados" | "almacen",
  "unidad_medida": "kg" | "u",
  "proteinas": 20.5,
  "calorias": 220,
  "grasas": 15.2,
  "descripcion": "texto_markdown"
}

Reglas estrictas para el tono y estilo:
- Habla en tono cotidiano, argentino y apetitoso. Que se sienta como el carnicero recomendándole a un vecino cómo cocinarlo.
- PROHIBIDO usar frases trilladas o grandilocuentes como: "terneza excepcional", "joya de las pampas", "perfil de sabor inigualable", "experiencia gourmet", "obra de arte", "deleitar los paladares".
- Resalta en negrita 2 o 3 palabras claves naturales (ej: **bien tierno**, **grasa justa**, **sabor auténtico**, **muy rendidor**).

Estructura estricta del campo "descripcion" (en este orden exacto):

[Párrafo de 2 a 3 oraciones cotidianas y tentadoras describiendo el corte, cómo viene, su textura y por qué conviene llevarlo.]

> 🔥 **Ideal para:** [Recomendaciones prácticas y concretas de cocción, tipo de fuego o método para este corte]
> ❄️ **Conservación:** Mantener refrigerado entre 0° y 4°C para consumir dentro de las 72hs o congelar inmediatamente a -18°C.

## Información de compra:
- **Formas de pago**: Aceptamos efectivo y transferencia bancaria retirando en sucursal, también tarjetas de débito y billeteras virtuales comprando online y con envío.
- **Envíos a domicilio**: Llevamos tu pedido refrigerado a todo Luis Guillón y alrededores (Zona Sur) para garantizar la frescura de la carne.
- **Retiro en sucursal**: Podés retirar tu compra **sin cargo** directamente en nuestro local.

Valores nutricionales:
- Proteínas (g), calorías (kcal) y grasas (g) deben ser números aproximados basados en tablas nutricionales reales de carnes argentinas (cada 100g de producto crudo).
`;

    const modelos = ["gemini-3.1-flash-lite", "gemini-flash-lite-latest", "gemini-flash-latest"];
    let respuestaJSON = null;
    let ultimoError = null;

    for (const model of modelos) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
          signal: AbortSignal.timeout(12000),
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          const rawText = data.candidates[0].content.parts[0].text.trim();
          respuestaJSON = JSON.parse(rawText);
          break;
        } else {
          ultimoError = data.error?.message || "No hubo respuesta válida";
        }
      } catch (err) {
        ultimoError = err.message;
      }
    }

    if (!respuestaJSON) {
      return res.status(502).json({
        error: `No se pudo generar la ficha con IA: ${ultimoError || "Servicio temporalmente no disponible."}`,
      });
    }

    return res.json({ success: true, data: respuestaJSON });
  } catch (error) {
    console.error("Error en generarFichaIA:", error);
    return res.status(500).json({ error: "Error interno al procesar la solicitud con IA." });
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
  toggleFavorito,
  getFavoritosRanking,
  getFavoritosCliente,
  sincronizarFavoritos,
  generarFichaIA,
};
