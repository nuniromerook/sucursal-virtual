// backend/src/controllers/pedidos.controller.js
const pool = require("../db");
const { estimateShipping } = require("../services/pedidosya.service");

/**
 * POST /pedidos
 * Crea un nuevo pedido con transacción atómica en PostgreSQL
 */
const createPedido = async (req, res) => {
  const {
    cliente,
    sucursal_id,
    tipo_entrega,
    fecha_entrega_programada,
    medio_pago,
    direccion_entrega,
    notas,
    items,
    monto_total_estimado,
  } = req.body;

  if (!cliente || !cliente.nombre || !cliente.telefono) {
    return res.status(400).json({
      error: "Nombre y teléfono del cliente son requeridos.",
    });
  }

  if (!sucursal_id) {
    return res.status(400).json({
      error: "Debe seleccionar una sucursal para el pedido.",
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: "El pedido debe contener al menos un producto.",
    });
  }

  const dbClient = await pool.connect();

  try {
    await dbClient.query("BEGIN");

    // 1. Buscar o registrar al cliente
    const clienteExistente = await dbClient.query(
      `SELECT * FROM clientes WHERE telefono = $1 OR (email IS NOT NULL AND email = $2) LIMIT 1`,
      [cliente.telefono.trim(), cliente.email ? cliente.email.trim().toLowerCase() : ""]
    );

    let clienteId;

    if (clienteExistente.rows.length > 0) {
      clienteId = clienteExistente.rows[0].id;
      // Actualizar datos de contacto si cambiaron
      await dbClient.query(
        `UPDATE clientes 
         SET nombre = $1,
             email = COALESCE($2, email),
             direccion_default = COALESCE($3, direccion_default),
             actualizado_en = NOW()
         WHERE id = $4`,
        [
          cliente.nombre.trim(),
          cliente.email ? cliente.email.trim().toLowerCase() : null,
          direccion_entrega || null,
          clienteId,
        ]
      );
    } else {
      const nuevoCliente = await dbClient.query(
        `INSERT INTO clientes (nombre, telefono, email, direccion_default)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          cliente.nombre.trim(),
          cliente.telefono.trim(),
          cliente.email ? cliente.email.trim().toLowerCase() : null,
          direccion_entrega || null,
        ]
      );
      clienteId = nuevoCliente.rows[0].id;
    }

    // 2. Insertar el Pedido maestro
    const insertPedidoRes = await dbClient.query(
      `INSERT INTO pedidos (
         cliente_id,
         sucursal_id,
         canal,
         tipo_entrega,
         fecha_entrega_programada,
         estado_local,
         medio_pago,
         pago_confirmado,
         monto_total_estimado,
         direccion_entrega,
         notas
       ) VALUES ($1, $2, 'web', $3, $4, 'solicitado', $5, false, $6, $7, $8)
       RETURNING *`,
      [
        clienteId,
        Number(sucursal_id),
        tipo_entrega || "retiro_sucursal",
        fecha_entrega_programada || null,
        medio_pago || "efectivo",
        Number(monto_total_estimado) || 0,
        direccion_entrega || null,
        notas || null,
      ]
    );

    const pedidoCreado = insertPedidoRes.rows[0];

    // 3. Insertar cada item del pedido
    for (const item of items) {
      const catalogoId = Number(item.catalogo_id || item.id);
      const cantidadKg = Number(item.cantidad_kg) || 1;
      const precioPorKg = Number(item.precio_por_kg_congelado || item.precio) || 0;
      const precioEstimado = Number(item.precio_estimado || item.total) || precioPorKg * cantidadKg;

      await dbClient.query(
        `INSERT INTO pedido_items (
           pedido_id,
           catalogo_id,
           cantidad_kg_solicitada,
           precio_por_kg_congelado,
           precio_estimado,
           estado_item
         ) VALUES ($1, $2, $3, $4, $5, 'pendiente')`,
        [pedidoCreado.id, catalogoId, cantidadKg, precioPorKg, precioEstimado]
      );
    }

    await dbClient.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Pedido creado correctamente",
      pedido: pedidoCreado,
    });
  } catch (error) {
    await dbClient.query("ROLLBACK");
    console.error("Error al crear pedido:", error);
    res.status(500).json({
      error: "Error interno al procesar el pedido.",
      detalles: error.message,
    });
  } finally {
    dbClient.release();
  }
};

/**
 * GET /pedidos/:id
 * Obtiene el detalle completo del pedido con sucursal, cliente e items
 */
const getPedidoById = async (req, res) => {
  const { id } = req.params;

  try {
    const pedidoRes = await pool.query(
      `SELECT 
         p.*,
         c.nombre AS cliente_nombre,
         c.telefono AS cliente_telefono,
         c.email AS cliente_email,
         s.nombre AS sucursal_nombre,
         s.direccion AS sucursal_direccion,
         s.ciudad AS sucursal_ciudad,
         s.telefono AS sucursal_telefono,
         s.horario_atencion AS sucursal_horario
       FROM pedidos p
       JOIN clientes c ON p.cliente_id = c.id
       JOIN sucursales s ON p.sucursal_id = s.id
       WHERE p.id = $1`,
      [id]
    );

    if (pedidoRes.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }

    const pedido = pedidoRes.rows[0];

    const itemsRes = await pool.query(
      `SELECT 
         pi.*,
         cat.nombre_producto,
         cat.imagen_url,
         cat.unidad_medida,
         cat.especie,
         cat.categoria
       FROM pedido_items pi
       JOIN catalogo cat ON pi.catalogo_id = cat.id
       WHERE pi.pedido_id = $1`,
      [id]
    );

    pedido.items = itemsRes.rows;

    res.json(pedido);
  } catch (error) {
    console.error("Error al obtener pedido:", error.message);
    res.status(500).json({ error: "Error al obtener el pedido." });
  }
};

/**
 * POST /pedidos/cotizar-envio
 * Cotiza el costo de entrega según la sucursal y la dirección de destino
 */
const cotizarEnvio = async (req, res) => {
  const { sucursal_id, destino, items } = req.body;

  try {
    let sucursal = null;
    if (sucursal_id) {
      const sucursalRes = await pool.query(
        `SELECT id, nombre, direccion, ciudad, latitud, longitud FROM sucursales WHERE id = $1`,
        [sucursal_id]
      );
      if (sucursalRes.rows.length > 0) {
        sucursal = sucursalRes.rows[0];
      }
    }

    if (!sucursal) {
      sucursal = {
        direccion: "Av. Central 123",
        ciudad: "Buenos Aires",
      };
    }

    const quote = await estimateShipping({
      sucursal,
      destino: destino || {},
      items: items || [],
    });

    res.json(quote);
  } catch (error) {
    console.error("Error al cotizar envío:", error.message);
    res.status(500).json({
      success: false,
      price: 1800,
      error: "No se pudo cotizar el envío.",
    });
  }
};

module.exports = {
  createPedido,
  getPedidoById,
  cotizarEnvio,
};
