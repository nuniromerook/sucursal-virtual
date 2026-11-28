// backend/src/controllers/ingresos.controller.js
const pool = require("../db");

const VALID_RUBROS = ["Vacuno", "Cerdo", "Pollo", "Embutidos", "Almacén", "Otro"];

const cleanText = (val, maxLen, fallback = "") => {
  if (val === undefined || val === null) return fallback;
  return String(val).trim().slice(0, maxLen);
};

const toPositiveNum = (val, fallback = 0) => {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : fallback;
};

const computeEstado = (kgRemito, kgBalanza, requestedEstado) => {
  if (requestedEstado === "confirmado" || requestedEstado === "revisar_dif") {
    return requestedEstado;
  }
  if (kgRemito > 0) {
    const difPct = ((kgBalanza - kgRemito) / kgRemito) * 100;
    if (difPct < -1.5) return "revisar_dif";
  }
  return "confirmado";
};

// GET /ingresos?rango=hoy|semana|mes|todos&rubro=...&sucursal_id=1
const getIngresos = async (req, res, next) => {
  try {
    const rango = String(req.query.rango || "mes").toLowerCase();
    const rubro = cleanText(req.query.rubro, 40, "");
    const sucursalId = Number(req.query.sucursal_id) || 1;

    const conditions = ["sucursal_id = $1"];
    const params = [sucursalId];
    let idx = 2;

    if (rango === "hoy") {
      conditions.push(
        "creado_en >= (date_trunc('day', NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires') AT TIME ZONE 'America/Argentina/Buenos_Aires')",
      );
    } else if (rango === "semana") {
      conditions.push("creado_en >= NOW() - INTERVAL '7 days'");
    } else if (rango === "mes") {
      conditions.push("creado_en >= NOW() - INTERVAL '30 days'");
    }

    if (rubro && rubro.toLowerCase() !== "todos") {
      conditions.push(`LOWER(rubro) = LOWER($${idx++})`);
      params.push(rubro);
    }

    const query = `
      SELECT id, sucursal_id, lote, proveedor, remito, tropa, mercaderia, rubro,
             kg_remito, kg_balanza, costo_kg, camara, temperatura, notas, estado,
             usuario_id, usuario_nombre, creado_en, actualizado_en
      FROM ingresos_mercaderia
      WHERE ${conditions.join(" AND ")}
      ORDER BY creado_en DESC, id DESC
      LIMIT 500
    `;

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// POST /ingresos
const createIngreso = async (req, res, next) => {
  try {
    const body = req.body || {};
    const proveedor = cleanText(body.proveedor, 120);
    const mercaderia = cleanText(body.mercaderia, 160);

    if (!proveedor || !mercaderia) {
      return res
        .status(400)
        .json({ error: "Proveedor y mercadería son obligatorios." });
    }

    const sucursalId = Number(body.sucursal_id) || 1;
    const rawRubro = cleanText(body.rubro, 40, "Vacuno");
    const rubro = VALID_RUBROS.includes(rawRubro) ? rawRubro : rawRubro || "Vacuno";
    const kgRemito = toPositiveNum(body.kg_remito, 0);
    const kgBalanza = toPositiveNum(body.kg_balanza, kgRemito);
    const costoKg = toPositiveNum(body.costo_kg, 0);

    if (kgBalanza <= 0) {
      return res
        .status(400)
        .json({ error: "Los kilos de balanza deben ser mayores a 0." });
    }

    const remito = cleanText(body.remito, 80, "");
    const tropa = cleanText(body.tropa, 60, "");
    const camara = cleanText(body.camara, 60, "Cámara 1") || "Cámara 1";
    const temperatura = cleanText(body.temperatura, 24, "");
    const notas = cleanText(body.notas, 500, "");
    const estado = computeEstado(kgRemito, kgBalanza, body.estado);

    // Generar código de lote automático si no vino uno explícito
    let lote = cleanText(body.lote, 40, "");
    if (!lote) {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const seqRes = await pool.query(
        "SELECT COALESCE(MAX(id), 0) + 1 AS next_seq FROM ingresos_mercaderia",
      );
      const nextSeq = String(seqRes.rows[0]?.next_seq || 1).padStart(3, "0");
      lote = `LT-${dd}${mm}-${nextSeq}`;
    }

    const usuarioId = req.empleado?.id || null;
    const usuarioNombre = cleanText(req.empleado?.nombre, 120, "");

    const inserted = await pool.query(
      `INSERT INTO ingresos_mercaderia (
         sucursal_id, lote, proveedor, remito, tropa, mercaderia, rubro,
         kg_remito, kg_balanza, costo_kg, camara, temperatura, notas, estado,
         usuario_id, usuario_nombre
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        sucursalId,
        lote,
        proveedor,
        remito,
        tropa,
        mercaderia,
        rubro,
        kgRemito,
        kgBalanza,
        costoKg,
        camara,
        temperatura,
        notas,
        estado,
        usuarioId,
        usuarioNombre,
      ],
    );

    return res.status(201).json(inserted.rows[0]);
  } catch (error) {
    next(error);
  }
};

// PUT /ingresos/:id
const updateIngreso = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "ID de ingreso inválido." });
    }

    const currentRes = await pool.query(
      "SELECT * FROM ingresos_mercaderia WHERE id = $1 LIMIT 1",
      [id],
    );
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: "Ingreso no encontrado." });
    }
    const curr = currentRes.rows[0];
    const body = req.body || {};

    const proveedor =
      body.proveedor !== undefined
        ? cleanText(body.proveedor, 120, curr.proveedor) || curr.proveedor
        : curr.proveedor;
    const mercaderia =
      body.mercaderia !== undefined
        ? cleanText(body.mercaderia, 160, curr.mercaderia) || curr.mercaderia
        : curr.mercaderia;
    const rubro =
      body.rubro !== undefined
        ? cleanText(body.rubro, 40, curr.rubro) || curr.rubro
        : curr.rubro;
    const remito =
      body.remito !== undefined ? cleanText(body.remito, 80, "") : curr.remito;
    const tropa =
      body.tropa !== undefined ? cleanText(body.tropa, 60, "") : curr.tropa;
    const camara =
      body.camara !== undefined
        ? cleanText(body.camara, 60, curr.camara) || curr.camara
        : curr.camara;
    const temperatura =
      body.temperatura !== undefined
        ? cleanText(body.temperatura, 24, "")
        : curr.temperatura;
    const notas =
      body.notas !== undefined ? cleanText(body.notas, 500, "") : curr.notas;

    const kgRemito =
      body.kg_remito !== undefined
        ? toPositiveNum(body.kg_remito, Number(curr.kg_remito))
        : Number(curr.kg_remito);
    const kgBalanza =
      body.kg_balanza !== undefined
        ? toPositiveNum(body.kg_balanza, Number(curr.kg_balanza))
        : Number(curr.kg_balanza);
    const costoKg =
      body.costo_kg !== undefined
        ? toPositiveNum(body.costo_kg, Number(curr.costo_kg))
        : Number(curr.costo_kg);

    const estado = computeEstado(kgRemito, kgBalanza, body.estado);

    const updated = await pool.query(
      `UPDATE ingresos_mercaderia
       SET proveedor = $1,
           remito = $2,
           tropa = $3,
           mercaderia = $4,
           rubro = $5,
           kg_remito = $6,
           kg_balanza = $7,
           costo_kg = $8,
           camara = $9,
           temperatura = $10,
           notas = $11,
           estado = $12,
           actualizado_en = NOW()
       WHERE id = $13
       RETURNING *`,
      [
        proveedor,
        remito,
        tropa,
        mercaderia,
        rubro,
        kgRemito,
        kgBalanza,
        costoKg,
        camara,
        temperatura,
        notas,
        estado,
        id,
      ],
    );

    return res.json(updated.rows[0]);
  } catch (error) {
    next(error);
  }
};

// DELETE /ingresos/:id
const deleteIngreso = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "ID de ingreso inválido." });
    }
    const del = await pool.query(
      "DELETE FROM ingresos_mercaderia WHERE id = $1 RETURNING id",
      [id],
    );
    if (del.rows.length === 0) {
      return res.status(404).json({ error: "Ingreso no encontrado." });
    }
    return res.json({ deleted: true, id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIngresos,
  createIngreso,
  updateIngreso,
  deleteIngreso,
};
