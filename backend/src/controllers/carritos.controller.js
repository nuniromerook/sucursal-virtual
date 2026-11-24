// backend/src/controllers/carritos.controller.js
const pool = require("../db");
const { verifyToken } = require("../utils/auth");

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
          'precio_promocional', p.precio_promocional,
          'activa', p.activa
        ) ORDER BY p.cantidad_kg
      )
      FROM catalogo_promos p
      WHERE p.catalogo_id = c.id AND p.activa = true
    ),
    '[]'::jsonb
  )
`;

/**
 * Extrae clienteId opcional desde el JWT y sesionId desde body/query/header
 */
function resolveIdentity(req) {
  let clienteId = req.user?.id || null;
  if (!clienteId) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const decoded = verifyToken(authHeader.split(" ")[1]);
      if (decoded && decoded.id) {
        clienteId = Number(decoded.id);
      }
    }
  }

  const rawSesion =
    req.body?.sesion_id ||
    req.query?.sesion_id ||
    req.headers["x-sesion-id"] ||
    (clienteId ? `cliente_${clienteId}` : null);

  const sesionId = rawSesion ? String(rawSesion).trim() : null;
  const ua = req.headers["user-agent"] || "";
  const dispositivo =
    req.body?.dispositivo ||
    (/mobile|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop");

  return { clienteId, sesionId, dispositivo };
}

/**
 * Busca o crea el registro de carrito para el dispositivo / cliente
 */
async function findOrCreateCarrito(
  db,
  { clienteId, sesionId, dispositivo, ultimoPaso, motivoAbandono }
) {
  let carritoRow = null;

  if (clienteId && sesionId) {
    const res = await db.query(
      `SELECT * FROM carritos
       WHERE cliente_id = $1 OR sesion_id = $2
       ORDER BY (CASE WHEN cliente_id = $1 THEN 0 ELSE 1 END), actualizado_en DESC
       LIMIT 1`,
      [clienteId, sesionId]
    );
    carritoRow = res.rows[0] || null;
  } else if (clienteId) {
    const res = await db.query(
      `SELECT * FROM carritos WHERE cliente_id = $1 ORDER BY actualizado_en DESC LIMIT 1`,
      [clienteId]
    );
    carritoRow = res.rows[0] || null;
  } else if (sesionId) {
    const res = await db.query(
      `SELECT * FROM carritos WHERE sesion_id = $1 ORDER BY actualizado_en DESC LIMIT 1`,
      [sesionId]
    );
    carritoRow = res.rows[0] || null;
  }

  const effectiveSesionId =
    sesionId || (clienteId ? `cliente_${clienteId}` : `anon_${Date.now()}`);

  if (!carritoRow) {
    const insertRes = await db.query(
      `INSERT INTO carritos (sesion_id, cliente_id, dispositivo, ultimo_paso, motivo_abandono, actualizado_en)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        effectiveSesionId,
        clienteId || null,
        dispositivo || "desktop",
        ultimoPaso || "catalogo",
        motivoAbandono || null,
      ]
    );
    return insertRes.rows[0];
  }

  const updateRes = await db.query(
    `UPDATE carritos
     SET cliente_id = COALESCE($1, cliente_id),
         sesion_id = COALESCE($2, sesion_id),
         dispositivo = COALESCE($3, dispositivo),
         ultimo_paso = COALESCE($4, ultimo_paso),
         motivo_abandono = CASE
           WHEN $5::text IS NOT NULL THEN $5
           WHEN $4::text = 'pedido_completado' THEN NULL
           ELSE motivo_abandono
         END,
         actualizado_en = NOW()
     WHERE id = $6
     RETURNING *`,
    [
      clienteId || null,
      effectiveSesionId,
      dispositivo || null,
      ultimoPaso || null,
      motivoAbandono !== undefined ? motivoAbandono : null,
      carritoRow.id,
    ]
  );

  return updateRes.rows[0];
}

/**
 * POST /carritos/sincronizar
 * Sincroniza el carrito local del dispositivo/cliente con PostgreSQL (`carritos` y `carrito_items`).
 */
const sincronizarCarrito = async (req, res) => {
  const { clienteId, sesionId, dispositivo } = resolveIdentity(req);
  if (!clienteId && !sesionId) {
    return res.status(400).json({ error: "Se requiere sesion_id o cliente autenticado." });
  }

  const localItems = Array.isArray(req.body.items) ? req.body.items : [];
  const replaceMode = Boolean(req.body.replace);
  const ultimoPaso = req.body.ultimo_paso || (localItems.length > 0 ? "carrito_activo" : null);
  const motivoAbandono = req.body.motivo_abandono;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const carrito = await findOrCreateCarrito(client, {
      clienteId,
      sesionId,
      dispositivo,
      ultimoPaso,
      motivoAbandono,
    });
    const carritoId = carrito.id;

    // Leer ítems actuales en DB
    const dbItemsRes = await client.query(
      `SELECT ci.*, c.precio AS precio_actual, c.activo,
              ${PROMOS_SUBQUERY} AS promos_actuales,
              c.nombre_producto, c.slug, c.imagen_url, c.especie,
              c.categoria, c.unidad_medida, c.gana_puntos, c.puntos
       FROM carrito_items ci
       JOIN catalogo c ON c.id = ci.catalogo_id
       WHERE ci.carrito_id = $1
       ORDER BY ci.id ASC`,
      [carritoId]
    );
    const dbItems = dbItemsRes.rows;

    // Construir lista unificada
    const mergedMap = new Map();

    if (!replaceMode) {
      for (const dbItem of dbItems) {
        const cid = Number(dbItem.catalogo_id);
        mergedMap.set(cid, {
          catalogo_id: cid,
          cantidad_kg: Number(dbItem.cantidad_kg),
          precio_al_agregar: Number(dbItem.precio_actual),
          promo_precio_al_agregar: null,
          opciones_corte_seleccionada:
            dbItem.opciones_corte_seleccionada || "Corte tradicional",
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
    }

    for (const localItem of localItems) {
      const rawCid = Number(localItem.catalogo_id || localItem.id);
      const cid = Number.isFinite(rawCid) && rawCid > 0 ? rawCid : 1;
      const cant = Math.max(
        1,
        Number(localItem.cantidad_kg || localItem.cantidad || 1)
      );
      const corte =
        localItem.corte ||
        localItem.opciones_corte_seleccionada ||
        "Corte tradicional";

      if (mergedMap.has(cid)) {
        const existing = mergedMap.get(cid);
        existing.cantidad_kg = replaceMode
          ? existing.cantidad_kg + cant
          : cant;
        existing.opciones_corte_seleccionada = corte;
      } else {
        mergedMap.set(cid, {
          catalogo_id: cid,
          cantidad_kg: cant,
          precio_al_agregar: Number(localItem.precio) || 0,
          promo_precio_al_agregar: null,
          opciones_corte_seleccionada: corte,
          nombre_producto: localItem.nombre || localItem.nombre_producto || "Corte",
          slug: localItem.slug,
          imagen_url: localItem.imagen_url || localItem.imagenUrl,
          especie: localItem.especie,
          categoria: localItem.categoria,
          unidad_medida: localItem.unidad_medida || "kg",
          precio: Number(localItem.precio) || 0,
          gana_puntos: Boolean(localItem.gana_puntos ?? true),
          puntos: Number(localItem.puntos) || 15,
          promos: Array.isArray(localItem.promos) ? localItem.promos : [],
          activo: true,
        });
      }
    }

    // Validar contra catálogo actual
    const idsAValidar = [...mergedMap.keys()];
    const alerts = [];
    const itemsFinales = [];

    if (idsAValidar.length > 0) {
      const catalogoRes = await client.query(
        `SELECT c.id, c.nombre_producto, c.slug, c.imagen_url, c.especie,
                c.categoria, c.unidad_medida, c.precio, c.gana_puntos, c.puntos, c.activo,
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
        if (!catalogo) continue;

        if (!catalogo.activo) {
          alerts.push({
            type: "inactive",
            catalogoId: cid,
            nombre: catalogo.nombre_producto || item.nombre_producto,
          });
          continue;
        }

        const precioActual = Number(catalogo.precio);
        const precioGuardado = Number(item.precio_al_agregar);

        if (
          precioGuardado > 0 &&
          Math.abs(precioActual - precioGuardado) > 0.01
        ) {
          alerts.push({
            type: precioActual > precioGuardado ? "price_up" : "price_down",
            catalogoId: cid,
            nombre: catalogo.nombre_producto,
            precioAnterior: precioGuardado,
            precioNuevo: precioActual,
          });
        }

        const promosActuales = Array.isArray(catalogo.promos)
          ? catalogo.promos
          : [];

        itemsFinales.push({
          ...item,
          nombre_producto: catalogo.nombre_producto,
          slug: catalogo.slug,
          imagen_url: catalogo.imagen_url || item.imagen_url,
          especie: catalogo.especie,
          categoria: catalogo.categoria,
          unidad_medida: catalogo.unidad_medida,
          precio: precioActual,
          precio_al_agregar: precioActual,
          gana_puntos: catalogo.gana_puntos,
          puntos: Number(catalogo.puntos) || 15,
          promos: promosActuales,
        });
      }
    }

    // Reemplazar carrito_items en DB
    await client.query(`DELETE FROM carrito_items WHERE carrito_id = $1`, [
      carritoId,
    ]);

    for (const item of itemsFinales) {
      await client.query(
        `INSERT INTO carrito_items
           (carrito_id, catalogo_id, cantidad_kg, precio_al_agregar, promo_precio_al_agregar, opciones_corte_seleccionada)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          carritoId,
          item.catalogo_id,
          item.cantidad_kg,
          item.precio_al_agregar,
          item.promo_precio_al_agregar || null,
          item.opciones_corte_seleccionada || "Corte tradicional",
        ]
      );
    }

    await client.query("COMMIT");

    const itemsResponse = itemsFinales.map((item) => ({
      id: item.catalogo_id,
      catalogo_id: item.catalogo_id,
      nombre: item.nombre_producto,
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
      cantidad: item.cantidad_kg,
      corte: item.opciones_corte_seleccionada || "Corte tradicional",
    }));

    res.json({
      carritoId,
      sesion_id: carrito.sesion_id,
      ultimo_paso: carrito.ultimo_paso,
      items: itemsResponse,
      alerts,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error sincronizarCarrito:", error.message);
    res.status(500).json({
      error: "Error al sincronizar el carrito",
      detalle: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * POST /carritos/paso
 * Registra el paso del embudo de compra en el que se encuentra el visitante o motivo de abandono.
 */
const registrarPasoCarrito = async (req, res) => {
  const { clienteId, sesionId, dispositivo } = resolveIdentity(req);
  if (!clienteId && !sesionId) {
    return res.status(400).json({ error: "Se requiere sesion_id o cliente_id." });
  }

  const ultimoPaso = req.body.ultimo_paso || "catalogo";
  const motivoAbandono =
    req.body.motivo_abandono !== undefined ? req.body.motivo_abandono : undefined;

  try {
    const carrito = await findOrCreateCarrito(pool, {
      clienteId,
      sesionId,
      dispositivo,
      ultimoPaso,
      motivoAbandono,
    });

    res.json({
      ok: true,
      carritoId: carrito.id,
      ultimo_paso: carrito.ultimo_paso,
      motivo_abandono: carrito.motivo_abandono,
    });
  } catch (error) {
    console.error("Error registrarPasoCarrito:", error.message);
    res.status(500).json({ error: "Error al registrar paso del carrito" });
  }
};

/**
 * GET /carritos/mi-carrito
 * Recupera el carrito activo del dispositivo o cliente con datos frescos del catálogo.
 */
const getCarrito = async (req, res) => {
  const { clienteId, sesionId } = resolveIdentity(req);
  if (!clienteId && !sesionId) {
    return res.json({ items: [] });
  }

  try {
    let carritoRes;
    if (clienteId && sesionId) {
      carritoRes = await pool.query(
        `SELECT * FROM carritos
         WHERE cliente_id = $1 OR sesion_id = $2
         ORDER BY (CASE WHEN cliente_id = $1 THEN 0 ELSE 1 END), actualizado_en DESC
         LIMIT 1`,
        [clienteId, sesionId]
      );
    } else if (clienteId) {
      carritoRes = await pool.query(
        `SELECT * FROM carritos WHERE cliente_id = $1 ORDER BY actualizado_en DESC LIMIT 1`,
        [clienteId]
      );
    } else {
      carritoRes = await pool.query(
        `SELECT * FROM carritos WHERE sesion_id = $1 ORDER BY actualizado_en DESC LIMIT 1`,
        [sesionId]
      );
    }

    if (carritoRes.rows.length === 0) {
      return res.json({ items: [] });
    }

    const carrito = carritoRes.rows[0];
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
         ci.opciones_corte_seleccionada,
         ${PROMOS_SUBQUERY} AS promos
       FROM carrito_items ci
       JOIN catalogo c ON c.id = ci.catalogo_id
       WHERE ci.carrito_id = $1 AND c.activo = true
       ORDER BY ci.creado_en`,
      [carrito.id]
    );

    const items = itemsRes.rows.map((row) => ({
      id: Number(row.id),
      catalogo_id: Number(row.id),
      nombre: row.nombre_producto,
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
      cantidad: Number(row.cantidad_kg),
      corte: row.opciones_corte_seleccionada || "Corte tradicional",
      promos: Array.isArray(row.promos) ? row.promos : [],
    }));

    res.json({
      carritoId: carrito.id,
      ultimo_paso: carrito.ultimo_paso,
      motivo_abandono: carrito.motivo_abandono,
      items,
    });
  } catch (error) {
    console.error("Error al obtener el carrito:", error.message);
    res.status(500).json({ error: "Error al obtener el carrito" });
  }
};

/**
 * GET /carritos/activos
 * Lista los carritos en la nube y su estado en el embudo de conversión.
 */
const getCarritosActivos = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         ca.id,
         ca.sesion_id,
         ca.cliente_id,
         cl.nombre AS cliente_nombre,
         cl.telefono AS cliente_telefono,
         ca.dispositivo,
         ca.ultimo_paso,
         ca.motivo_abandono,
         ca.creado_en,
         ca.actualizado_en,
         COALESCE(
           (
             SELECT jsonb_agg(
               jsonb_build_object(
                 'id', ci.id,
                 'catalogo_id', ci.catalogo_id,
                 'nombre_producto', cat.nombre_producto,
                 'cantidad_kg', ci.cantidad_kg,
                 'precio_al_agregar', ci.precio_al_agregar,
                 'corte', ci.opciones_corte_seleccionada
               )
             )
             FROM carrito_items ci
             JOIN catalogo cat ON cat.id = ci.catalogo_id
             WHERE ci.carrito_id = ca.id
           ),
           '[]'::jsonb
         ) AS items
       FROM carritos ca
       LEFT JOIN clientes cl ON cl.id = ca.cliente_id
       ORDER BY ca.actualizado_en DESC
       LIMIT 100`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error getCarritosActivos:", error.message);
    res.status(500).json({ error: "Error al obtener carritos activos" });
  }
};

/**
 * PATCH /carritos/mi-carrito/item/:catalogoId
 */
const updateItemCarrito = async (req, res) => {
  const { clienteId, sesionId, dispositivo } = resolveIdentity(req);
  const catalogoId = Number(req.params.catalogoId);
  const cantidad_kg = Number(req.body.cantidad_kg);
  const corte =
    req.body.corte || req.body.opciones_corte_seleccionada || "Corte tradicional";

  if (!clienteId && !sesionId) {
    return res.status(400).json({ error: "Se requiere sesion_id o cliente_id." });
  }

  try {
    const carrito = await findOrCreateCarrito(pool, {
      clienteId,
      sesionId,
      dispositivo,
    });
    const carritoId = carrito.id;

    if (cantidad_kg <= 0) {
      await pool.query(
        `DELETE FROM carrito_items WHERE carrito_id = $1 AND catalogo_id = $2`,
        [carritoId, catalogoId]
      );
    } else {
      await pool.query(
        `INSERT INTO carrito_items (carrito_id, catalogo_id, cantidad_kg, precio_al_agregar, opciones_corte_seleccionada)
         SELECT $1, $2, $3, c.precio, $4 FROM catalogo c WHERE c.id = $2
         ON CONFLICT (carrito_id, catalogo_id)
         DO UPDATE SET cantidad_kg = $3, opciones_corte_seleccionada = $4, actualizado_en = now()`,
        [carritoId, catalogoId, cantidad_kg, corte]
      );
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("Error updateItemCarrito:", error.message);
    res.status(500).json({ error: "Error al actualizar el ítem", detalle: error.message });
  }
};

/**
 * DELETE /carritos/mi-carrito
 */
const clearCarritoDB = async (req, res) => {
  const { clienteId, sesionId } = resolveIdentity(req);

  try {
    if (clienteId || sesionId) {
      const carritoRes = await pool.query(
        `SELECT id FROM carritos
         WHERE ($1::int IS NOT NULL AND cliente_id = $1)
            OR ($2::text IS NOT NULL AND sesion_id = $2)
         ORDER BY actualizado_en DESC LIMIT 1`,
        [clienteId || null, sesionId || null]
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
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("Error al vaciar el carrito:", error.message);
    res.status(500).json({ error: "Error al vaciar el carrito" });
  }
};

module.exports = {
  sincronizarCarrito,
  registrarPasoCarrito,
  getCarrito,
  getCarritosActivos,
  updateItemCarrito,
  clearCarritoDB,
};
