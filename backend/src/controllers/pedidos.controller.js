// backend/src/controllers/pedidos.controller.js
const pool = require("../db");
const { estimateShipping } = require("../services/pedidosya.service");
const {
  emitirNuevoPedido,
  emitirActualizacionPedido,
  emitirNotificacion,
} = require("../socket");

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
      [
        cliente.telefono.trim(),
        cliente.email ? cliente.email.trim().toLowerCase() : "",
      ],
    );

    const nombreLimpio = cliente.nombre
      ? cliente.nombre.replace(/\s*\(@[^)]+\)/g, "").trim()
      : "Cliente";
    const usuarioLimpio = cliente.usuario
      ? cliente.usuario.trim().replace(/^@/, "")
      : null;

    if (clienteExistente.rows.length > 0) {
      clienteId = clienteExistente.rows[0].id;
      // Actualizar datos de contacto si cambiaron
      await dbClient.query(
        `UPDATE clientes 
         SET nombre = $1,
             usuario = COALESCE(usuario, $2),
             email = COALESCE($3, email),
             direccion_default = COALESCE($4, direccion_default),
             actualizado_en = NOW()
         WHERE id = $5`,
        [
          nombreLimpio,
          usuarioLimpio,
          cliente.email ? cliente.email.trim().toLowerCase() : null,
          direccion_entrega || null,
          clienteId,
        ],
      );
    } else {
      const nuevoCliente = await dbClient.query(
        `INSERT INTO clientes (nombre, usuario, telefono, email, direccion_default)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          nombreLimpio,
          usuarioLimpio,
          cliente.telefono.trim(),
          cliente.email ? cliente.email.trim().toLowerCase() : null,
          direccion_entrega || null,
        ],
      );
      clienteId = nuevoCliente.rows[0].id;
    }

    // 2. Validar precios y calcular total directamente desde la DB (Seguridad)
    const catalogoIds = items.map((i) => Number(i.catalogo_id || i.id));
    const catalogoRes = await dbClient.query(
      `SELECT c.id, c.precio,
         COALESCE(
           (
             SELECT jsonb_agg(
               jsonb_build_object(
                 'cantidad_kg', p.cantidad_kg,
                 'precio_promocional', p.precio_promocional
               ) ORDER BY p.cantidad_kg
             )
             FROM catalogo_promos p
             WHERE p.catalogo_id = c.id AND p.activa = true
           ),
           '[]'::jsonb
         ) AS promos
       FROM catalogo c WHERE c.id = ANY($1::int[])`,
      [catalogoIds]
    );

    const catalogoMap = new Map(catalogoRes.rows.map((r) => [r.id, r]));
    let montoTotalVerificado = 0;
    const itemsProcesados = [];

    for (const item of items) {
      const catalogoId = Number(item.catalogo_id || item.id);
      const cantidadKg = Number(item.cantidad_kg) || 1;
      
      const catData = catalogoMap.get(catalogoId);
      if (!catData) {
        await dbClient.query("ROLLBACK");
        return res.status(400).json({ error: `Producto no encontrado en catálogo (ID: ${catalogoId})` });
      }
      
      let precioPorKg = Number(catData.precio);
      const promos = Array.isArray(catData.promos) ? catData.promos : [];
      for (const promo of promos) {
        if (cantidadKg >= Number(promo.cantidad_kg)) {
          precioPorKg = Number(promo.precio_promocional);
        }
      }

      const precioEstimado = precioPorKg * cantidadKg;
      montoTotalVerificado += precioEstimado;

      itemsProcesados.push({
        catalogoId,
        cantidadKg,
        precioPorKg,
        precioEstimado
      });
    }

    // 3. Insertar el Pedido maestro
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
        montoTotalVerificado,
        direccion_entrega || null,
        notas || null,
      ],
    );

    const pedidoCreado = insertPedidoRes.rows[0];

    // 4. Insertar cada item del pedido
    for (const item of itemsProcesados) {
      await dbClient.query(
        `INSERT INTO pedido_items (
           pedido_id,
           catalogo_id,
           cantidad_kg_solicitada,
           precio_por_kg_congelado,
           precio_estimado,
           estado_item
         ) VALUES ($1, $2, $3, $4, $5, 'pendiente')`,
        [pedidoCreado.id, item.catalogoId, item.cantidadKg, item.precioPorKg, item.precioEstimado],
      );
    }

    await dbClient.query("COMMIT");

    // 4. Acreditar puntos al cliente autenticado por los productos del pedido
    //    Regla: 1 vez los puntos del producto (campo fijo, sin multiplicar por kg)
    try {
      const puntosRes = await pool.query(
        `SELECT COALESCE(SUM(c.puntos), 0) AS total_puntos
         FROM pedido_items pi
         JOIN catalogo c ON c.id = pi.catalogo_id
         WHERE pi.pedido_id = $1 AND c.gana_puntos = true AND c.puntos > 0`,
        [pedidoCreado.id],
      );
      const puntosGanados = Number(puntosRes.rows[0].total_puntos);

      if (puntosGanados > 0 && clienteId) {
        await pool.query(
          `UPDATE clientes SET puntos_acumulados = puntos_acumulados + $1 WHERE id = $2`,
          [puntosGanados, clienteId],
        );
        await pool.query(
          `INSERT INTO puntos_historial (cliente_id, tipo, puntos, descripcion, pedido_id)
           VALUES ($1, 'compra', $2, $3, $4)`,
          [
            clienteId,
            puntosGanados,
            `Puntos ganados por el pedido #${pedidoCreado.id}`,
            pedidoCreado.id,
          ],
        );

        // Notificación de puntos ganados
        await pool.query(
          `INSERT INTO notificaciones (cliente_id, pedido_id, titulo, mensaje, tipo, icono, enlace)
           VALUES ($1, $2, $3, $4, 'puntos', 'sparkles', '/perfil?tab=puntos')`,
          [
            clienteId,
            pedidoCreado.id,
            `¡Sumaste ${puntosGanados} Puntos Valette! ⭐`,
            `Acreditamos tus puntos por la compra del pedido #${pedidoCreado.id}. Consultá tu saldo en tu perfil.`,
          ],
        );
      }
    } catch (puntosError) {
      console.warn(
        "No se pudieron acreditar puntos al pedido:",
        puntosError.message,
      );
    }

    // 5. Crear notificación viva de pedido para el cliente
    if (clienteId) {
      try {
        await pool.query(
          `INSERT INTO notificaciones (cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, estado_pedido)
           VALUES ($1, $2, $3, $4, $5, 'pedido', 'package', $6, 'solicitado')`,
          [
            clienteId,
            Number(sucursal_id),
            pedidoCreado.id,
            `¡Pedido #${pedidoCreado.id} solicitado con éxito!`,
            `Tu compra ingresó a la sucursal. Tocá acá para ver el seguimiento en vivo.`,
            `/pedido/${pedidoCreado.id}/confirmacion`,
          ],
        );
      } catch (notifErr) {
        console.warn(
          "No se pudo registrar notificación de pedido:",
          notifErr.message,
        );
      }
    }

    // 6. Obtener pedido enriquecido para emisión en tiempo real
    const pedidoCompleto = await obtenerPedidoEnriquecido(
      pool,
      pedidoCreado.id,
    );

    // Emitir nuevo pedido en tiempo real a la sucursal y a los cortadores
    emitirNuevoPedido(Number(sucursal_id), pedidoCompleto);

    res.status(201).json({
      success: true,
      message: "Pedido creado correctamente",
      pedido: pedidoCompleto,
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
 * Función auxiliar para obtener un pedido enriquecido con cliente, sucursal e items
 */
const obtenerPedidoEnriquecido = async (db, pedidoId) => {
  const pedidoRes = await db.query(
    `SELECT 
       p.*,
       p.estado_local AS estado,
       p.monto_total_final AS monto_final_real,
       c.nombre AS cliente_nombre,
       c.usuario AS cliente_usuario,
       c.telefono AS cliente_telefono,
       c.email AS cliente_email,
       s.nombre AS sucursal_nombre,
       s.direccion AS sucursal_direccion,
       s.ciudad AS sucursal_ciudad,
       s.telefono AS sucursal_telefono,
       s.horario_atencion AS sucursal_horario,
       e.nombre AS cortador_nombre,
       e.apodo AS cortador_apodo
     FROM pedidos p
     JOIN clientes c ON p.cliente_id = c.id
     JOIN sucursales s ON p.sucursal_id = s.id
     LEFT JOIN empleados e ON p.cortador_id = e.id
     WHERE p.id = $1`,
    [pedidoId],
  );

  if (pedidoRes.rows.length === 0) return null;
  const pedido = pedidoRes.rows[0];

  const itemsRes = await db.query(
    `SELECT 
       pi.*,
       pi.cantidad_kg_solicitada AS cantidad_kg,
       pi.precio_por_kg_congelado AS precio_al_agregar,
       cat.nombre_producto,
       cat.imagen_url,
       cat.unidad_medida,
       cat.especie,
       cat.categoria
     FROM pedido_items pi
     JOIN catalogo cat ON pi.catalogo_id = cat.id
     WHERE pi.pedido_id = $1`,
    [pedidoId],
  );

  pedido.items = itemsRes.rows;
  return pedido;
};

/**
 * GET /pedidos/:id
 * Obtiene el detalle completo del pedido con sucursal, cliente e items
 */
const getPedidoById = async (req, res) => {
  const { id } = req.params;

  try {
    const pedido = await obtenerPedidoEnriquecido(pool, id);

    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }

    res.json(pedido);
  } catch (error) {
    console.error("Error al obtener pedido:", error.message);
    res.status(500).json({ error: "Error al obtener el pedido." });
  }
};

/**
 * PUT /pedidos/:id/estado
 * Actualiza el estado operativo del pedido y emite aviso al cliente y a la sucursal
 * Estados: solicitado | en_corte | pesado | listo | en_camino | entregado | cancelado
 */
const actualizarEstadoPedido = async (req, res) => {
  const { id } = req.params;
  const estado = req.body.estado || req.body.estado_local;
  const monto_final_real =
    req.body.monto_final_real || req.body.monto_total_final;
  const cortador_id = req.body.cortador_id || req.body.empleado_id;
  const notas = req.body.notas;

  try {
    const updateRes = await pool.query(
      `UPDATE pedidos
       SET estado_local = COALESCE($1, estado_local),
           monto_total_final = COALESCE($2, monto_total_final),
           notas = COALESCE($3, notas),
           cortador_id = COALESCE($4, cortador_id),
           actualizado_en = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        estado || null,
        monto_final_real || null,
        notas || null,
        cortador_id ? Number(cortador_id) : null,
        id,
      ],
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }

    const pedidoActualizado = await obtenerPedidoEnriquecido(pool, id);

    // Emitir en tiempo real a la sala del cliente y de la sucursal
    emitirActualizacionPedido(
      pedidoActualizado.cliente_id,
      pedidoActualizado.sucursal_id,
      pedidoActualizado,
    );

    // Registrar y emitir notificación al cliente
    if (pedidoActualizado.cliente_id) {
      try {
        let notifTitulo = `Actualización de Pedido #${id}`;
        let notifMensaje = `El estado de tu pedido cambió a ${estado}.`;
        let notifIcono = "package";

        const est = (estado || "").toLowerCase();
        if (est.includes("corte") || est.includes("preparacion")) {
          notifTitulo = `Pedido #${id} en preparación 🔪`;
          notifMensaje = `Nuestros cortadores están preparando y fraccionando tus cortes frescos.`;
          notifIcono = "scissors";
        } else if (est.includes("listo") || est.includes("pesado")) {
          if (pedidoActualizado.tipo_entrega !== "retiro_sucursal") {
            notifTitulo = `¡Tu pedido #${id} está listo para despacho! 📦`;
            notifMensaje = `Tu pedido fue empaquetado y en breve saldrá el repartidor hacia tu domicilio.`;
          } else {
            notifTitulo = `¡Tu pedido #${id} está listo para retirar! 🛍️`;
            notifMensaje = `Podés pasar por el mostrador de la sucursal a retirar tu compra.`;
          }
          notifIcono = "package";
        } else if (est.includes("camino")) {
          notifTitulo = `Tu pedido #${id} va en camino 🛵`;
          notifMensaje = `El repartidor retiró tu pedido y se dirige a tu domicilio.`;
          notifIcono = "truck";
        } else if (est.includes("entregado") || est.includes("completado")) {
          notifTitulo = `¡Pedido #${id} entregado! 🎉`;
          notifMensaje = `¡Gracias por tu compra en Abastecedora Valette! Que disfrutes tus cortes.`;
          notifIcono = "check";
        } else if (est.includes("cancelado") || est.includes("rechazado")) {
          notifTitulo = `Pedido #${id} cancelado ❌`;
          notifMensaje = `El pedido fue cancelado. ${notas || "Contactanos por cualquier consulta."}`;
          notifIcono = "alert";
        }

        // Actualizar la notificación viva existente del pedido o crearla si no existe
        let notifFinal = null;
        const updateNotifRes = await pool.query(
          `UPDATE notificaciones
           SET titulo = $1, mensaje = $2, icono = $3, enlace = $4, estado_pedido = $5, creada_en = NOW(), leida = FALSE
           WHERE pedido_id = $6 AND tipo = 'pedido'
           RETURNING *`,
          [
            notifTitulo,
            notifMensaje,
            notifIcono,
            `/pedido/${id}/confirmacion`,
            estado,
            id,
          ],
        );

        if (updateNotifRes.rows.length > 0) {
          notifFinal = updateNotifRes.rows[0];
        } else {
          const insertNotifRes = await pool.query(
            `INSERT INTO notificaciones (cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, estado_pedido)
             VALUES ($1, $2, $3, $4, $5, 'pedido', $6, $7, $8)
             RETURNING *`,
            [
              pedidoActualizado.cliente_id,
              pedidoActualizado.sucursal_id,
              id,
              notifTitulo,
              notifMensaje,
              notifIcono,
              `/pedido/${id}/confirmacion`,
              estado,
            ],
          );
          notifFinal = insertNotifRes.rows[0];
        }

        if (notifFinal) {
          emitirNotificacion(notifFinal);

          // Enviar Web Push a todos los celulares/navegadores registrados del cliente en segundo plano
          try {
            const { enviarPushACliente } = require("../services/push.service");
            enviarPushACliente(pedidoActualizado.cliente_id, {
              title: notifFinal.titulo,
              body: notifFinal.mensaje,
              url: `/pedido/${id}/confirmacion`,
              icon: "/favicon.svg",
            }).catch((err) =>
              console.error("Error enviando push de pedido:", err),
            );
          } catch (pushErr) {
            console.warn("Error al invocar pushService:", pushErr);
          }
        }
      } catch (notifErr) {
        console.warn(
          "No se pudo registrar notificación de estado:",
          notifErr.message,
        );
      }
    }

    res.json({
      success: true,
      message: `Estado de pedido actualizado a '${estado}'`,
      pedido: pedidoActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error.message);
    res.status(500).json({ error: "Error al actualizar estado del pedido." });
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
        [sucursal_id],
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
  actualizarEstadoPedido,
  cotizarEnvio,
};
