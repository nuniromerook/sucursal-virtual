require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/db');

async function cleanup() {
  const client = await pool.connect();
  try {
    console.log('🧹 [Limpieza DB] Iniciando limpieza de tablas de prueba...');
    await client.query('BEGIN');

    // 1. Truncar pedidos y sus items
    console.log('-> Limpiando pedidos y pedido_items...');
    await client.query('TRUNCATE TABLE pedido_items, pedidos RESTART IDENTITY CASCADE;');

    // 2. Truncar carritos temporales
    console.log('-> Limpiando carritos y carrito_items...');
    await client.query('TRUNCATE TABLE carrito_items, carritos RESTART IDENTITY CASCADE;');

    // 3. Truncar notificaciones de prueba
    console.log('-> Limpiando notificaciones...');
    await client.query('TRUNCATE TABLE notificaciones RESTART IDENTITY CASCADE;');

    // 4. Truncar metricas de prueba y visitas
    console.log('-> Limpiando metricas de visitas y eventos...');
    await client.query('TRUNCATE TABLE metricas_visitas, metricas_eventos RESTART IDENTITY CASCADE;');

    // 5. Truncar historial de puntos y resetear puntos acumulados en clientes
    console.log('-> Limpiando historial de puntos y reseteando puntos de clientes a 0...');
    await client.query('TRUNCATE TABLE puntos_historial RESTART IDENTITY CASCADE;');
    await client.query('UPDATE clientes SET puntos_acumulados = 0;');

    // 6. Truncar push subscriptions de prueba
    console.log('-> Limpiando suscripciones push...');
    await client.query('TRUNCATE TABLE push_subscriptions RESTART IDENTITY CASCADE;');

    // 7. Eliminar tabla stock_sucursal obsoleta
    console.log('-> Eliminando tabla stock_sucursal...');
    await client.query('DROP TABLE IF EXISTS stock_sucursal CASCADE;');

    await client.query('COMMIT');
    console.log('✨ [Limpieza DB] ¡Base de datos limpiada con exito! Quedo a estrenar.');
    console.log('🔒 Tablas preservadas intactas: catalogo, catalogo_promos, sucursales, clientes, empleados, banners_publicidad, cliente_favoritos.');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ [Limpieza DB] Error durante la limpieza:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

cleanup();
