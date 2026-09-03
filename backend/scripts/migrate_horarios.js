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

    console.log('✅ [Migración] Horarios de apertura para Luis Guillón guardados exitosamente.');
    process.exit(0);
  } catch (err) {
    console.error('❌ [Migración] Error al migrar sucursales:', err);
    process.exit(1);
  }
}

migrate();
