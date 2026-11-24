// backend/scripts/seed_super_admin.js
// 1. Asegura tablas y columnas finales de v1.0 (pedidos.sesion_id, recompensas_club, canjes_club).
// 2. Crea/actualiza la cuenta Super Admin (rol: propietario) para operar admin.abastecedoravalette.digital.
// 3. Inserta 4 recompensas estratégicas iniciales de Club Valette si recompensas_club está vacía.

const pool = require("../src/db");
const { hashPassword } = require("../src/utils/auth");

async function seedProductionBootstrap() {
  try {
    console.log("🚀 Iniciando bootstrap de seguridad, Club Valette y Super Admin...");

    // 1. Columna sesion_id en pedidos para privacidad de seguimiento de invitados
    await pool.query(`
      ALTER TABLE pedidos
        ADD COLUMN IF NOT EXISTS sesion_id VARCHAR(120);
    `);

    // 2. Tablas del catálogo de Recompensas y Canjes de Club Valette
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recompensas_club (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(140) NOT NULL,
        descripcion TEXT DEFAULT '',
        tipo VARCHAR(40) NOT NULL DEFAULT 'producto',
        puntos_requeridos INT NOT NULL DEFAULT 100,
        stock_disponible INT,
        imagen_url TEXT,
        activo BOOLEAN DEFAULT true,
        orden INT DEFAULT 0,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS canjes_club (
        id SERIAL PRIMARY KEY,
        cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
        recompensa_id INT REFERENCES recompensas_club(id) ON DELETE SET NULL,
        titulo_recompensa VARCHAR(140) NOT NULL,
        tipo_recompensa VARCHAR(40) DEFAULT 'producto',
        puntos_gastados INT NOT NULL,
        codigo_canje VARCHAR(30) UNIQUE NOT NULL,
        estado VARCHAR(30) DEFAULT 'pendiente',
        notas TEXT,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Sembrar recompensas estratégicas iniciales si la tabla está vacía
    const { rows: rewCount } = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM recompensas_club`
    );
    if (rewCount[0].cnt === 0) {
      const initialRewards = [
        {
          titulo: "Número para Sorteo Mensual de Asado",
          descripcion:
            "Participás del sorteo mensual por un asado completo para 6 personas. Podés canjear varios números para sumar más chances.",
          tipo: "sorteo",
          puntos_requeridos: 120,
          orden: 1,
        },
        {
          titulo: "Menudencia Fresca de Regalo",
          descripcion:
            "Canjeá tus puntos por una bandeja de menudencia fresca de primera calidad en tu próxima compra o retiro en sucursal.",
          tipo: "producto",
          puntos_requeridos: 180,
          orden: 2,
        },
        {
          titulo: "Envío a Domicilio Gratis",
          descripcion:
            "Bonificación del 100% en el costo de envío refrigerado a domicilio dentro de la zona de cobertura de Luis Guillón.",
          tipo: "envio",
          puntos_requeridos: 250,
          orden: 3,
        },
        {
          titulo: "1 kg de Roast Beef Seleccionado",
          descripcion:
            "Llevate 1 kg de Roast Beef novillito cortado a tu gusto sin cargo presentando tu código de canje en mostrador o pedido online.",
          tipo: "producto",
          puntos_requeridos: 600,
          orden: 4,
        },
      ];

      for (const r of initialRewards) {
        await pool.query(
          `INSERT INTO recompensas_club (titulo, descripcion, tipo, puntos_requeridos, activo, orden)
           VALUES ($1, $2, $3, $4, true, $5)`,
          [r.titulo, r.descripcion, r.tipo, r.puntos_requeridos, r.orden]
        );
      }
      console.log("✅ 4 recompensas estratégicas iniciales de Club Valette creadas.");
    }

    // 4. Crear o actualizar cuenta Super Admin (rol: propietario)
    const adminEmail = (
      process.env.SUPER_ADMIN_EMAIL || "juancnunz.contacto@gmail.com"
    )
      .trim()
      .toLowerCase();
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || "Numeroonce11@";
    const passHash = hashPassword(adminPassword);

    const existing = await pool.query(
      `SELECT id FROM empleados WHERE LOWER(TRIM(COALESCE(email, ''))) = $1 LIMIT 1`,
      [adminEmail]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE empleados
         SET rol = 'propietario',
             activo = true
         WHERE id = $1`,
        [existing.rows[0].id]
      );
      console.log(`✅ Cuenta Propietario verificada (contraseña preservada): ${adminEmail}`);
    } else {
      await pool.query(
        `INSERT INTO empleados (nombre, apodo, rol, email, password, sucursal_id, activo)
         VALUES ('Juan Núñez', 'Juan', 'propietario', $1, $2, 1, true)`,
        [adminEmail, passHash]
      );
      console.log(`✅ Cuenta Propietario creada con éxito: ${adminEmail}`);
    }

    console.log("✨ Bootstrap completado.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error en seed_super_admin:", err);
    process.exit(1);
  }
}

seedProductionBootstrap();
