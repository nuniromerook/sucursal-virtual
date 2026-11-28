// backend/src/controllers/configuracion.controller.js
const pool = require("../db");
const { emitirCambioContenido } = require("../socket");

const DEFAULT_HOME_CONFIG = {
  saludo_dinamico: true,
  saludo_manana: "Buen día",
  saludo_tarde: "Buenas tardes",
  saludo_noche: "Buenas noches",
  saludo_fijo: "Hola",
  mensaje_abierto_semana: "Qué vas a pedir hoy?",
  mensaje_abierto_finde: "Qué vas a pedir hoy?",
  mensaje_cerrado_hoy:
    "Todavía no abrimos, pero ya podés dejar tu pedido para hoy.",
  mensaje_cerrado_manana:
    "Ahora estamos cerrados, pero podés dejar tu pedido para mañana.",
  mensaje_manual_activo: false,
  mensaje_manual: "",
  mensaje_manual_expira: null,
  mensaje_manual_sobre_cerrado: false,
};

const cleanText = (value, maxLen, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  return String(value).trim().slice(0, maxLen);
};

const sanitizeHomeConfig = (raw = {}, current = DEFAULT_HOME_CONFIG) => {
  const base = { ...DEFAULT_HOME_CONFIG, ...(current || {}) };

  let expira = base.mensaje_manual_expira ?? null;
  if (raw.mensaje_manual_expira !== undefined) {
    const rawExp = raw.mensaje_manual_expira;
    if (!rawExp || String(rawExp).trim() === "") {
      expira = null;
    } else {
      const parsed = new Date(rawExp);
      expira = Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }
  }

  return {
    saludo_dinamico:
      raw.saludo_dinamico !== undefined
        ? Boolean(raw.saludo_dinamico)
        : Boolean(base.saludo_dinamico),
    saludo_manana:
      cleanText(raw.saludo_manana, 40, base.saludo_manana) ||
      DEFAULT_HOME_CONFIG.saludo_manana,
    saludo_tarde:
      cleanText(raw.saludo_tarde, 40, base.saludo_tarde) ||
      DEFAULT_HOME_CONFIG.saludo_tarde,
    saludo_noche:
      cleanText(raw.saludo_noche, 40, base.saludo_noche) ||
      DEFAULT_HOME_CONFIG.saludo_noche,
    saludo_fijo:
      cleanText(raw.saludo_fijo, 60, base.saludo_fijo) ||
      DEFAULT_HOME_CONFIG.saludo_fijo,
    mensaje_abierto_semana:
      cleanText(raw.mensaje_abierto_semana, 160, base.mensaje_abierto_semana) ||
      DEFAULT_HOME_CONFIG.mensaje_abierto_semana,
    mensaje_abierto_finde:
      cleanText(raw.mensaje_abierto_finde, 160, base.mensaje_abierto_finde) ||
      DEFAULT_HOME_CONFIG.mensaje_abierto_finde,
    mensaje_cerrado_hoy:
      cleanText(raw.mensaje_cerrado_hoy, 160, base.mensaje_cerrado_hoy) ||
      DEFAULT_HOME_CONFIG.mensaje_cerrado_hoy,
    mensaje_cerrado_manana:
      cleanText(raw.mensaje_cerrado_manana, 160, base.mensaje_cerrado_manana) ||
      DEFAULT_HOME_CONFIG.mensaje_cerrado_manana,
    mensaje_manual_activo:
      raw.mensaje_manual_activo !== undefined
        ? Boolean(raw.mensaje_manual_activo)
        : Boolean(base.mensaje_manual_activo),
    mensaje_manual: cleanText(raw.mensaje_manual, 180, base.mensaje_manual),
    mensaje_manual_expira: expira,
    mensaje_manual_sobre_cerrado:
      raw.mensaje_manual_sobre_cerrado !== undefined
        ? Boolean(raw.mensaje_manual_sobre_cerrado)
        : Boolean(base.mensaje_manual_sobre_cerrado),
  };
};

// GET /configuracion/home (público para la tienda)
const getHomeConfig = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT clave, valor, updated_at FROM configuracion_sitio WHERE clave = $1 LIMIT 1",
      ["home_inicio"],
    );

    if (result.rows.length === 0) {
      return res.json({
        clave: "home_inicio",
        valor: DEFAULT_HOME_CONFIG,
        updated_at: null,
      });
    }

    const row = result.rows[0];
    return res.json({
      clave: row.clave,
      valor: sanitizeHomeConfig(row.valor, DEFAULT_HOME_CONFIG),
      updated_at: row.updated_at,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /configuracion/home (solo admin / superadmin)
const updateHomeConfig = async (req, res, next) => {
  try {
    const existing = await pool.query(
      "SELECT valor FROM configuracion_sitio WHERE clave = $1 LIMIT 1",
      ["home_inicio"],
    );
    const currentVal = existing.rows[0]?.valor || DEFAULT_HOME_CONFIG;
    const payload =
      req.body && typeof req.body.valor === "object" && req.body.valor !== null
        ? req.body.valor
        : req.body || {};

    const sanitized = sanitizeHomeConfig(payload, currentVal);

    const saved = await pool.query(
      `INSERT INTO configuracion_sitio (clave, valor, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (clave)
       DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()
       RETURNING clave, valor, updated_at`,
      ["home_inicio", JSON.stringify(sanitized)],
    );

    const responseObj = {
      clave: saved.rows[0].clave,
      valor: saved.rows[0].valor,
      updated_at: saved.rows[0].updated_at,
    };

    emitirCambioContenido(responseObj);
    return res.json(responseObj);
  } catch (error) {
    next(error);
  }
};

// GET /configuracion (solo admin: listado completo para futuras secciones)
const getAllConfig = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT clave, valor, updated_at FROM configuracion_sitio ORDER BY clave ASC",
    );
    return res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  DEFAULT_HOME_CONFIG,
  getHomeConfig,
  updateHomeConfig,
  getAllConfig,
};
