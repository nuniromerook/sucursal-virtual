const db = require('../src/db');

async function cleanupSchemaV1() {
    try {
        console.log('Iniciando limpieza de columnas legacy y sincronización de esquema v1.0...');

        // 1. CATALOGO: Asegurar columnas activas de v1.0 y eliminar columnas legacy
        await db.query(`
            ALTER TABLE catalogo
                ADD COLUMN IF NOT EXISTS sin_stock BOOLEAN DEFAULT false,
                ADD COLUMN IF NOT EXISTS opciones_corte JSONB DEFAULT '[]'::jsonb,
                ADD COLUMN IF NOT EXISTS metodos_coccion JSONB DEFAULT '[]'::jsonb,
                ADD COLUMN IF NOT EXISTS rinde_personas VARCHAR(255),
                ADD COLUMN IF NOT EXISTS badge VARCHAR(255);
        `);

        await db.query(`
            ALTER TABLE catalogo
                DROP COLUMN IF EXISTS nombre,
                DROP COLUMN IF EXISTS precio_kg,
                DROP COLUMN IF EXISTS precio_oferta,
                DROP COLUMN IF EXISTS en_oferta,
                DROP COLUMN IF EXISTS es_combo,
                DROP COLUMN IF EXISTS preparaciones,
                DROP COLUMN IF EXISTS en_stock,
                DROP COLUMN IF EXISTS stock_fisico;
        `);

        // 2. COMBOS & COMBO_ITEMS: Alinear columnas con combos.controller.js + imagen_url única
        await db.query(`
            CREATE TABLE IF NOT EXISTS combos (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(120) NOT NULL,
                slug VARCHAR(140) UNIQUE,
                descripcion TEXT,
                imagen_url TEXT,
                precio NUMERIC(12, 2) NOT NULL DEFAULT 0,
                precio_anterior NUMERIC(12, 2) DEFAULT 0,
                kilos NUMERIC(10, 2) DEFAULT 0,
                rinde VARCHAR(80) DEFAULT '6 a 8 personas',
                badge VARCHAR(80) DEFAULT '🔥 Combo Ahorro',
                puntos INT DEFAULT 50,
                activo BOOLEAN DEFAULT true,
                orden INT DEFAULT 0,
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await db.query(`
            ALTER TABLE combos
                ADD COLUMN IF NOT EXISTS slug VARCHAR(140),
                ADD COLUMN IF NOT EXISTS imagen_url TEXT,
                ADD COLUMN IF NOT EXISTS precio NUMERIC(12, 2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS precio_anterior NUMERIC(12, 2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS kilos NUMERIC(10, 2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS rinde VARCHAR(80) DEFAULT '6 a 8 personas',
                ADD COLUMN IF NOT EXISTS badge VARCHAR(80) DEFAULT '🔥 Combo Ahorro',
                ADD COLUMN IF NOT EXISTS puntos INT DEFAULT 50,
                ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true,
                ADD COLUMN IF NOT EXISTS orden INT DEFAULT 0,
                ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                DROP COLUMN IF EXISTS comensales,
                DROP COLUMN IF EXISTS peso_total,
                DROP COLUMN IF EXISTS precio_regular,
                DROP COLUMN IF EXISTS precio_combo,
                DROP COLUMN IF EXISTS ahorro_porcentaje,
                DROP COLUMN IF EXISTS popular;
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS combo_items (
                id SERIAL PRIMARY KEY,
                combo_id INT REFERENCES combos(id) ON DELETE CASCADE,
                catalogo_id INT REFERENCES catalogo(id) ON DELETE CASCADE,
                cantidad_o_peso VARCHAR(60) DEFAULT '1 kg',
                peso_kg NUMERIC(10, 2) DEFAULT 1,
                descripcion_item TEXT DEFAULT '',
                orden INT DEFAULT 1
            );
        `);

        await db.query(`
            ALTER TABLE combo_items
                ADD COLUMN IF NOT EXISTS cantidad_o_peso VARCHAR(60) DEFAULT '1 kg',
                ADD COLUMN IF NOT EXISTS peso_kg NUMERIC(10, 2) DEFAULT 1,
                ADD COLUMN IF NOT EXISTS descripcion_item TEXT DEFAULT '',
                ADD COLUMN IF NOT EXISTS orden INT DEFAULT 1,
                DROP COLUMN IF EXISTS cantidad,
                DROP COLUMN IF EXISTS unidad;
        `);

        // Si combos está vacía, insertar los 3 combos iniciales con imagen_url de prueba
        const { rows: comboCount } = await db.query('SELECT COUNT(*)::int AS cnt FROM combos;');
        if (comboCount[0].cnt === 0) {
            const { rows: catRows } = await db.query('SELECT id FROM catalogo ORDER BY id ASC LIMIT 4;');
            const c1 = catRows[0]?.id || null;
            const c2 = catRows[1]?.id || c1;
            const c3 = catRows[2]?.id || c1;

            const seedCombos = [
                {
                    nombre: 'Combo Asado Parrillero Tradición (5 kg)',
                    slug: 'combo-asado-parrillero',
                    descripcion: 'La selección parrillera definitiva con novillito seleccionado, cerdo crocante y chorizo puro cerdo.',
                    imagen_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop',
                    precio: 37900,
                    precio_anterior: 43300,
                    kilos: 5,
                    rinde: '6 a 8 personas',
                    badge: '🔥 Parrilla Tradición',
                    puntos: 50,
                    orden: 1
                },
                {
                    nombre: 'Combo Familiar Semanal (6 kg)',
                    slug: 'combo-familiar-semanal',
                    descripcion: 'Paquete completo y versátil para resolver las comidas cotidianas con proteínas magras y cortes rendidores.',
                    imagen_url: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=1000&auto=format&fit=crop',
                    precio: 52900,
                    precio_anterior: 59600,
                    kilos: 6,
                    rinde: 'Almuerzos y cenas de la semana',
                    badge: '📦 Rinde 20+ Comidas',
                    puntos: 60,
                    orden: 2
                },
                {
                    nombre: 'Combo Cortes Especiales & Cerdo (5 kg)',
                    slug: 'combo-cortes-especiales-cerdo',
                    descripcion: 'Cortes tiernos y selectos para los amantes del buen comer: bifes anchos, bondiola de cerdo y matambre tierno.',
                    imagen_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000&auto=format&fit=crop',
                    precio: 52500,
                    precio_anterior: 59500,
                    kilos: 5,
                    rinde: '6 a 8 personas',
                    badge: '🥩 Selección Gourmet',
                    puntos: 55,
                    orden: 3
                }
            ];

            for (const sc of seedCombos) {
                const { rows: ins } = await db.query(`
                    INSERT INTO combos (nombre, slug, descripcion, imagen_url, precio, precio_anterior, kilos, rinde, badge, puntos, activo, orden)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11)
                    RETURNING id;
                `, [sc.nombre, sc.slug, sc.descripcion, sc.imagen_url, sc.precio, sc.precio_anterior, sc.kilos, sc.rinde, sc.badge, sc.puntos, sc.orden]);

                if (c1 && ins[0]?.id) {
                    await db.query(`INSERT INTO combo_items (combo_id, catalogo_id, cantidad_o_peso, peso_kg, orden) VALUES ($1, $2, '2 kg', 2, 1);`, [ins[0].id, c1]);
                    if (c2) await db.query(`INSERT INTO combo_items (combo_id, catalogo_id, cantidad_o_peso, peso_kg, orden) VALUES ($1, $2, '2 kg', 2, 2);`, [ins[0].id, c2]);
                    if (c3) await db.query(`INSERT INTO combo_items (combo_id, catalogo_id, cantidad_o_peso, peso_kg, orden) VALUES ($1, $2, '1 kg', 1, 3);`, [ins[0].id, c3]);
                }
            }
        } else {
            // Si ya existen combos (ej. en VPS), asegurar que tengan imagen_url de prueba si está vacía
            await db.query(`
                UPDATE combos
                SET imagen_url = CASE
                    WHEN orden = 1 THEN 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop'
                    WHEN orden = 2 THEN 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=1000&auto=format&fit=crop'
                    ELSE 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000&auto=format&fit=crop'
                END
                WHERE imagen_url IS NULL OR BTRIM(imagen_url) = '';
            `);
        }

        // 3. PEDIDOS: Asegurar columnas activas de v1.0 y eliminar columnas legacy duplicadas
        await db.query(`
            ALTER TABLE pedidos
                ALTER COLUMN sucursal_id SET DEFAULT 1,
                ADD COLUMN IF NOT EXISTS canal VARCHAR(30) DEFAULT 'web',
                ADD COLUMN IF NOT EXISTS fecha_entrega_programada TIMESTAMP,
                ADD COLUMN IF NOT EXISTS estado_local VARCHAR(40) DEFAULT 'solicitado',
                ADD COLUMN IF NOT EXISTS estado_envio_pedidosya VARCHAR(50),
                ADD COLUMN IF NOT EXISTS medio_pago VARCHAR(50) DEFAULT 'efectivo',
                ADD COLUMN IF NOT EXISTS pago_confirmado BOOLEAN DEFAULT false,
                ADD COLUMN IF NOT EXISTS monto_total_estimado NUMERIC(12, 2) DEFAULT 0,
                ADD COLUMN IF NOT EXISTS monto_total_final NUMERIC(12, 2),
                ADD COLUMN IF NOT EXISTS notas TEXT,
                ADD COLUMN IF NOT EXISTS cortador_id INT REFERENCES empleados(id) ON DELETE SET NULL,
                ADD COLUMN IF NOT EXISTS banner_id INT REFERENCES banners_publicidad(id) ON DELETE SET NULL;
        `);

        await db.query(`
            ALTER TABLE pedidos
                DROP COLUMN IF EXISTS cliente_nombre,
                DROP COLUMN IF EXISTS cliente_telefono,
                DROP COLUMN IF EXISTS metodo_pago,
                DROP COLUMN IF EXISTS costo_envio,
                DROP COLUMN IF EXISTS descuento_puntos,
                DROP COLUMN IF EXISTS puntos_canjeados,
                DROP COLUMN IF EXISTS estado,
                DROP COLUMN IF EXISTS total_estimado,
                DROP COLUMN IF EXISTS total_final,
                DROP COLUMN IF EXISTS notas_cliente,
                DROP COLUMN IF EXISTS comprobante_url;
        `);

        // 4. PEDIDO_ITEMS: Asegurar columnas activas de v1.0 y eliminar columnas legacy
        await db.query(`
            ALTER TABLE pedido_items
                ADD COLUMN IF NOT EXISTS cantidad_kg_solicitada NUMERIC(10, 2),
                ADD COLUMN IF NOT EXISTS precio_por_kg_congelado NUMERIC(12, 2),
                ADD COLUMN IF NOT EXISTS precio_estimado NUMERIC(12, 2),
                ADD COLUMN IF NOT EXISTS peso_real NUMERIC(10, 2),
                ADD COLUMN IF NOT EXISTS precio_final NUMERIC(12, 2),
                ADD COLUMN IF NOT EXISTS opciones_corte_seleccionada VARCHAR(100) DEFAULT 'Estándar',
                ADD COLUMN IF NOT EXISTS estado_item VARCHAR(30) DEFAULT 'pendiente',
                ADD COLUMN IF NOT EXISTS cortador_id INT REFERENCES empleados(id) ON DELETE SET NULL;
        `);

        await db.query(`
            ALTER TABLE pedido_items
                DROP COLUMN IF EXISTS cantidad_solicitada,
                DROP COLUMN IF EXISTS precio_unitario_historico,
                DROP COLUMN IF EXISTS notas_preparacion;
        `);

        // 5. CARRITOS & CARRITO_ITEMS: Enriquecer para Carrito en la Nube + Embudo de Abandono
        await db.query(`
            ALTER TABLE carritos
                ADD COLUMN IF NOT EXISTS sesion_id VARCHAR(120),
                ADD COLUMN IF NOT EXISTS dispositivo VARCHAR(30) DEFAULT 'desktop',
                ADD COLUMN IF NOT EXISTS ultimo_paso VARCHAR(50) DEFAULT 'carrito_abierto',
                ADD COLUMN IF NOT EXISTS motivo_abandono VARCHAR(120),
                ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);

        await db.query(`
            ALTER TABLE carrito_items
                ADD COLUMN IF NOT EXISTS precio_al_agregar NUMERIC(12, 2),
                ADD COLUMN IF NOT EXISTS promo_precio_al_agregar NUMERIC(12, 2),
                ADD COLUMN IF NOT EXISTS opciones_corte_seleccionada VARCHAR(100) DEFAULT 'Estándar',
                ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                DROP COLUMN IF EXISTS preparacion_seleccionada;
        `);

        console.log('✅ Esquema v1.0 y Combos con imagen_url única sincronizados con éxito.');
        process.exit(0);
    } catch (err) {
        console.error('Error en cleanupSchemaV1:', err);
        process.exit(1);
    }
}

cleanupSchemaV1();
