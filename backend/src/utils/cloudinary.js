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

    const parts = splitUpload[1].split('/');
    const versionIndex = parts.findIndex(part => /^v\d+$/.test(part));

    let pathParts;
    if (versionIndex !== -1) {
      // Todo lo posterior al segmento de versión (v12345678) es el public_id (con posibles subcarpetas)
      pathParts = parts.slice(versionIndex + 1);
    } else {
      // Si no tiene segmento de versión, tomar el último segmento (archivo) o filtrar transformaciones
      const lastPart = parts[parts.length - 1];
      pathParts = [lastPart];
    }

    const fullPath = pathParts.join('/');
    // Quitar extensión final (.jpg, .png, .webp, etc.)
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
