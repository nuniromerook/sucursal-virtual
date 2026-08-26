// backend/src/controllers/clientes.controller.js
const pool = require("../db");
const {
  hashPassword,
  verifyPassword,
  generateToken,
} = require("../utils/auth");

/**
 * POST /clientes/registro
 * Registro tradicional con email y contraseña
 */
const registroCliente = async (req, res) => {
  const { nombre, email, password, telefono, usuario } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({
      error: "Nombre, email y contraseña son obligatorios.",
    });
  }

  const emailClean = email.trim().toLowerCase();
  const usuarioClean = usuario ? usuario.trim().replace(/^@/, "").toLowerCase() : null;
  const telefonoClean = telefono ? telefono.trim() : "";

  try {
    // 1. Verificar si ya existe por email o usuario
    const existente = await pool.query(
      `SELECT id, email, usuario FROM clientes WHERE email = $1 OR (usuario IS NOT NULL AND usuario = $2) LIMIT 1`,
      [emailClean, usuarioClean || ""]
    );

    if (existente.rows.length > 0) {
      const match = existente.rows[0];
      if (match.email === emailClean) {
        return res.status(400).json({ error: "El correo electrónico ya se encuentra registrado." });
      }
      if (usuarioClean && match.usuario === usuarioClean) {
        return res.status(400).json({ error: "El nombre de usuario ya está en uso." });
      }
    }

    const hashedPassword = hashPassword(password);
    const perfilCompleto = Boolean(usuarioClean && telefonoClean);
    const puntosIniciales = perfilCompleto ? 50 : 0;

    // 2. Insertar cliente
    const result = await pool.query(
      `INSERT INTO clientes (
         nombre, email, password, telefono, usuario, puntos_acumulados, perfil_completo
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nombre, email, telefono, usuario, puntos_acumulados, perfil_completo, creado_en`,
      [
        nombre.trim(),
        emailClean,
        hashedPassword,
        telefonoClean,
        usuarioClean,
        puntosIniciales,
        perfilCompleto,
      ]
    );

    const nuevoCliente = result.rows[0];
    const token = generateToken({
      id: nuevoCliente.id,
      email: nuevoCliente.email,
      nombre: nuevoCliente.nombre,
    });

    res.status(201).json({
      success: true,
      message: perfilCompleto
        ? "¡Registro exitoso! Ganaste 50 puntos de bienvenida."
        : "¡Registro exitoso!",
      token,
      user: nuevoCliente,
    });
  } catch (error) {
    console.error("Error al registrar cliente:", error);
    res.status(500).json({ error: "Error interno al procesar el registro." });
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
      `SELECT id, nombre, email, password, telefono, usuario, direccion_default, puntos_acumulados, perfil_completo, avatar_url
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
      `SELECT id, nombre, email, telefono, usuario, direccion_default, puntos_acumulados, perfil_completo, avatar_url
       FROM clientes
       WHERE (google_id IS NOT NULL AND google_id = $1) OR email = $2
       LIMIT 1`,
      [google_id || "", emailClean]
    );

    let cliente;

    if (clienteRes.rows.length > 0) {
      cliente = clienteRes.rows[0];
      // Actualizar google_id y avatar si no los tenía
      await pool.query(
        `UPDATE clientes 
         SET google_id = COALESCE(google_id, $1),
             avatar_url = COALESCE(avatar_url, $2),
             actualizado_en = NOW()
         WHERE id = $3`,
        [google_id || null, avatar_url || null, cliente.id]
      );
    } else {
      // Alta rápida nuevo usuario Google
      const insertRes = await pool.query(
        `INSERT INTO clientes (
           nombre, email, google_id, avatar_url, telefono, puntos_acumulados, perfil_completo
         ) VALUES ($1, $2, $3, $4, '', 0, false)
         RETURNING id, nombre, email, telefono, usuario, direccion_default, puntos_acumulados, perfil_completo, avatar_url`,
        [nombre || "Usuario Valette", emailClean, google_id || null, avatar_url || null]
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
      `SELECT id, nombre, email, telefono, usuario, direccion_default, puntos_acumulados, perfil_completo, avatar_url, creado_en
       FROM clientes
       WHERE id = $1`,
      [clienteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    res.json(result.rows[0]);
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

module.exports = {
  registroCliente,
  loginCliente,
  googleAuth,
  getPerfil,
  updatePerfil,
  getHistorialPedidos,
};
