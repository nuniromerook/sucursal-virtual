// backend/src/controllers/clientes.controller.js
const pool = require("../db");
const {
  hashPassword,
  verifyPassword,
  generateToken,
} = require("../utils/auth");
const { emitirNotificacion } = require("../socket");

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
      tipo: "cliente",
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
      tipo: "cliente",
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
      tipo: "cliente",
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
         c.latitud, c.longitud,
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
  const { nombre, usuario, telefono, direccion_default, latitud, longitud, avatar_url } = req.body;

  const usuarioClean = usuario ? usuario.trim().replace(/^@/, "").toLowerCase() : null;
  const telefonoClean = telefono ? telefono.trim() : null;
  const shouldUpdateAvatar = avatar_url !== undefined;
  let avatarClean = null;
  if (shouldUpdateAvatar && avatar_url !== null && String(avatar_url).trim() !== "") {
    const rawAvatar = String(avatar_url).trim();
    if (!/^https?:\/\//i.test(rawAvatar)) {
      return res.status(400).json({ error: "La URL de la foto de perfil no es válida." });
    }
    avatarClean = rawAvatar;
  }

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
           latitud = COALESCE($7, latitud),
           longitud = COALESCE($8, longitud),
           avatar_url = CASE WHEN $9::boolean THEN $10 ELSE avatar_url END,
           actualizado_en = NOW()
       WHERE id = $11
       RETURNING id, nombre, email, telefono, usuario, direccion_default, puntos_acumulados, perfil_completo, avatar_url, referral_code, latitud, longitud`,
      [
        nombre ? nombre.trim() : null,
        usuarioClean,
        telefonoClean,
        direccion_default ? direccion_default.trim() : null,
        puntosBonus,
        nuevoEstadoCompleto,
        latitud !== undefined ? latitud : null,
        longitud !== undefined ? longitud : null,
        shouldUpdateAvatar,
        avatarClean,
        clienteId,
      ]
    );

    if (completaAhora && puntosBonus > 0) {
      await pool
        .query(
          `INSERT INTO puntos_historial (cliente_id, tipo, puntos, descripcion)
           VALUES ($1, 'bienvenida', $2, 'Bono por completar datos de usuario y WhatsApp')`,
          [clienteId, puntosBonus]
        )
        .catch(() => {});
    }

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
    res.status(500).json({ error: "Error al validar el código." });
  }
};

/**
 * POST /clientes/solicitar-recuperacion
 * Envía un correo con el token de recuperación usando Resend
 */
const solicitarRecuperacionPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Debe ingresar su correo electrónico." });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const result = await pool.query(
      `SELECT id, nombre, email, password FROM clientes WHERE LOWER(email) = $1 LIMIT 1`,
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      // Por seguridad para evitar enumeración de correos, devolvemos éxito incluso si no existe
      return res.json({
        success: true,
        message: "Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.",
      });
    }

    const cliente = result.rows[0];

    if (!cliente.password) {
      return res.status(400).json({
        error: "Esta cuenta fue registrada con Google. Podés ingresar directamente con el botón de Google.",
      });
    }

    // Generar token aleatorio seguro
    const crypto = require("crypto");
    const token = crypto.randomBytes(32).toString("hex");

    // Guardar token con expiración de 15 minutos en PostgreSQL
    await pool.query(
      `UPDATE clientes 
       SET reset_token = $1, reset_token_expires = NOW() + INTERVAL '15 minutes' 
       WHERE id = $2`,
      [token, cliente.id]
    );

    // Determinar la URL del frontend (origen de la petición o variable de entorno)
    const origin = req.headers.origin || req.headers.referer;
    let baseUrl = origin ? origin.replace(/\/$/, "") : "";
    if (!baseUrl || baseUrl.includes("render.com") || baseUrl.includes("vercel.app")) {
      baseUrl = process.env.FRONTEND_URL || "https://abastecedoravalette.digital";
    }

    const resetUrl = `${baseUrl}/restablecer-password?token=${token}`;

    const { enviarEmailRecuperacion } = require("../services/email.service");
    await enviarEmailRecuperacion({
      to: cliente.email,
      nombre: cliente.nombre,
      resetUrl,
    });

    res.json({
      success: true,
      message: "¡Listo! Te enviamos un correo con el enlace para restablecer tu contraseña.",
    });
  } catch (error) {
    console.error("Error al solicitar recuperación de contraseña:", error);
    res.status(500).json({ error: error.message || "Error al procesar la solicitud de recuperación." });
  }
};

/**
 * POST /clientes/restablecer-password
 * Valida el token y actualiza la contraseña del cliente
 */
const restablecerPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "El token y la nueva contraseña son obligatorios." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
  }

  try {
    const result = await pool.query(
      `SELECT id, nombre, email, usuario, telefono, avatar_url, puntos_acumulados, referral_code
       FROM clientes
       WHERE reset_token = $1 AND reset_token_expires > NOW()
       LIMIT 1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: "El enlace de recuperación es inválido o ya expiró. Por favor solicitá uno nuevo.",
      });
    }

    const cliente = result.rows[0];
    const newHash = hashPassword(newPassword);

    // Actualizar contraseña y limpiar el token
    await pool.query(
      `UPDATE clientes 
       SET password = $1, reset_token = NULL, reset_token_expires = NULL 
       WHERE id = $2`,
      [newHash, cliente.id]
    );

    const jwtToken = generateToken({
      id: cliente.id,
      tipo: "cliente",
      email: cliente.email,
      nombre: cliente.nombre,
    });

    res.json({
      success: true,
      message: "¡Tu contraseña fue restablecida con éxito!",
      token: jwtToken,
      user: cliente,
    });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    res.status(500).json({ error: "Error interno al restablecer la contraseña." });
  }
};

/**
 * GET /clientes/favoritos
 * Obtiene los IDs de catálogo favoritos del cliente autenticado
 */
const getFavoritos = async (req, res) => {
  const clienteId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT f.catalogo_id
       FROM cliente_favoritos f
       JOIN catalogo c ON c.id = f.catalogo_id
       WHERE f.cliente_id = $1 AND c.activo = true
       ORDER BY f.creado_en DESC`,
      [clienteId]
    );
    res.json({
      favoritos: result.rows.map((r) => Number(r.catalogo_id)),
    });
  } catch (error) {
    console.error("Error al obtener favoritos:", error.message);
    res.status(500).json({ error: "Error al obtener favoritos." });
  }
};

/**
 * POST /clientes/favoritos/sincronizar
 * Fusiona los favoritos locales con los almacenados en PostgreSQL
 */
const sincronizarFavoritos = async (req, res) => {
  const clienteId = req.user.id;
  const localFavs = Array.isArray(req.body.favoritos)
    ? req.body.favoritos.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
    : [];

  try {
    if (localFavs.length > 0) {
      await pool.query(
        `INSERT INTO cliente_favoritos (cliente_id, catalogo_id)
         SELECT $1, c.id
         FROM catalogo c
         WHERE c.id = ANY($2::int[]) AND c.activo = true
         ON CONFLICT (cliente_id, catalogo_id) DO NOTHING`,
        [clienteId, localFavs]
      );
    }

    const result = await pool.query(
      `SELECT f.catalogo_id
       FROM cliente_favoritos f
       JOIN catalogo c ON c.id = f.catalogo_id
       WHERE f.cliente_id = $1 AND c.activo = true
       ORDER BY f.creado_en DESC`,
      [clienteId]
    );

    res.json({
      favoritos: result.rows.map((r) => Number(r.catalogo_id)),
    });
  } catch (error) {
    console.error("Error al sincronizar favoritos:", error.message);
    res.status(500).json({ error: "Error al sincronizar favoritos." });
  }
};

/**
 * POST /clientes/favoritos/toggle
 * Agrega o quita un corte de favoritos en PostgreSQL
 */
const toggleFavorito = async (req, res) => {
  const clienteId = req.user.id;
  const catalogoId = Number(req.body.catalogo_id || req.body.id);

  if (!Number.isFinite(catalogoId) || catalogoId <= 0) {
    return res.status(400).json({ error: "ID de producto inválido." });
  }

  try {
    const existing = await pool.query(
      `SELECT id FROM cliente_favoritos WHERE cliente_id = $1 AND catalogo_id = $2 LIMIT 1`,
      [clienteId, catalogoId]
    );

    let favorito = false;
    if (existing.rows.length > 0) {
      await pool.query(
        `DELETE FROM cliente_favoritos WHERE cliente_id = $1 AND catalogo_id = $2`,
        [clienteId, catalogoId]
      );
      favorito = false;
    } else {
      await pool.query(
        `INSERT INTO cliente_favoritos (cliente_id, catalogo_id)
         SELECT $1, c.id FROM catalogo c WHERE c.id = $2
         ON CONFLICT (cliente_id, catalogo_id) DO NOTHING`,
        [clienteId, catalogoId]
      );
      favorito = true;
    }

    const listRes = await pool.query(
      `SELECT catalogo_id FROM cliente_favoritos WHERE cliente_id = $1 ORDER BY creado_en DESC`,
      [clienteId]
    );

    res.json({
      ok: true,
      favorito,
      favoritos: listRes.rows.map((r) => Number(r.catalogo_id)),
    });
  } catch (error) {
    console.error("Error en toggleFavorito:", error.message);
    res.status(500).json({ error: "Error al actualizar favorito." });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CLUB VALETTE — RECOMPENSAS ESTRATÉGICAS, CANJES Y GESTIÓN DE CLIENTES (ADMIN)
// ═══════════════════════════════════════════════════════════════════════════════

const getRecompensas = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, titulo, descripcion, tipo, puntos_requeridos, stock_disponible, imagen_url, activo, orden
       FROM recompensas_club
       WHERE activo = true
       ORDER BY orden ASC, puntos_requeridos ASC, id ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error getRecompensas:", error.message);
    res.status(500).json({ error: "Error al obtener recompensas del Club Valette." });
  }
};

const getRecompensasAdmin = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
              COALESCE((SELECT COUNT(*)::int FROM canjes_club cc WHERE cc.recompensa_id = r.id), 0) AS total_canjes
       FROM recompensas_club r
       ORDER BY r.orden ASC, r.puntos_requeridos ASC, r.id ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error getRecompensasAdmin:", error.message);
    res.status(500).json({ error: "Error al obtener recompensas." });
  }
};

const createRecompensa = async (req, res) => {
  const {
    titulo,
    descripcion = "",
    tipo = "producto",
    puntos_requeridos,
    stock_disponible = null,
    imagen_url = null,
    activo = true,
    orden = 0,
  } = req.body;

  if (!titulo || !puntos_requeridos || Number(puntos_requeridos) <= 0) {
    return res.status(400).json({ error: "Título y puntos requeridos (>0) son obligatorios." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO recompensas_club (titulo, descripcion, tipo, puntos_requeridos, stock_disponible, imagen_url, activo, orden)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        titulo.trim(),
        descripcion.trim(),
        String(tipo).trim().toLowerCase(),
        Math.round(Number(puntos_requeridos)),
        stock_disponible === "" || stock_disponible === null ? null : Math.max(0, Number(stock_disponible)),
        imagen_url || null,
        Boolean(activo),
        Number(orden) || 0,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error createRecompensa:", error.message);
    res.status(500).json({ error: "Error al crear recompensa." });
  }
};

const updateRecompensa = async (req, res) => {
  const { id } = req.params;
  const {
    titulo,
    descripcion,
    tipo,
    puntos_requeridos,
    stock_disponible,
    imagen_url,
    activo,
    orden,
  } = req.body;

  try {
    const hasStockField = stock_disponible !== undefined;
    const parsedStock =
      stock_disponible === "" || stock_disponible === null
        ? null
        : Math.max(0, Number(stock_disponible));

    const result = await pool.query(
      `UPDATE recompensas_club
       SET titulo = COALESCE($1, titulo),
           descripcion = COALESCE($2, descripcion),
           tipo = COALESCE($3, tipo),
           puntos_requeridos = COALESCE($4, puntos_requeridos),
           stock_disponible = CASE WHEN $5::boolean THEN $6::int ELSE stock_disponible END,
           imagen_url = COALESCE($7, imagen_url),
           activo = COALESCE($8, activo),
           orden = COALESCE($9, orden),
           actualizado_en = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        titulo !== undefined ? titulo.trim() : null,
        descripcion !== undefined ? descripcion.trim() : null,
        tipo !== undefined ? String(tipo).trim().toLowerCase() : null,
        puntos_requeridos !== undefined ? Math.round(Number(puntos_requeridos)) : null,
        hasStockField,
        hasStockField ? parsedStock : null,
        imagen_url !== undefined ? imagen_url : null,
        activo !== undefined ? Boolean(activo) : null,
        orden !== undefined ? Number(orden) : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Recompensa no encontrada." });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updateRecompensa:", error.message);
    res.status(500).json({ error: "Error al actualizar recompensa." });
  }
};

const deleteRecompensa = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM recompensas_club WHERE id = $1 RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Recompensa no encontrada." });
    }
    res.json({ success: true, message: "Recompensa eliminada." });
  } catch (error) {
    console.error("Error deleteRecompensa:", error.message);
    res.status(500).json({ error: "Error al eliminar recompensa." });
  }
};

const getMisCanjes = async (req, res) => {
  const clienteId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT id, recompensa_id, titulo_recompensa, tipo_recompensa, puntos_gastados, codigo_canje, estado, notas, creado_en, actualizado_en
       FROM canjes_club
       WHERE cliente_id = $1
       ORDER BY creado_en DESC
       LIMIT 40`,
      [clienteId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error getMisCanjes:", error.message);
    res.status(500).json({ error: "Error al consultar tus canjes." });
  }
};

const canjearRecompensa = async (req, res) => {
  const clienteId = req.user.id;
  const recompensaId = Number(req.body.recompensa_id);
  const notas = req.body.notas ? String(req.body.notas).trim() : null;

  if (!Number.isFinite(recompensaId) || recompensaId <= 0) {
    return res.status(400).json({ error: "Recompensa inválida." });
  }

  const dbClient = await pool.connect();
  try {
    await dbClient.query("BEGIN");

    const rewRes = await dbClient.query(
      `SELECT * FROM recompensas_club WHERE id = $1 FOR UPDATE`,
      [recompensaId]
    );
    if (rewRes.rows.length === 0 || !rewRes.rows[0].activo) {
      await dbClient.query("ROLLBACK");
      return res.status(404).json({ error: "Esta recompensa ya no está disponible." });
    }

    const rew = rewRes.rows[0];
    if (rew.stock_disponible !== null && Number(rew.stock_disponible) <= 0) {
      await dbClient.query("ROLLBACK");
      return res.status(400).json({ error: "Se agotó el stock de esta recompensa." });
    }

    const cliRes = await dbClient.query(
      `SELECT id, nombre, puntos_acumulados FROM clientes WHERE id = $1 FOR UPDATE`,
      [clienteId]
    );
    if (cliRes.rows.length === 0) {
      await dbClient.query("ROLLBACK");
      return res.status(404).json({ error: "Cliente no encontrado." });
    }

    const cliente = cliRes.rows[0];
    const saldoActual = Number(cliente.puntos_acumulados) || 0;
    const costoPuntos = Number(rew.puntos_requeridos) || 0;

    if (saldoActual < costoPuntos) {
      await dbClient.query("ROLLBACK");
      return res.status(400).json({
        error: `Te faltan ${costoPuntos - saldoActual} puntos para canjear "${rew.titulo}".`,
      });
    }

    const nuevoSaldo = saldoActual - costoPuntos;
    await dbClient.query(
      `UPDATE clientes SET puntos_acumulados = $1, actualizado_en = NOW() WHERE id = $2`,
      [nuevoSaldo, clienteId]
    );

    if (rew.stock_disponible !== null) {
      await dbClient.query(
        `UPDATE recompensas_club SET stock_disponible = stock_disponible - 1, actualizado_en = NOW() WHERE id = $1`,
        [recompensaId]
      );
    }

    const codigoCanje = `VAL-${crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 5)}`;

    const canjeRes = await dbClient.query(
      `INSERT INTO canjes_club (cliente_id, recompensa_id, titulo_recompensa, tipo_recompensa, puntos_gastados, codigo_canje, estado, notas)
       VALUES ($1, $2, $3, $4, $5, $6, 'pendiente', $7)
       RETURNING *`,
      [clienteId, rew.id, rew.titulo, rew.tipo, costoPuntos, codigoCanje, notas]
    );

    await dbClient.query(
      `INSERT INTO puntos_historial (cliente_id, tipo, puntos, descripcion)
       VALUES ($1, 'canje', $2, $3)`,
      [clienteId, -costoPuntos, `Canje Club Valette: ${rew.titulo} (${codigoCanje})`]
    );

    await dbClient.query("COMMIT");

    const canjeCreado = canjeRes.rows[0];

    try {
      const notifRes = await pool.query(
        `INSERT INTO notificaciones (cliente_id, titulo, mensaje, tipo, icono, enlace)
         VALUES ($1, $2, $3, 'puntos', 'sparkles', '/perfil?tab=puntos')
         RETURNING *`,
        [
          clienteId,
          `¡Canje confirmado: ${rew.titulo}!`,
          `Presentá tu código ${codigoCanje} en mostrador o en las notas de tu próximo pedido.`,
        ]
      );
      if (notifRes.rows[0]) emitirNotificacion(notifRes.rows[0]);
    } catch {
      // Non-blocking
    }

    res.status(201).json({
      success: true,
      message: `¡Canje realizado! Tu código es ${codigoCanje}`,
      canje: canjeCreado,
      puntos_restantes: nuevoSaldo,
    });
  } catch (error) {
    await dbClient.query("ROLLBACK").catch(() => {});
    console.error("Error canjearRecompensa:", error.message);
    res.status(500).json({ error: "No se pudo procesar el canje." });
  } finally {
    dbClient.release();
  }
};

const getClientesAdmin = async (req, res) => {
  const q = req.query.q ? `%${String(req.query.q).trim().toLowerCase()}%` : null;
  try {
    const params = [];
    let where = "";
    if (q) {
      params.push(q);
      where = `WHERE LOWER(COALESCE(c.nombre, '')) LIKE $1
                  OR LOWER(COALESCE(c.email, '')) LIKE $1
                  OR LOWER(COALESCE(c.usuario, '')) LIKE $1
                  OR LOWER(COALESCE(c.telefono, '')) LIKE $1`;
    }

    const result = await pool.query(
      `SELECT
         c.id, c.nombre, c.email, c.telefono, c.usuario, c.avatar_url,
         c.puntos_acumulados, c.referral_code, c.perfil_completo, c.creado_en,
         COALESCE((SELECT COUNT(*)::int FROM pedidos p WHERE p.cliente_id = c.id AND p.estado_local != 'cancelado'), 0) AS pedidos_count,
         COALESCE((SELECT SUM(COALESCE(p.monto_total_final, p.monto_total_estimado, 0))::numeric(12,2) FROM pedidos p WHERE p.cliente_id = c.id AND p.estado_local != 'cancelado'), 0) AS total_gastado,
         COALESCE((SELECT COUNT(*)::int FROM canjes_club cc WHERE cc.cliente_id = c.id), 0) AS canjes_count
       FROM clientes c
       ${where}
       ORDER BY c.puntos_acumulados DESC, c.creado_en DESC
       LIMIT 200`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error getClientesAdmin:", error.message);
    res.status(500).json({ error: "Error al listar clientes." });
  }
};

const ajustarPuntosClienteAdmin = async (req, res) => {
  const clienteId = Number(req.params.id);
  const delta = Math.round(Number(req.body.puntos));
  const descripcion = String(req.body.descripcion || "").trim();

  if (!Number.isFinite(clienteId) || clienteId <= 0) {
    return res.status(400).json({ error: "Cliente inválido." });
  }
  if (!Number.isFinite(delta) || delta === 0) {
    return res.status(400).json({ error: "Ingresá una cantidad de puntos distinta de 0." });
  }
  if (!descripcion) {
    return res.status(400).json({ error: "Ingresá un motivo para el ajuste de puntos." });
  }

  const dbClient = await pool.connect();
  try {
    await dbClient.query("BEGIN");

    const cliRes = await dbClient.query(
      `SELECT id, nombre, puntos_acumulados FROM clientes WHERE id = $1 FOR UPDATE`,
      [clienteId]
    );
    if (cliRes.rows.length === 0) {
      await dbClient.query("ROLLBACK");
      return res.status(404).json({ error: "Cliente no encontrado." });
    }

    const saldoPrevio = Number(cliRes.rows[0].puntos_acumulados) || 0;
    const nuevoSaldo = Math.max(0, saldoPrevio + delta);

    await dbClient.query(
      `UPDATE clientes SET puntos_acumulados = $1, actualizado_en = NOW() WHERE id = $2`,
      [nuevoSaldo, clienteId]
    );

    await dbClient.query(
      `INSERT INTO puntos_historial (cliente_id, tipo, puntos, descripcion)
       VALUES ($1, 'ajuste_admin', $2, $3)`,
      [clienteId, delta, descripcion]
    );

    await dbClient.query("COMMIT");

    try {
      const notifRes = await pool.query(
        `INSERT INTO notificaciones (cliente_id, titulo, mensaje, tipo, icono, enlace)
         VALUES ($1, $2, $3, 'puntos', 'sparkles', '/perfil?tab=puntos')
         RETURNING *`,
        [
          clienteId,
          delta > 0 ? `¡Sumaste ${delta} Puntos Valette!` : `Ajuste de ${delta} Puntos Valette`,
          descripcion,
        ]
      );
      if (notifRes.rows[0]) emitirNotificacion(notifRes.rows[0]);
    } catch {
      // Non-blocking
    }

    res.json({
      success: true,
      cliente_id: clienteId,
      puntos_acumulados: nuevoSaldo,
      message: "Saldo de puntos actualizado correctamente.",
    });
  } catch (error) {
    await dbClient.query("ROLLBACK").catch(() => {});
    console.error("Error ajustarPuntosClienteAdmin:", error.message);
    res.status(500).json({ error: "Error al ajustar puntos del cliente." });
  } finally {
    dbClient.release();
  }
};

const getCanjesAdmin = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT cc.*, c.nombre AS cliente_nombre, c.email AS cliente_email, c.telefono AS cliente_telefono, c.usuario AS cliente_usuario
       FROM canjes_club cc
       JOIN clientes c ON c.id = cc.cliente_id
       ORDER BY CASE WHEN cc.estado = 'pendiente' THEN 0 ELSE 1 END, cc.creado_en DESC
       LIMIT 200`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error getCanjesAdmin:", error.message);
    res.status(500).json({ error: "Error al consultar los canjes." });
  }
};

const actualizarEstadoCanjeAdmin = async (req, res) => {
  const canjeId = Number(req.params.id);
  const nuevoEstado = String(req.body.estado || "").trim().toLowerCase();
  const notas = req.body.notas ? String(req.body.notas).trim() : null;

  if (!["pendiente", "entregado", "cancelado"].includes(nuevoEstado)) {
    return res.status(400).json({ error: "Estado inválido. Use pendiente, entregado o cancelado." });
  }

  const dbClient = await pool.connect();
  try {
    await dbClient.query("BEGIN");

    const curRes = await dbClient.query(
      `SELECT * FROM canjes_club WHERE id = $1 FOR UPDATE`,
      [canjeId]
    );
    if (curRes.rows.length === 0) {
      await dbClient.query("ROLLBACK");
      return res.status(404).json({ error: "Canje no encontrado." });
    }

    const canje = curRes.rows[0];
    const reembolsar = canje.estado === "pendiente" && nuevoEstado === "cancelado";

    const updRes = await dbClient.query(
      `UPDATE canjes_club
       SET estado = $1, notas = COALESCE($2, notas), actualizado_en = NOW()
       WHERE id = $3
       RETURNING *`,
      [nuevoEstado, notas, canjeId]
    );

    if (reembolsar) {
      await dbClient.query(
        `UPDATE clientes SET puntos_acumulados = puntos_acumulados + $1, actualizado_en = NOW() WHERE id = $2`,
        [canje.puntos_gastados, canje.cliente_id]
      );
      if (canje.recompensa_id) {
        await dbClient.query(
          `UPDATE recompensas_club
           SET stock_disponible = CASE WHEN stock_disponible IS NOT NULL THEN stock_disponible + 1 ELSE NULL END
           WHERE id = $1`,
          [canje.recompensa_id]
        );
      }
      await dbClient.query(
        `INSERT INTO puntos_historial (cliente_id, tipo, puntos, descripcion)
         VALUES ($1, 'reembolso_canje', $2, $3)`,
        [
          canje.cliente_id,
          canje.puntos_gastados,
          `Reembolso por cancelación del canje ${canje.codigo_canje} (${canje.titulo_recompensa})`,
        ]
      );
    }

    await dbClient.query("COMMIT");

    try {
      const notifRes = await pool.query(
        `INSERT INTO notificaciones (cliente_id, titulo, mensaje, tipo, icono, enlace)
         VALUES ($1, $2, $3, 'puntos', 'sparkles', '/perfil?tab=puntos')
         RETURNING *`,
        [
          canje.cliente_id,
          nuevoEstado === "entregado"
            ? `¡Beneficio entregado: ${canje.titulo_recompensa}!`
            : `Canje ${canje.codigo_canje} actualizado (${nuevoEstado})`,
          reembolsar
            ? `Te devolvimos ${canje.puntos_gastados} puntos a tu cuenta de Club Valette.`
            : `Tu código ${canje.codigo_canje} pasó a estado: ${nuevoEstado}.`,
        ]
      );
      if (notifRes.rows[0]) emitirNotificacion(notifRes.rows[0]);
    } catch {
      // Non-blocking
    }

    res.json({ success: true, canje: updRes.rows[0], reembolsado: reembolsar });
  } catch (error) {
    await dbClient.query("ROLLBACK").catch(() => {});
    console.error("Error actualizarEstadoCanjeAdmin:", error.message);
    res.status(500).json({ error: "Error al actualizar estado del canje." });
  } finally {
    dbClient.release();
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
  solicitarRecuperacionPassword,
  restablecerPassword,
  getFavoritos,
  sincronizarFavoritos,
  toggleFavorito,
  getRecompensas,
  getRecompensasAdmin,
  createRecompensa,
  updateRecompensa,
  deleteRecompensa,
  getMisCanjes,
  canjearRecompensa,
  getClientesAdmin,
  ajustarPuntosClienteAdmin,
  getCanjesAdmin,
  actualizarEstadoCanjeAdmin,
};

