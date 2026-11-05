const db = require('../src/db');

async function migrateHorarios() {
    try {
        console.log('Iniciando migración de horarios en la tabla sucursales...');

        await db.query(`
            ALTER TABLE sucursales 
            ADD COLUMN IF NOT EXISTS horarios_apertura JSONB DEFAULT '{
                "lunes": {"abierto": true, "apertura": "07:00", "cierre": "15:00"},
                "martes": {"abierto": true, "apertura": "07:00", "cierre": "15:00"},
                "miercoles": {"abierto": true, "apertura": "07:00", "cierre": "15:00"},
                "jueves": {"abierto": true, "apertura": "07:00", "cierre": "15:00"},
                "viernes": {"abierto": true, "apertura": "07:00", "cierre": "15:00"},
                "sabado": {"abierto": true, "apertura": "07:00", "cierre": "15:00"},
                "domingo": {"abierto": true, "apertura": "08:00", "cierre": "13:00"}
            }'::jsonb;
        `);

        console.log('Columna horarios_apertura verificada exitosamente.');
        process.exit(0);
    } catch (error) {
        console.error('Error durante la migración:', error);
        process.exit(1);
    }
}

migrateHorarios();
