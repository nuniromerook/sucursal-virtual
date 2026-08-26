// src/utils/cloudinary.js
export const uploadImageToCloudinary = async (file) => {
  const cloudName = "ylrkjlsv"; // Reemplazar con tu cloud_name de Cloudinary
  const uploadPreset = "valette_db"; // Reemplazar con tu preset unsigned

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!res.ok) throw new Error("Error al subir imagen a Cloudinary");
  const data = await res.json();

  // Devuelve la URL optimizada con auto-format (WebP) y compresión inteligente
  return data.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
};
