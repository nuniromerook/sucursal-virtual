const cloudinary = require('cloudinary').v2;

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ylrkjlsv',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Extrae el public_id de una URL de Cloudinary
 * Ej: 'https://res.cloudinary.com/ylrkjlsv/image/upload/v1720000000/cortes/asado.jpg' -> 'cortes/asado'
 */
function extraerPublicId(url) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    const splitUpload = url.split('/upload/');
    if (splitUpload.length < 2) return null;

    // Quitar transformaciones (como f_auto,q_auto/ o v1720000000/)
    const parts = splitUpload[1].split('/');
    const pathParts = [];

    for (const part of parts) {
      // Ignorar versiones v12345678 y transformaciones con coma o igual
      if (/^v\d+$/.test(part) || part.includes(',') || part.includes('_')) {
        continue;
      }
      pathParts.push(part);
    }

    const fullPath = pathParts.join('/');
    // Quitar extension (.jpg, .png, .webp)
    return fullPath.replace(/\.[^/.]+$/, '');
  } catch (err) {
    console.error('Error al extraer public_id de Cloudinary:', err);
    return null;
  }
}

/**
 * Elimina una imagen de Cloudinary a partir de su URL o public_id
 */
async function eliminarImagenCloudinary(urlOPublicId) {
  try {
    const publicId = urlOPublicId.includes('http')
      ? extraerPublicId(urlOPublicId)
      : urlOPublicId;

    if (!publicId) return false;

    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`[Cloudinary] Eliminado asset '${publicId}':`, result.result);
    return result.result === 'ok';
  } catch (error) {
    console.error('[Cloudinary] Error al eliminar imagen:', error.message);
    return false;
  }
}

module.exports = {
  cloudinary,
  extraerPublicId,
  eliminarImagenCloudinary,
};
