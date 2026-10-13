// admin/src/utils/cloudinary.js

/**
 * Sube una imagen directamente a Cloudinary mediante unsigned upload preset.
 * Retorna la URL segura optimizada con compresión inteligente y auto-formato (WebP/AVIF).
 *
 * @param {File} file - Archivo de imagen seleccionado o arrastrado.
 * @returns {Promise<string>} URL de Cloudinary optimizada.
 */
export const uploadImageToCloudinary = async (file) => {
  if (!file) throw new Error("No se proporcionó ningún archivo para subir.");

  // Validación básica de tipo de archivo
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo seleccionado no es una imagen válida (PNG, JPG, WEBP).");
  }

  // Límite de tamaño: 10MB
  const MAX_SIZE_MB = 10;
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`La imagen supera el tamaño máximo permitido de ${MAX_SIZE_MB}MB.`);
  }

  const cloudName = "ylrkjlsv";
  const uploadPreset = "valette_db";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || "Error al subir la imagen al servidor de Cloudinary."
    );
  }

  const data = await res.json();

  if (!data.secure_url) {
    throw new Error("Cloudinary no devolvió una URL válida.");
  }

  // Optimización automática de Cloudinary: f_auto (formato WebP/AVIF según navegador), q_auto (compresión visual lossless)
  return data.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
};
