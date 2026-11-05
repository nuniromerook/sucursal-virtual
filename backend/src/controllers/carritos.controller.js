// backend/src/controllers/carritos.controller.js
const pool = require("../db");

/**
 * Subquery reutilizable: promos activas del producto
 */
const PROMOS_SUBQUERY = `
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
  )
`;

/**
 * POST /carritos/sincronizar
 * ─────────────────────────
 * Sube el carrito local del cliente autenticado a la DB,
 * valida cada ítem contra el catálogo actual (precio, stock, promos)
 * y devuelve el carrito unificado junto con las alertas detectadas.
 *
 * Regla de fusión (local tiene prioridad en cantidad):
 *   - Si el ítem existe en DB y en local → usa cantidad del local.
 *   - Si el ítem solo está en DB → se incluye con su cantidad de DB.
 *   - Si el ítem solo está en local → se agrega a DB.
 *   - Ítems del producto inactivo → se eliminan de DB y se notifica.
 */
const sincronizarCarrito = async (req, res) => {
  const clienteId = req.user.id;
  const localItems = Array.isArray(req.body.items) ? req.body.items : [];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ── 1. Obtener o crear el carrito del cliente ─────────────────────────
    let carritoRes = await client.query(
      `SELECT id FROM carritos WHERE cliente_id = $1 ORDER BY creado_en DESC LIMIT 1`,
      [clienteId]
    );

    let carritoId;
    if (carritoRes.rows.length === 0) {
      const nuevoCarrito = await client.query(
        `INSERT INTO carritos (sesion_id, cliente_id) VALUES ($1, $2) RETURNING id`,
        [`cliente_${clienteId}`, clienteId]
      );
      carritoId = nuevoCarrito.rows[0].id;
    } else {
      carritoId = carritoRes.rows[0].id;
    }

    // ── 2. Leer ítems actuales en DB ──────────────────────────────────────
    const dbItemsRes = await client.query(
      `SELECT ci.*, c.precio AS precio_actual, c.activo,
              ${PROMOS_SUBQUERY} AS promos_actuales,
              c.nombre_producto, c.slug, c.imagen_url, c.especie,
              c.categoria, c.unidad_medida, c.gana_puntos, c.puntos
       FROM carrito_items ci
       JOIN catalogo c ON c.id = ci.catalogo_id
       WHERE ci.carrito_id = $1`,
      [carritoId]
    );
    const dbItems = dbItemsRes.rows;

    // ── 3. Construir mapa de ítems locales (catalogoId → item) ────────────
    const localMap = new Map(
      localItems.map((item) => [Number(item.id), item])
    );

    // ── 4. Fusionar: local + DB, local tiene prioridad en cantidad ─────────
    const mergedMap = new Map();

    // Primero: todos los de DB
    for (const dbItem of dbItems) {
      mergedMap.set(Number(dbItem.catalogo_id), {
        catalogo_id: Number(dbItem.catalogo_id),
        cantidad_kg: Number(dbItem.cantidad_kg),
        precio_al_agregar: Number(dbItem.precio_actual), // se actualizará
        promo_precio_al_agregar: null,
        // datos de catálogo frescos
        nombre_producto: dbItem.nombre_producto,
        slug: dbItem.slug,
        imagen_url: dbItem.imagen_url,
        especie: dbItem.especie,
        categoria: dbItem.categoria,
        unidad_medida: dbItem.unidad_medida,
        precio: Number(dbItem.precio_actual),
        gana_puntos: dbItem.gana_puntos,
        puntos: Number(dbItem.puntos),
        promos: dbItem.promos_actuales,
        activo: dbItem.activo,
      });
    }

    // Luego: merge con local (prioridad de cantidad al local)
    for (const localItem of localItems) {
      const cid = Number(localItem.id);
      if (mergedMap.has(cid)) {
        mergedMap.get(cid).cantidad_kg = Number(localItem.cantidad_kg);
      } else {
        mergedMap.set(cid, {
          catalogo_id: cid,
          cantidad_kg: Number(localItem.cantidad_kg),
          precio_al_agregar: Number(localItem.precio),
          promo_precio_al_agregar: null,
          nombre_producto: localItem.nombre_producto,
          slug: localItem.slug,
          imagen_url: localItem.imagen_url,
          especie: localItem.especie,
          categoria: localItem.categoria,
          unidad_medida: localItem.unidad_medida || "kg",
          precio: Number(localItem.precio),
          gana_puntos: Boolean(localItem.gana_puntos),
          puntos: Number(localItem.puntos) || 0,
          promos: Array.isArray(localItem.promos) ? localItem.promos : [],
          activo: true, // se validará en el paso 5
        });
      }
    }

    // ── 5. Validar contra catálogo actual ─────────────────────────────────
    const idsAValidar = [...mergedMap.keys()];
    const alerts = [];
    const itemsFinales = [];

    if (idsAValidar.length > 0) {
      const catalogoRes = await client.query(
        `SELECT c.id, c.nombre_producto, c.precio, c.activo,
                ${PROMOS_SUBQUERY} AS promos
         FROM catalogo c
         WHERE c.id = ANY($1::int[])`,
        [idsAValidar]
      );

      const catalogoMap = new Map(
        catalogoRes.rows.map((row) => [Number(row.id), row])
      );

      for (const [cid, item] of mergedMap.entries()) {
        const catalogo = catalogoMap.get(cid);

        // Producto no existe en catálogo → skip silencioso
        if (!catalogo) continue;

        // Producto inactivo → remover y alertar
        if (!catalogo.activo) {
          alerts.push({
            type: "inactive",
            catalogoId: cid,
            nombre: item.nombre_producto,
          });
          // Eliminamos de DB si estaba
          await client.query(
            `DELETE FROM carrito_items WHERE carrito_id = $1 AND catalogo_id = $2`,
            [carritoId, cid]
          );
          continue;
        }

        const precioActual = Number(catalogo.precio);
        const precioGuardado = Number(item.precio_al_agregar);

        // Precio cambió
        if (
          precioGuardado > 0 &&
          Math.abs(precioActual - precioGuardado) > 0.01
        ) {
          alerts.push({
            type: precioActual > precioGuardado ? "price_up" : "price_down",
            catalogoId: cid,
            nombre: item.nombre_producto,
            precioAnterior: precioGuardado,
            precioNuevo: precioActual,
          });
        }

        // Verificar si la promo que tenía sigue activa
        const promosActuales = Array.isArray(catalogo.promos)
          ? catalogo.promos
          : [];
        const teníaPromo =
          item.promo_precio_al_agregar !== null &&
          item.promo_precio_al_agregar !== undefined;
        if (teníaPromo && promosActuales.length === 0) {
          alerts.push({
            type: "promo_expired",
            catalogoId: cid,
            nombre: item.nombre_producto,
          });
        }

        // Ítem validado y actualizado con datos frescos
        const itemFinal = {
          ...item,
          precio: precioActual,
          precio_al_agregar: precioActual,
          promos: promosActuales,
        };
        itemsFinales.push(itemFinal);
      }
    }

    // ── 6. UPSERT de carrito_items en DB ──────────────────────────────────
    // Primero limpiamos el carrito
    await client.query(`DELETE FROM carrito_items WHERE carrito_id = $1`, [
      carritoId,
    ]);

    for (const item of itemsFinales) {
      await client.query(
        `INSERT INTO carrito_items
           (carrito_id, catalogo_id, cantidad_kg, precio_al_agregar, promo_precio_al_agregar)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          carritoId,
          item.catalogo_id,
          item.cantidad_kg,
          item.precio_al_agregar,
          item.promo_precio_al_agregar || null,
        ]
      );
    }

    // Actualizar timestamp del carrito
    await client.query(
      `UPDATE carritos SET actualizado_en = now() WHERE id = $1`,
      [carritoId]
    );

    await client.query("COMMIT");

    // ── 7. Normalizar la respuesta al formato que espera CartContext ───────
    const itemsResponse = itemsFinales.map((item) => ({
      id: item.catalogo_id,
      nombre_producto: item.nombre_producto,
      slug: item.slug,
      imagen_url: item.imagen_url,
      especie: item.especie,
      categoria: item.categoria,
      unidad_medida: item.unidad_medida,
      precio: item.precio,
      promos: item.promos,
      gana_puntos: item.gana_puntos,
      puntos: item.puntos,
      cantidad_kg: item.cantidad_kg,
    }));

    res.json({
      carritoId,
      items: itemsResponse,
      alerts,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("╔══ ERROR sincronizarCarrito ══════════════════════");
    console.error("║ message:", error.message);
    console.error("║ code   :", error.code);
    console.error("║ detail :", error.detail);
    console.error("║ hint   :", error.hint);
    console.error("╚══════════════════════════════════════════════════");
    res.status(500).json({
      error: "Error al sincronizar el carrito",
      detalle: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * GET /carritos/mi-carrito
 * Recupera el carrito activo del cliente con datos frescos del catálogo.
 */
const getCarrito = async (req, res) => {
  const clienteId = req.user.id;

  try {
    const carritoRes = await pool.query(
      `SELECT id FROM carritos WHERE cliente_id = $1 ORDER BY creado_en DESC LIMIT 1`,
      [clienteId]
    );

    if (carritoRes.rows.length === 0) {
      return res.json({ items: [] });
    }

    const carritoId = carritoRes.rows[0].id;

    const itemsRes = await pool.query(
      `SELECT
         c.id,
         c.nombre_producto,
         c.slug,
         c.imagen_url,
         c.especie,
         c.categoria,
         c.unidad_medida,
         c.precio,
         c.gana_puntos,
         c.puntos,
         ci.cantidad_kg,
         ${PROMOS_SUBQUERY} AS promos
       FROM carrito_items ci
       JOIN catalogo c ON c.id = ci.catalogo_id
       WHERE ci.carrito_id = $1 AND c.activo = true
       ORDER BY ci.creado_en`,
      [carritoId]
    );

    const items = itemsRes.rows.map((row) => ({
      id: Number(row.id),
      nombre_producto: row.nombre_producto,
      slug: row.slug,
      imagen_url: row.imagen_url,
      especie: row.especie,
      categoria: row.categoria,
      unidad_medida: row.unidad_medida,
      precio: Number(row.precio),
      gana_puntos: row.gana_puntos,
      puntos: Number(row.puntos),
      cantidad_kg: Number(row.cantidad_kg),
      promos: Array.isArray(row.promos) ? row.promos : [],
    }));

    res.json({ items });
  } catch (error) {
    console.error("Error al obtener el carrito:", error.message);
    res.status(500).json({ error: "Error al obtener el carrito" });
  }
};

/**
 * PATCH /carritos/mi-carrito/item/:catalogoId
 * Actualiza la cantidad de un ítem en DB (sincronización en background).
 * Si cantidad = 0, elimina el ítem.
 * FIX: crea el carrito si no existe (evita 404 por race condition con sincronizarCarrito).
 */
const updateItemCarrito = async (req, res) => {
  const clienteId = req.user.id;
  const catalogoId = Number(req.params.catalogoId);
  const cantidad_kg = Number(req.body.cantidad_kg);

  try {
    // Buscar o crear el carrito del cliente
    let carritoRes = await pool.query(
      `SELECT id FROM carritos WHERE cliente_id = $1 ORDER BY creado_en DESC LIMIT 1`,
      [clienteId]
    );

    let carritoId;
    if (carritoRes.rows.length === 0) {
      // Carrito no existe todavía (race condition con sincronizarCarrito) → crearlo
      const nuevoCarrito = await pool.query(
        `INSERT INTO carritos (sesion_id, cliente_id) VALUES ($1, $2) RETURNING id`,
        [`cliente_${clienteId}`, clienteId]
      );
      carritoId = nuevoCarrito.rows[0].id;
    } else {
      carritoId = carritoRes.rows[0].id;
    }

    if (cantidad_kg <= 0) {
      await pool.query(
        `DELETE FROM carrito_items WHERE carrito_id = $1 AND catalogo_id = $2`,
        [carritoId, catalogoId]
      );
    } else {
      await pool.query(
        `INSERT INTO carrito_items (carrito_id, catalogo_id, cantidad_kg, precio_al_agregar)
         SELECT $1, $2, $3, c.precio FROM catalogo c WHERE c.id = $2
         ON CONFLICT (carrito_id, catalogo_id)
         DO UPDATE SET cantidad_kg = $3, actualizado_en = now()`,
        [carritoId, catalogoId, cantidad_kg]
      );
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("╔══ ERROR updateItemCarrito ═══════════════════════");
    console.error("║ message:", error.message);
    console.error("║ code   :", error.code);
    console.error("║ detail :", error.detail);
    console.error("╚══════════════════════════════════════════════════");
    res.status(500).json({ error: "Error al actualizar el ítem", detalle: error.message });
  }
};

/**
 * DELETE /carritos/mi-carrito
 * Vacía el carrito del cliente en DB (al cerrar sesión / clear cart).
 */
const clearCarritoDB = async (req, res) => {
  const clienteId = req.user.id;

  try {
    const carritoRes = await pool.query(
      `SELECT id FROM carritos WHERE cliente_id = $1 ORDER BY creado_en DESC LIMIT 1`,
      [clienteId]
    );

    if (carritoRes.rows.length > 0) {
      const carritoId = carritoRes.rows[0].id;
      await pool.query(`DELETE FROM carrito_items WHERE carrito_id = $1`, [
        carritoId,
      ]);
      await pool.query(
        `UPDATE carritos SET actualizado_en = now() WHERE id = $1`,
        [carritoId]
      );
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("Error al vaciar el carrito:", error.message);
    res.status(500).json({ error: "Error al vaciar el carrito" });
  }
};

module.exports = {
  sincronizarCarrito,
  getCarrito,
  updateItemCarrito,
  clearCarritoDB,
};
