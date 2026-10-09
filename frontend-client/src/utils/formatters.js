// src/utils/formatters.js

/**
 * Normaliza la etiqueta de la unidad de medida ('kg' o 'u')
 */
export const formatUnidadMedida = (unidadMedida = "kg") => {
  const u = (unidadMedida || "kg").toLowerCase().trim();
  if (
    u === "u" ||
    u === "unidad" ||
    u === "unidades" ||
    u === "unid." ||
    u === "unids." ||
    u === "un"
  ) {
    return "u";
  }
  return "kg";
};

/**
 * Formatea un número a moneda argentina ($ 12.345)
 */
export const formatPrecio = (valor) => {
  if (valor === undefined || valor === null || isNaN(valor)) return "$0";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);
};

/**
 * Formatea la cantidad con su unidad correspondiente (ej: "1 kg", "3 u", "5 kg")
 */
export const formatCantidad = (valor, unidadMedida = "kg") => {
  if (valor === undefined || valor === null || isNaN(valor)) return "1 kg";
  const num = Math.round(Number(valor));
  const unidad = formatUnidadMedida(unidadMedida);
  return `${num} ${unidad}`;
};

/**
 * Formatea el precio por unidad o kilo (ej: "$11.900 / kg" o "$1.700 / u")
 */
export const formatPrecioPorUnidad = (precio, unidadMedida = "kg") => {
  const unidad = formatUnidadMedida(unidadMedida);
  return `${formatPrecio(precio)} / ${unidad}`;
};

/**
 * Genera el resumen combinado de kilos y unidades (ej: "3 kg y 2 u", "5 kg", "4 u")
 */
export const formatResumenCantidades = (totalKg = 0, totalUnidades = 0) => {
  const parts = [];
  if (totalKg > 0) {
    parts.push(`${Math.round(totalKg)} kg`);
  }
  if (totalUnidades > 0) {
    parts.push(`${Math.round(totalUnidades)} u`);
  }
  if (parts.length === 0) return "0 kg";
  return parts.join(" y ");
};
