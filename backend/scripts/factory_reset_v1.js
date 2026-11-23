// backend/scripts/factory_reset_v1.js
// Restablecimiento de fábrica de datos operativos y métricas para el lanzamiento de Sucursal Virtual v1.0.
// CONSERVA INTACTOS: sucursales, catalogo, catalogo_promos, combos, combo_items, banners_publicidad (con impresiones/clics en 0).
// BORRA Y REINICIA A 0: push_subscriptions, notificaciones, pedido_items, pedidos, carrito_items, carritos,
//                       cliente_favoritos, puntos_historial, clientes, metricas_eventos, metricas_visitas,
//                       banner_vistas_dispositivos, empleados.

const pool = require("../src/db");

const TABLES_TO_TRUNCATE = [
  "push_subscriptions",
  "notificaciones",
  "pedido_items",
  "pedidos",
  "carrito_items",
  "carritos",
  "cliente_favoritos",
  "puntos_historial",
  "clientes",
  "metricas_eventos",
  "metricas_visitas",
  "banner_vistas_dispositivos",
  "empleados",
];

const TABLES_TO_PRESERVE = [
  "sucursales",
  "catalogo",
  "catalogo_promos",
  "combos",
  "combo_items",
  "banners_publicidad",
];

async function runFactoryReset() {
  const client = await pool.connect();
  try {
    console.log("🧹 Iniciando Restablecimiento de Fábrica (Factory Reset v1.0)...");
    await client.query("BEGIN");

    // 1. Detectar cuáles de las tablas a truncar existen en el esquema actual
    const { rows: existingRows } = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    );
    const existingSet = new Set(existingRows.map((r) => r.tablename));

    const presentToTruncate = TABLES_TO_TRUNCATE.filter((t) =>
      existingSet.has(t)
    );

    if (presentToTruncate.length > 0) {
      const truncateSql = `TRUNCATE TABLE ${presentToTruncate.join(", ")} RESTART IDENTITY CASCADE;`;
      await client.query(truncateSql);
      console.log(
        `✅ Tablas operativas vaciadas y secuencias reiniciadas a 1:\n   - ${presentToTruncate.join("\n   - ")}`
      );
    }

    // 2. Reiniciar contadores de vistas y clics en banners_publicidad sin borrar los banners
    if (existingSet.has("banners_publicidad")) {
      await client.query(
        `UPDATE banners_publicidad SET impresiones = 0, clics = 0;`
      );
      console.log(
        "✅ Contadores de impresiones y clics en 'banners_publicidad' restablecidos a 0."
      );
    }

    await client.query("COMMIT");

    // 3. Reporte de verificación post-reset
    console.log("\n📊 Estado final de las tablas conservadas:");
    for (const table of TABLES_TO_PRESERVE) {
      if (existingSet.has(table)) {
        const { rows } = await client.query(`SELECT COUNT(*)::int AS cnt FROM ${table}`);
        console.log(`   ✔ ${table}: ${rows[0].cnt} registros conservados`);
      }
    }

    console.log("\n📊 Verificación de tablas operativas (en 0):");
    for (const table of presentToTruncate) {
      const { rows } = await client.query(`SELECT COUNT(*)::int AS cnt FROM ${table}`);
      console.log(`   ✔ ${table}: ${rows[0].cnt} registros`);
    }

    console.log("\n✨ Restablecimiento de fábrica completado con éxito.");
    process.exit(0);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error durante el restablecimiento de fábrica:", error);
    process.exit(1);
  } finally {
    client.release();
  }
}

runFactoryReset();
