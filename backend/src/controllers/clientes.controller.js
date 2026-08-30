// backend/src/controllers/clientes.controller.js
const pool = require("../db");
const {
  hashPassword,
  verifyPassword,
  generateToken,
} = require("../utils/auth");

const crypto = require("crypto");

/**
 * Genera un código de referido de 5 dígitos único (10000-99999)
 */
async function generarReferralCode(dbClient) {
  for (let i = 0; i < 20; i++) {
    const code = String(Math.floor(10000 + Math.random() * 90000));
    const existe = await dbClient.query(
      `SELECT id FROM clientes WHERE referral_code = $1 LIMIT 1`,
      [code]
    );
    if (existe.rows.length === 0) return code;
  }
  // Fallback: timestamp en base36 truncado a 5 dígitos
  return String(Date.now()).slice(-5);
}

/**
 * POST /clientes/registro
 * Registro tradicional con email y contraseña
 */
const registroCliente = async (req, res) => {
  const { nombre, email, password, telefono, usuario, codigo_referido } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({
      error: "Nombre, email y contraseña son obligatorios.",
    });
  }

  const emailClean = email.trim().toLowerCase();
  const usuarioClean = usuario ? usuario.trim().replace(/^@/, "").toLowerCase() : null;
  const telefonoClean = telefono ? telefono.trim() : "";
  const codigoRefClean = codigo_referido ? codigo_referido.trim().toUpperCase() : null;

  const dbClient = await pool.connect();
  try {
    await dbClient.query("BEGIN");

    // 1. Verificar si ya existe por email o usuario
    const existente = await dbClient.query(
      `SELECT id, email, usuario FROM clientes WHERE email = $1 OR (usuario IS NOT NULL AND usuario = $2) LIMIT 1`,
      [emailClean, usuarioClean || ""]
    );

    if (existente.rows.length > 0) {
      const match = existente.rows[0];
      await dbClient.query("ROLLBACK");
      if (match.email === emailClean) {
        return res.status(400).json({ error: "El correo electrónico ya se encuentra registrado." });
      }
      return res.status(400).json({ error: "El nombre de usuario ya está en uso." });
    }

    // 2. Validar código de referido (si se proporcionó)
    let referidorId = null;
    if (codigoRefClean) {
      // Verificar si la columna referral_code existe
      const colCheck = await dbClient.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = 'clientes' AND column_name = 'referral_code' LIMIT 1`
      );

      if (colCheck.rows.length > 0) {
        const referidorRes = await dbClient.query(
          `SELECT id, nombre, usuario FROM clientes WHERE referral_code = $1 LIMIT 1`,
          [codigoRefClean]
        );
        if (referidorRes.rows.length === 0) {
          await dbClient.query("ROLLBACK");
          return res.status(400).json({ error: "El código de referido no es válido." });
        }
        referidorId = referidorRes.rows[0].id;
      }
    }

    const hashedPassword = hashPassword(password);
    const perfilCompleto = Boolean(usuarioClean && telefonoClean);
    const puntosIniciales = (perfilCompleto ? 50 : 0) + (referidorId ? 50 : 0);

    // 3. Verificar si las columnas referral_code y referido_por existen
    const colsCheck = await dbClient.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'clientes' AND column_name IN ('referral_code', 'referido_por')`
    );
    const colsExistentes = new Set(colsCheck.rows.map((r) => r.column_name));
    const tieneReferralCols = colsExistentes.has("referral_code") && colsExistentes.has("referido_por");

    // 4. Insertar cliente (con o sin columnas de referral según el estado de la DB)
    let nuevoCliente;
    if (tieneReferralCols) {
      const nuevoReferralCode = await generarReferralCode(dbClient);

      // Protección anti-auto-referido
      if (referidorId !== null) {
        // No hay ID del nuevo cliente aún, pero podemos verificar el email del referidor
        const referidorEmailCheck = await dbClient.query(
          `SELECT email FROM clientes WHERE id = $1 LIMIT 1`,
          [referidorId]
        );
        if (referidorEmailCheck.rows.length > 0 && referidorEmailCheck.rows[0].email === emailClean) {
          await dbClient.query("ROLLBACK");
          return res.status(400).json({ error: "No podés usar tu propio código de referido." });
        }
      }

      const result = await dbClient.query(
        `INSERT INTO clientes (
           nombre, email, password, telefono, usuario,
           puntos_acumulados, perfil_completo,
           referral_code, referido_por
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, nombre, email, telefono, usuario,
                   puntos_acumulados, perfil_completo,
                   referral_code, creado_en`,
        [
          nombre.trim(), emailClean, hashedPassword,
          telefonoClean, usuarioClean,
          puntosIniciales, perfilCompleto,
          nuevoReferralCode, referidorId,
        ]
      );
      nuevoCliente = result.rows[0];
    } else {
      // Columnas no migradas aún — inserción sin referral
      console.warn("⚠ Columnas referral_code/referido_por no encontradas en clientes. Ejecutá el SQL de migración.");
      const result = await dbClient.query(
        `INSERT INTO clientes (nombre, email, password, telefono, usuario, puntos_acumulados, perfil_completo)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, nombre, email, telefono, usuario, puntos_acumulados, perfil_completo, creado_en`,
        [nombre.trim(), emailClean, hashedPassword, telefonoClean, usuarioClean, puntosIniciales, perfilCompleto]
      );
      nuevoCliente = result.rows[0];
      referidorId = null; // no podemos procesar referido sin la columna
    }

    // 5. Verificar si puntos_historial existe antes de insertar
    const historialCheck = await dbClient.query(
      `SELECT to_regclass('puntos_historial') AS existe`
    );
    const tieneHistorial = historialCheck.rows[0]?.existe !== null;

    if (tieneHistorial) {
      if (perfilCompleto) {
        await dbClient.query(
          `INSERT INTO puntos_historial (cliente_id, tipo, puntos, descripcion)
           VALUES ($1, 'bienvenida', 50, 'Bono por completar el perfil al registrarse')`,
          [nuevoCliente.id]
        );
      }

      if (referidorId) {
        await dbClient.query(
          `INSERT INTO puntos_historial (cliente_id, tipo, puntos, descripcion)
           VALUES ($1, 'referido_recibido', 50, $2)`,
          [nuevoCliente.id, `Bonus por usar el código de referido: ${codigoRefClean}`]
        );
        await dbClient.query(
          `UPDATE clientes SET puntos_acumulados = puntos_acumulados + 100 WHERE id = $1`,
          [referidorId]
        );
        await dbClient.query(
          `INSERT INTO puntos_historial (cliente_id, tipo, puntos, descripcion)
           VALUES ($1, 'referido_dado', 100, $2)`,
          [referidorId, `Tu referido @${usuarioClean || emailClean} se registró con tu código`]
        );
      }
    } else {
      console.warn("⚠ Tabla puntos_historial no encontrada. Ejecutá el SQL de migración.");
    }

    await dbClient.query("COMMIT");

    const token = generateToken({
      id: nuevoCliente.id,
      email: nuevoCliente.email,
      nombre: nuevoCliente.nombre,
    });

    let message = "¡Registro exitoso!";
    if (perfilCompleto && referidorId) message = "¡Registro exitoso! Ganaste 100 puntos de bienvenida.";
    else if (perfilCompleto) message = "¡Registro exitoso! Ganaste 50 puntos de bienvenida.";
    else if (referidorId) message = "¡Registro exitoso! Ganaste 50 puntos por usar el código de referido.";

    res.status(201).json({ success: true, message, token, user: nuevoCliente });
  } catch (error) {
    await dbClient.query("ROLLBACK").catch(() => {});
    console.error("╔══ ERROR registroCliente ══════════════════════════");
    console.error("║ message:", error.message);
    console.error("║ code   :", error.code);
    console.error("║ detail :", error.detail);
    console.error("╚════════════════════════════════════════════════════");
    res.status(500).json({ error: "Error interno al procesar el registro.", detalle: error.message });
  } finally {
    dbClient.release();
  }
};


/**
 * POST /clientes/login
 * Inicio de sesión por email o nombre de usuario
 */
const loginCliente = async (req, res) => {
  const { identificador, password } = req.body;

  if (!identificador || !password) {
    return res.status(400).json({
      error: "Debe ingresar su email/usuario y su contraseña.",
    });
  }

  const cleanIdent = identificador.trim().replace(/^@/, "").toLowerCase();

  try {
    const result = await pool.query(
      `SELECT id, nombre, email, password, telefono, usuario, direccion_default, puntos_acumulados, perfil_completo, avatar_url, referral_code
       FROM clientes
       WHERE email = $1 OR usuario = $1 OR telefono = $1
       LIMIT 1`,
      [cleanIdent]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    const cliente = result.rows[0];

    if (!cliente.password) {
      return res.status(400).json({
        error: "Esta cuenta fue creada con Google. Iniciá sesión con el botón de Google.",
      });
    }

    const passwordValido = verifyPassword(password, cliente.password);
    if (!passwordValido) {
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    // Si por alguna razón histórica no tiene referral_code, se lo generamos
    if (!cliente.referral_code) {
      const code = await generarReferralCode(pool);
      await pool.query(`UPDATE clientes SET referral_code = $1 WHERE id = $2`, [code, cliente.id]);
      cliente.referral_code = code;
    }

    const token = generateToken({
      id: cliente.id,
      email: cliente.email,
      nombre: cliente.nombre,
    });

    const { password: _, ...userSafe } = cliente;

    res.json({
      success: true,
      message: "Sesión iniciada correctamente",
      token,
      user: userSafe,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error al iniciar sesión." });
  }
};

/**
 * POST /clientes/google
 * Autenticación social con Google
 */
const googleAuth = async (req, res) => {
  const { google_id, email, nombre, avatar_url } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email de Google es requerido." });
  }

  const emailClean = email.trim().toLowerCase();

  try {
    let clienteRes = await pool.query(
      `SELECT id, nombre, email, telefono, usuario, direccion_default, puntos_acumulados, perfil_completo, avatar_url, referral_code
       FROM clientes
       WHERE (google_id IS NOT NULL AND google_id = $1) OR email = $2
       LIMIT 1`,
      [google_id || "", emailClean]
    );

    let cliente;

    if (clienteRes.rows.length > 0) {
      cliente = clienteRes.rows[0];
      let nuevoCode = cliente.referral_code;
      if (!nuevoCode) {
        nuevoCode = await generarReferralCode(pool);
      }

      // Actualizar google_id, avatar y referral_code si no los tenía
      await pool.query(
        `UPDATE clientes 
         SET google_id = COALESCE(google_id, $1),
             avatar_url = COALESCE(avatar_url, $2),
             referral_code = COALESCE(referral_code, $3),
             actualizado_en = NOW()
         WHERE id = $4`,
        [google_id || null, avatar_url || null, nuevoCode, cliente.id]
      );
      cliente.referral_code = nuevoCode;
    } else {
      // Alta rápida nuevo usuario Google con referral_code de 5 dígitos
      const code = await generarReferralCode(pool);
      const insertRes = await pool.query(
        `INSERT INTO clientes (
           nombre, email, google_id, avatar_url, telefono, puntos_acumulados, perfil_completo, referral_code
         ) VALUES ($1, $2, $3, $4, '', 0, false, $5)
         RETURNING id, nombre, email, telefono, usuario, direccion_default, puntos_acumulados, perfil_completo, avatar_url, referral_code`,
        [nombre || "Usuario Valette", emailClean, google_id || null, avatar_url || null, code]
      );
      cliente = insertRes.rows[0];
    }

    const token = generateToken({
      id: cliente.id,
      email: cliente.email,
      nombre: cliente.nombre,
    });

    res.json({
      success: true,
      token,
      user: cliente,
      isNew: !cliente.perfil_completo,
    });
  } catch (error) {
    console.error("Error en Google Auth:", error);
    res.status(500).json({ error: "Error al autenticar con Google." });
  }
};

/**
 * GET /clientes/perfil
 * Consulta los datos del cliente autenticado
 */
const getPerfil = async (req, res) => {
  const clienteId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT
         c.id, c.nombre, c.email, c.telefono, c.usuario,
         c.direccion_default, c.puntos_acumulados, c.perfil_completo,
         c.avatar_url, c.creado_en, c.referral_code,
         (SELECT COUNT(*) FROM clientes r WHERE r.referido_por = c.id) AS referidos_count
       FROM clientes c
       WHERE c.id = $1`,
      [clienteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const perfil = result.rows[0];
    perfil.referidos_count = Number(perfil.referidos_count);

    res.json(perfil);
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ error: "Error al obtener datos del perfil." });
  }
};

/**
 * PUT /clientes/perfil
 * Actualiza los datos personales y premia con +50 puntos al completar usuario + telefono
 */
const updatePerfil = async (req, res) => {
  const clienteId = req.user.id;
  const { nombre, usuario, telefono, direccion_default } = req.body;

  const usuarioClean = usuario ? usuario.trim().replace(/^@/, "").toLowerCase() : null;
  const telefonoClean = telefono ? telefono.trim() : null;

  try {
    // 1. Obtener estado previo
    const previoRes = await pool.query(
      `SELECT id, perfil_completo, puntos_acumulados, usuario FROM clientes WHERE id = $1`,
      [clienteId]
    );

    if (previoRes.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const previo = previoRes.rows[0];

    // Verificar si el nuevo usuario no está en uso por otro
    if (usuarioClean && usuarioClean !== previo.usuario) {
      const enUso = await pool.query(
        `SELECT id FROM clientes WHERE usuario = $1 AND id != $2 LIMIT 1`,
        [usuarioClean, clienteId]
      );
      if (enUso.rows.length > 0) {
        return res.status(400).json({ error: "El nombre de usuario ya está en uso." });
      }
    }

    // Regla de fidelidad: Si aún no tenía perfil completo y ahora carga usuario + teléfono -> +50 puntos!
    const completaAhora = !previo.perfil_completo && Boolean(usuarioClean && telefonoClean);
    const puntosBonus = completaAhora ? 50 : 0;
    const nuevoEstadoCompleto = previo.perfil_completo || completaAhora;

    const result = await pool.query(
      `UPDATE clientes
       SET nombre = COALESCE($1, nombre),
           usuario = COALESCE($2, usuario),
           telefono = COALESCE($3, telefono),
           direccion_default = COALESCE($4, direccion_default),
           puntos_acumulados = puntos_acumulados + $5,
           perfil_completo = $6,
           actualizado_en = NOW()
       WHERE id = $7
       RETURNING id, nombre, email, telefono, usuario, direccion_default, puntos_acumulados, perfil_completo, avatar_url`,
      [
        nombre ? nombre.trim() : null,
        usuarioClean,
        telefonoClean,
        direccion_default ? direccion_default.trim() : null,
        puntosBonus,
        nuevoEstadoCompleto,
        clienteId,
      ]
    );

    res.json({
      success: true,
      message: completaAhora
        ? "¡Perfil completado con éxito! Sumaste 50 puntos de regalo a tu cuenta."
        : "Perfil actualizado correctamente.",
      puntosGanados: puntosBonus,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ error: "Error al actualizar los datos del perfil." });
  }
};

/**
 * PUT /clientes/password
 * Actualiza la contraseña del cliente validando la contraseña actual
 */
const updatePassword = async (req, res) => {
  const clienteId = req.user.id;
  const { password_actual, password_nueva } = req.body;

  if (!password_nueva || password_nueva.length < 6) {
    return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres." });
  }

  try {
    const clienteRes = await pool.query(
      `SELECT id, password FROM clientes WHERE id = $1`,
      [clienteId]
    );

    if (clienteRes.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const cliente = clienteRes.rows[0];

    // Si ya tenía contraseña previa, validar que coincida la actual
    if (cliente.password) {
      if (!password_actual) {
        return res.status(400).json({ error: "Debes ingresar tu contraseña actual." });
      }
      const esValida = verifyPassword(password_actual, cliente.password);
      if (!esValida) {
        return res.status(400).json({ error: "La contraseña actual es incorrecta." });
      }
    }

    const nuevoHash = hashPassword(password_nueva);

    await pool.query(
      `UPDATE clientes SET password = $1, actualizado_en = NOW() WHERE id = $2`,
      [nuevoHash, clienteId]
    );

    res.json({
      success: true,
      message: "Contraseña actualizada exitosamente.",
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ error: "Error al actualizar contraseña." });
  }
};

/**
 * GET /clientes/pedidos
 * Obtiene el historial de pedidos del cliente autenticado
 */
const getHistorialPedidos = async (req, res) => {
  const clienteId = req.user.id;

  try {
    const pedidosRes = await pool.query(
      `SELECT 
         p.id,
         p.sucursal_id,
         p.canal,
         p.tipo_entrega,
         p.fecha_entrega_programada,
         p.estado_local,
         p.medio_pago,
         p.pago_confirmado,
         p.monto_total_estimado,
         p.monto_total_final,
         p.direccion_entrega,
         p.notas,
         p.creado_en,
         s.nombre AS sucursal_nombre,
         s.direccion AS sucursal_direccion,
         s.ciudad AS sucursal_ciudad
       FROM pedidos p
       JOIN sucursales s ON p.sucursal_id = s.id
       WHERE p.cliente_id = $1
       ORDER BY p.creado_en DESC`,
      [clienteId]
    );

    const pedidos = pedidosRes.rows;

    if (pedidos.length > 0) {
      const pedidoIds = pedidos.map((p) => p.id);
      const itemsRes = await pool.query(
        `SELECT 
           pi.*,
           cat.nombre_producto,
           cat.imagen_url,
           cat.unidad_medida,
           cat.especie
         FROM pedido_items pi
         JOIN catalogo cat ON pi.catalogo_id = cat.id
         WHERE pi.pedido_id = ANY($1::int[])`,
        [pedidoIds]
      );

      const itemsPorPedido = {};
      itemsRes.rows.forEach((item) => {
        if (!itemsPorPedido[item.pedido_id]) itemsPorPedido[item.pedido_id] = [];
        itemsPorPedido[item.pedido_id].push(item);
      });

      pedidos.forEach((p) => {
        p.items = itemsPorPedido[p.id] || [];
      });
    }

    res.json(pedidos);
  } catch (error) {
    console.error("Error al obtener historial de pedidos:", error);
    res.status(500).json({ error: "Error al consultar historial de compras." });
  }
};

/**
 * GET /clientes/puntos/historial
 * Devuelve los últimos 30 movimientos de puntos del cliente autenticado
 */
const getHistorialPuntos = async (req, res) => {
  const clienteId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT
         ph.id,
         ph.tipo,
         ph.puntos,
         ph.descripcion,
         ph.pedido_id,
         ph.creado_en
       FROM puntos_historial ph
       WHERE ph.cliente_id = $1
       ORDER BY ph.creado_en DESC
       LIMIT 30`,
      [clienteId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener historial de puntos:", error);
    res.status(500).json({ error: "Error al consultar el historial de puntos." });
  }
};

/**
 * POST /clientes/referido/validar
 * Endpoint público: valida si un código de referido existe y devuelve el nombre del referidor
 */
const validarCodigoReferido = async (req, res) => {
  const { codigo } = req.body;

  if (!codigo || codigo.trim().length < 3) {
    return res.status(400).json({ valido: false, error: "Código inválido." });
  }

  const codigoClean = codigo.trim().toUpperCase();

  try {
    const result = await pool.query(
      `SELECT id, nombre, usuario FROM clientes WHERE referral_code = $1 LIMIT 1`,
      [codigoClean]
    );

    if (result.rows.length === 0) {
      return res.json({ valido: false });
    }

    const referidor = result.rows[0];
    res.json({
      valido: true,
      nombre: referidor.nombre,
      usuario: referidor.usuario,
    });
  } catch (error) {
    console.error("Error al validar código de referido:", error);
    res.status(500).json({ valido: false, error: "Error al validar el código." });
  }
};

module.exports = {
  registroCliente,
  loginCliente,
  googleAuth,
  getPerfil,
  updatePerfil,
  updatePassword,
  getHistorialPedidos,
  getHistorialPuntos,
  validarCodigoReferido,
};
