// frontend/src/utils/formatters.js

export const formatCantidad = (valor, unidadMedida = "kg") => {
  const num = Number(valor);
  if (isNaN(num)) return "";

  // 1. Normalizar etiqueta de unidad
  const unidadMap = {
    kilogramo: "kg",
    kg: "kg",
    gancho: num === 1 ? "gancho" : "ganchos",
    unidad: num === 1 ? "unid." : "unids.",
  };

  const unidadTexto = unidadMap[unidadMedida?.toLowerCase()] || unidadMedida;

  // 2. Si la cantidad es entera
  if (Number.isInteger(num) || num % 1 === 0) {
    return `${Math.round(num)} ${unidadTexto}`;
  }

  // 3. Si tiene decimales
  const formattedNum = num.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${formattedNum} ${unidadTexto}`;
};

// --- AGREGÁ ESTA FUNCIÓN ---
export const formatPrecio = (valor) => {
  const num = Number(valor);
  if (isNaN(num)) return "$0";

  return num.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0, // Cambiá a 2 si manejás centavos
  });
};
