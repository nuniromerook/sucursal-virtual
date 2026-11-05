const db = require('../src/db');

async function migrateSingleBranch() {
    try {
        console.log('Iniciando unificación a Sucursal Única: Luis Guillón (Casa Central)...');

        const horariosJson = {
            lunes: { abierto: true, apertura: '07:00', cierre: '15:00' },
            martes: { abierto: true, apertura: '07:00', cierre: '15:00' },
            miercoles: { abierto: true, apertura: '07:00', cierre: '15:00' },
            jueves: { abierto: true, apertura: '07:00', cierre: '15:00' },
            viernes: { abierto: true, apertura: '07:00', cierre: '15:00' },
            sabado: { abierto: true, apertura: '07:00', cierre: '15:00' },
            domingo: { abierto: true, apertura: '08:00', cierre: '13:00' }
        };

        await db.query(`ALTER TABLE sucursales ADD COLUMN IF NOT EXISTS telefono_whatsapp VARCHAR(30) DEFAULT '5491162166222';`);
        await db.query(`ALTER TABLE sucursales ADD COLUMN IF NOT EXISTS horarios_apertura JSONB;`);

        await db.query(`
            INSERT INTO sucursales (id, nombre, slug, direccion, ciudad, telefono_whatsapp, horario_atencion, activa, horarios_apertura)
            VALUES (
                1,
                'Luis Guillón (Casa Central)',
                'luis-guillon',
                'Av. Luciano Valette 1696, Luis Guillon, Provincia de Buenos Aires',
                'Luis Guillón',
                '5491162166222',
                'Lunes a Sábados de 07:00 a 15:00hs y Domingos de 08:00 a 13:00hs',
                true,
                $1::jsonb
            )
            ON CONFLICT (id) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                slug = EXCLUDED.slug,
                direccion = EXCLUDED.direccion,
                ciudad = EXCLUDED.ciudad,
                telefono_whatsapp = EXCLUDED.telefono_whatsapp,
                horario_atencion = EXCLUDED.horario_atencion,
                activa = true,
                horarios_apertura = EXCLUDED.horarios_apertura;
        `, [JSON.stringify(horariosJson)]);

        await db.query(`UPDATE pedidos SET sucursal_id = 1 WHERE sucursal_id IS DISTINCT FROM 1;`);
        await db.query(`UPDATE empleados SET sucursal_id = 1 WHERE sucursal_id IS DISTINCT FROM 1;`);
        await db.query(`UPDATE notificaciones SET sucursal_id = 1 WHERE sucursal_id IS DISTINCT FROM 1;`);

        await db.query(`ALTER TABLE pedidos ALTER COLUMN sucursal_id SET DEFAULT 1;`);
        await db.query(`ALTER TABLE empleados ALTER COLUMN sucursal_id SET DEFAULT 1;`);
        await db.query(`ALTER TABLE notificaciones ALTER COLUMN sucursal_id SET DEFAULT 1;`);

        await db.query(`DELETE FROM sucursales WHERE id != 1;`);
        await db.query(`DROP TABLE IF EXISTS stock_sucursal CASCADE;`);
        await db.query(`DROP TABLE IF EXISTS catalogo_combos CASCADE;`);

        await db.query(`
            CREATE TABLE IF NOT EXISTS combos (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(120) NOT NULL,
                descripcion TEXT,
                badge VARCHAR(50) DEFAULT 'Caja Familiar',
                comensales VARCHAR(50) DEFAULT 'Comen 6-8',
                peso_total NUMERIC(10, 2) DEFAULT 0,
                precio_regular NUMERIC(10, 2) NOT NULL,
                precio_combo NUMERIC(10, 2) NOT NULL,
                ahorro_porcentaje INT DEFAULT 15,
                popular BOOLEAN DEFAULT false,
                activo BOOLEAN DEFAULT true,
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS combo_items (
                id SERIAL PRIMARY KEY,
                combo_id INT REFERENCES combos(id) ON DELETE CASCADE,
                catalogo_id INT REFERENCES catalogo(id) ON DELETE CASCADE,
                cantidad NUMERIC(10, 2) NOT NULL DEFAULT 1,
                unidad VARCHAR(20) DEFAULT 'kg'
            );
        `);

        console.log('Sucursal única Luis Guillón (Casa Central) verificada exitosamente.');
        process.exit(0);
    } catch (err) {
        console.error('Error en migrate_single_branch:', err);
        process.exit(1);
    }
}

migrateSingleBranch();
