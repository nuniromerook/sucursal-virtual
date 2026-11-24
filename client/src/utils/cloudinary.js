// client/src/utils/cloudinary.js
const CLOUD_NAME = "ylrkjlsv";
const UPLOAD_PRESET = "valette_db";

export const uploadAvatarToCloudinary = async (file) => {
  if (!file) throw new Error("No se seleccionó ninguna imagen.");
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen (JPG, PNG o WEBP).");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("La imagen no puede superar los 5 MB.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message || "No se pudo subir la foto de perfil."
    );
  }

  const data = await response.json();
  if (!data?.secure_url) {
    throw new Error("Cloudinary no devolvió una URL válida.");
  }

  // Aplicar recorte cuadrado inteligente centrado en rostro + compresión automática
  return data.secure_url.replace(
    "/upload/",
    "/upload/c_fill,g_face,w_320,h_320,f_auto,q_auto/"
  );
};
