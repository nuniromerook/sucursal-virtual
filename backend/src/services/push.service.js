// backend/src/services/push.service.js
const webpush = require("web-push");
const pool = require("../db");

// Configuración de llaves VAPID
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:abastecedoravalette.contacto@gmail.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log("🔔 [Web Push] VAPID configurado correctamente.");
} else {
  console.warn("⚠️ [Web Push] Faltan VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY en variables de entorno.");
}

/**
 * Retorna la clave pública VAPID para suscripción en frontend
 */
const getVapidPublicKey = () => {
  return process.env.VAPID_PUBLIC_KEY || vapidPublicKey;
};

/**
 * Envía una notificación Web Push a todos los dispositivos registrados de un cliente
 * (ej: iPhone y Android a la vez)
 */
const enviarPushACliente = async (clienteId, payload) => {
  if (!clienteId) return { enviados: 0, fallidos: 0 };
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("⚠️ [Web Push] No se puede enviar push: VAPID no configurado.");
    return { enviados: 0, fallidos: 0 };
  }

  try {
    const res = await pool.query(
      `SELECT id, endpoint, keys FROM push_subscriptions WHERE cliente_id = $1`,
      [clienteId]
    );

    if (res.rows.length === 0) {
      console.log(`ℹ️ [Web Push] El cliente #${clienteId} no tiene suscripciones push activas.`);
      return { enviados: 0, fallidos: 0 };
    }

    const payloadString = typeof payload === "string" ? payload : JSON.stringify(payload);
    let enviados = 0;
    let fallidos = 0;
    const eliminadosIds = [];

    await Promise.all(
      res.rows.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: typeof sub.keys === "string" ? JSON.parse(sub.keys) : sub.keys,
        };

        try {
          await webpush.sendNotification(pushSubscription, payloadString);
          enviados++;
        } catch (error) {
          fallidos++;
          console.error(`❌ [Web Push Error] Dispositivo #${sub.id}:`, error.statusCode || error.message);

          // Si el endpoint ya no existe o expiró (404 o 410 Gone), eliminarlo de la base de datos
          if (error.statusCode === 404 || error.statusCode === 410) {
            eliminadosIds.push(sub.id);
          }
        }
      })
    );

    // Limpieza de suscripciones obsoletas
    if (eliminadosIds.length > 0) {
      await pool.query(
        `DELETE FROM push_subscriptions WHERE id = ANY($1::int[])`,
        [eliminadosIds]
      );
      console.log(`🧹 [Web Push] Se eliminaron ${eliminadosIds.length} suscripciones caducadas.`);
    }

    console.log(`📢 [Web Push Cliente #${clienteId}] Enviados: ${enviados} | Fallidos: ${fallidos}`);
    return { enviados, fallidos };
  } catch (error) {
    console.error("❌ Error en enviarPushACliente:", error);
    return { enviados: 0, fallidos: 0, error: error.message };
  }
};

/**
 * Envía una notificación Web Push a todas las suscripciones registradas (broadcast)
 */
const enviarPushGlobal = async (payload) => {
  if (!vapidPublicKey || !vapidPrivateKey) return { enviados: 0, fallidos: 0 };

  try {
    const res = await pool.query(`SELECT id, endpoint, keys FROM push_subscriptions`);
    if (res.rows.length === 0) return { enviados: 0, fallidos: 0 };

    const payloadString = typeof payload === "string" ? payload : JSON.stringify(payload);
    let enviados = 0;
    let fallidos = 0;
    const eliminadosIds = [];

    await Promise.all(
      res.rows.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: typeof sub.keys === "string" ? JSON.parse(sub.keys) : sub.keys,
        };

        try {
          await webpush.sendNotification(pushSubscription, payloadString);
          enviados++;
        } catch (error) {
          fallidos++;
          if (error.statusCode === 404 || error.statusCode === 410) {
            eliminadosIds.push(sub.id);
          }
        }
      })
    );

    if (eliminadosIds.length > 0) {
      await pool.query(
        `DELETE FROM push_subscriptions WHERE id = ANY($1::int[])`,
        [eliminadosIds]
      );
    }

    console.log(`📢 [Web Push Global] Enviados: ${enviados} | Fallidos: ${fallidos}`);
    return { enviados, fallidos };
  } catch (error) {
    console.error("❌ Error en enviarPushGlobal:", error);
    return { enviados: 0, fallidos: 0, error: error.message };
  }
};

module.exports = {
  getVapidPublicKey,
  enviarPushACliente,
  enviarPushGlobal,
};
