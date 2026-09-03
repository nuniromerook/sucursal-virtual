require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/db');
const { cloudinary, extraerPublicId } = require('../src/utils/cloudinary');

async function limpiarHuerfanos() {
  try {
    console.log('🔍 [Cloudinary] Iniciando escaneo de imágenes huérfanas...');

    // 1. Obtener todas las URLs de imágenes activas en la base de datos
    const urlsActivas = new Set();

    const catalogoRes = await pool.query('SELECT imagen_url FROM catalogo WHERE imagen_url IS NOT NULL');
    catalogoRes.rows.forEach(r => {
      const pid = extraerPublicId(r.imagen_url);
      if (pid) urlsActivas.add(pid);
    });

    const bannersRes = await pool.query('SELECT imagen_desktop_url, imagen_mobile_url FROM banners_publicidad');
    bannersRes.rows.forEach(r => {
      const pidD = extraerPublicId(r.imagen_desktop_url);
      if (pidD) urlsActivas.add(pidD);
      const pidM = extraerPublicId(r.imagen_mobile_url);
      if (pidM) urlsActivas.add(pidM);
    });

    const clientesRes = await pool.query('SELECT avatar_url FROM clientes WHERE avatar_url IS NOT NULL');
    clientesRes.rows.forEach(r => {
      const pid = extraerPublicId(r.avatar_url);
      if (pid) urlsActivas.add(pid);
    });

    console.log(`📋 Imágenes activas en la base de datos: ${urlsActivas.size}`);

    // 2. Obtener lista de imágenes en Cloudinary
    let nextCursor = null;
    let totalCloudinary = 0;
    const huerfanos = [];

    do {
      const res = await cloudinary.api.resources({
        type: 'upload',
        max_results: 500,
        next_cursor: nextCursor,
      });

      totalCloudinary += res.resources.length;

      for (const resItem of res.resources) {
        if (!urlsActivas.has(resItem.public_id)) {
          huerfanos.push(resItem.public_id);
        }
      }

      nextCursor = res.next_cursor;
    } while (nextCursor);

    console.log(`☁️ Total de imágenes en Cloudinary: ${totalCloudinary}`);
    console.log(`🗑️ Total de imágenes huérfanas encontradas: ${huerfanos.length}`);

    if (huerfanos.length === 0) {
      console.log('✅ ¡Tu cuenta de Cloudinary está limpia! No hay imágenes huérfanas.');
      process.exit(0);
    }

    // 3. Eliminar huérfanos en lotes de 100
    console.log('🚀 Procediendo a eliminar huérfanos...');
    for (let i = 0; i < huerfanos.length; i += 100) {
      const batch = huerfanos.slice(i, i + 100);
      const delRes = await cloudinary.api.delete_resources(batch);
      console.log(`Lote ${Math.floor(i / 100) + 1}:`, delRes);
    }

    console.log('✨ [Cloudinary] ¡Limpieza completada con éxito!');
    process.exit(0);
  } catch (err) {
    console.error('❌ [Cloudinary] Error en el proceso de limpieza:', err);
    process.exit(1);
  }
}

limpiarHuerfanos();
