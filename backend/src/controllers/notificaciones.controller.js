// backend/src/controllers/notificaciones.controller.js
const pool = require("../db");
const { verifyToken } = require("../utils/auth");
const { emitirNotificacion } = require("../socket");

/**
 * Extrae el cliente_id desde el header Authorization si viene presente
 */
const getClienteIdFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    return decoded?.id || null;
  } catch {
    return null;
  }
};

/**
 * Obtiene las notificaciones del cliente o de la sucursal
 * GET /notificaciones
 */
const getNotificaciones = async (req, res) => {
  try {
    const clienteId = getClienteIdFromHeader(req) || req.query.cliente_id;
    const sucursalId = req.query.sucursal_id;
    const soloNoLeidas = req.query.no_leidas === "true";

    let query = `
      SELECT 
        n.id,
        n.cliente_id,
        n.sucursal_id,
        n.pedido_id,
        n.titulo,
        n.mensaje,
        n.tipo,
        n.icono,
        n.enlace,
        n.leida,
        n.creada_en,
        COALESCE(p.estado_local, n.estado_pedido) AS estado_pedido,
        p.monto_total_estimado AS total_estimado,
        p.tipo_entrega
      FROM notificaciones n
      LEFT JOIN pedidos p ON n.pedido_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (clienteId) {
      params.push(clienteId);
      // Notificaciones directas del cliente O notificaciones globales broadcast (sin cliente_id ni sucursal_id)
      query += ` AND (n.cliente_id = $${params.length} OR (n.cliente_id IS NULL AND n.sucursal_id IS NULL))`;
    } else if (sucursalId) {
      params.push(sucursalId);
      query += ` AND n.sucursal_id = $${params.length}`;
    }

    if (soloNoLeidas) {
      query += ` AND n.leida = FALSE`;
    }

    query += ` ORDER BY n.creada_en DESC LIMIT 50`;

    const { rows } = await pool.query(query, params);

    // Conteo de no leídas
    let unreadCount = 0;
    if (clienteId) {
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM notificaciones WHERE (cliente_id = $1 OR (cliente_id IS NULL AND sucursal_id IS NULL)) AND leida = FALSE`,
        [clienteId]
      );
      unreadCount = parseInt(countRes.rows[0].count, 10) || 0;
    }

    res.json({
      notificaciones: rows,
      unreadCount,
    });
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    res.status(500).json({ error: "Error al obtener notificaciones" });
  }
};

/**
 * Marca una notificación individual como leída
 * PATCH /notificaciones/:id/leida
 */
const marcarLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE notificaciones SET leida = TRUE WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }

    res.json({ message: "Notificación marcada como leída", notificacion: result.rows[0] });
  } catch (error) {
    console.error("Error al marcar notificación:", error);
    res.status(500).json({ error: "Error al marcar notificación" });
  }
};

/**
 * Marca todas las notificaciones de un cliente como leídas
 * PATCH /notificaciones/marcar-todas-leidas
 */
const marcarTodasLeidas = async (req, res) => {
  try {
    const clienteId = getClienteIdFromHeader(req) || req.body.cliente_id;
    if (!clienteId) {
      return res.status(400).json({ error: "ID de cliente no proporcionado" });
    }

    await pool.query(
      `UPDATE notificaciones SET leida = TRUE WHERE cliente_id = $1 OR (cliente_id IS NULL AND sucursal_id IS NULL)`,
      [clienteId]
    );

    res.json({ message: "Todas las notificaciones fueron marcadas como leídas" });
  } catch (error) {
    console.error("Error al marcar todas las notificaciones:", error);
    res.status(500).json({ error: "Error al actualizar notificaciones" });
  }
};

/**
 * Crea una nueva notificación y la emite en tiempo real vía Socket.io
 * POST /notificaciones
 */
const crearNotificacion = async (req, res) => {
  try {
    const {
      cliente_id,
      sucursal_id,
      pedido_id,
      titulo,
      mensaje,
      tipo = "sistema",
      icono = "bell",
      enlace = "/",
      estado_pedido,
    } = req.body;

    if (!titulo || !mensaje) {
      return res.status(400).json({ error: "Título y mensaje son obligatorios" });
    }

    const { rows } = await pool.query(
      `INSERT INTO notificaciones (cliente_id, sucursal_id, pedido_id, titulo, mensaje, tipo, icono, enlace, estado_pedido)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        cliente_id || null,
        sucursal_id || null,
        pedido_id || null,
        titulo.trim(),
        mensaje.trim(),
        tipo,
        icono,
        enlace,
        estado_pedido || null,
      ]
    );

    const nuevaNotif = rows[0];

    // 1. Emitir inmediatamente por WebSockets (para cuando la app está abierta)
    emitirNotificacion(nuevaNotif);

    // 2. Emitir Web Push en segundo plano (para cuando la app/celular está bloqueado)
    const { enviarPushACliente, enviarPushGlobal } = require("../services/push.service");
    const pushPayload = {
      title: nuevaNotif.titulo,
      body: nuevaNotif.mensaje,
      url: nuevaNotif.enlace || "/",
      icon: "/favicon.svg",
    };

    if (nuevaNotif.cliente_id) {
      enviarPushACliente(nuevaNotif.cliente_id, pushPayload).catch((err) =>
        console.error("Error enviando push a cliente:", err)
      );
    } else {
      enviarPushGlobal(pushPayload).catch((err) =>
        console.error("Error enviando push global:", err)
      );
    }

    res.status(201).json({
      message: "Notificación creada y emitida con éxito",
      notificacion: nuevaNotif,
    });
  } catch (error) {
    console.error("Error al crear notificación:", error);
    res.status(500).json({ error: "Error al crear notificación" });
  }
};

/**
 * Retorna la clave pública VAPID para suscripciones push
 * GET /notificaciones/push/public-key
 */
const getPublicKey = (req, res) => {
  const { getVapidPublicKey } = require("../services/push.service");
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return res.status(500).json({ error: "Clave pública VAPID no disponible" });
  }
  res.json({ publicKey });
};

/**
 * Guarda o actualiza una suscripción de Web Push
 * POST /notificaciones/push/subscribe
 */
const suscribirPush = async (req, res) => {
  try {
    const clienteId = getClienteIdFromHeader(req) || req.body.cliente_id;
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys) {
      return res.status(400).json({ error: "Endpoint y keys son obligatorios" });
    }

    await pool.query(
      `INSERT INTO push_subscriptions (cliente_id, endpoint, keys)
       VALUES ($1, $2, $3)
       ON CONFLICT (endpoint) DO UPDATE 
       SET cliente_id = EXCLUDED.cliente_id, keys = EXCLUDED.keys, creada_en = NOW()`,
      [clienteId || null, endpoint, JSON.stringify(keys)]
    );

    console.log(`✅ [Push Subscribed] Dispositivo registrado para cliente: ${clienteId || "anónimo"}`);
    res.status(201).json({ message: "Suscripción Push registrada exitosamente" });
  } catch (error) {
    console.error("Error al registrar suscripción push:", error);
    res.status(500).json({ error: "Error al registrar suscripción push" });
  }
};

module.exports = {
  getNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
  crearNotificacion,
  suscribirPush,
  getPublicKey,
};
