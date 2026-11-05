require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/db');

async function migrate() {
  try {
    console.log('[Migración] Creando columna horarios_apertura si no existe...');
    await pool.query('ALTER TABLE sucursales ADD COLUMN IF NOT EXISTS horarios_apertura JSONB;');

    const horariosLuisGuillon = {
      lunes: { abierto: true, apertura: '07:00', cierre: '14:30' },
      martes: { abierto: true, apertura: '07:00', cierre: '14:30' },
      miercoles: { abierto: true, apertura: '07:00', cierre: '14:30' },
      jueves: { abierto: true, apertura: '07:00', cierre: '14:30' },
      viernes: { abierto: true, apertura: '07:00', cierre: '14:30' },
      sabado: { abierto: true, apertura: '07:00', cierre: '14:30' },
      domingo: { abierto: false, apertura: '', cierre: '' },
    };

    await pool.query(
      'UPDATE sucursales SET horarios_apertura = $1 WHERE slug = $2 OR id = 1',
      [JSON.stringify(horariosLuisGuillon), 'luis-guillon']
    );

    console.log('[Migración] Creando índices de rendimiento en pedidos y pedido_items...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pedidos_sucursal_estado ON pedidos (sucursal_id, estado_local);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos (cliente_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pedidos_creado ON pedidos (creado_en DESC);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON pedido_items (pedido_id);');

    console.log('[Migración] Creando columnas latitud y longitud en clientes si no existen...');
    await pool.query('ALTER TABLE clientes ADD COLUMN IF NOT EXISTS latitud NUMERIC, ADD COLUMN IF NOT EXISTS longitud NUMERIC;');

    console.log('[Migración] Creando columna banner_id e índice en pedidos si no existe...');
    await pool.query('ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS banner_id INTEGER REFERENCES banners_publicidad(id) ON DELETE SET NULL;');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pedidos_banner_id ON pedidos (banner_id);');

    console.log('[Migración] Creando tabla banner_vistas_dispositivos para alcance único...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS banner_vistas_dispositivos (
        banner_id INTEGER NOT NULL REFERENCES banners_publicidad(id) ON DELETE CASCADE,
        device_id VARCHAR(255) NOT NULL,
        creado_en TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
        PRIMARY KEY (banner_id, device_id)
      );
      CREATE INDEX IF NOT EXISTS idx_banner_vistas_banner ON banner_vistas_dispositivos(banner_id);
    `);

    console.log('✅ [Migración] Horarios, índices, coordenadas, banner_id y vistas únicas guardados exitosamente.');
    process.exit(0);
  } catch (err) {
    console.error('❌ [Migración] Error al migrar sucursales:', err);
    process.exit(1);
  }
}

migrate();
