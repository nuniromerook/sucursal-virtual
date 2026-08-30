// frontend-client/src/utils/formatters.js

/**
 * Normaliza la etiqueta de la unidad de medida
 * @param {string} unidadMedida
 * @returns {"kg" | "u" | "gancho" | string}
 */
export const formatUnidadMedida = (unidadMedida = "kg") => {
  const u = (unidadMedida || "kg").toLowerCase().trim();
  if (u === "unidad" || u === "unidades" || u === "u" || u === "unid." || u === "unids.") {
    return "u";
  }
  if (u === "gancho" || u === "ganchos") {
    return "gancho";
  }
  return "kg";
};

/**
 * Formatea cantidades numéricas con su unidad correspondiente (ej: "1 kg", "2 u", "1.5 kg")
 * @param {number|string} valor
 * @param {string} unidadMedida
 * @returns {string}
 */
export const formatCantidad = (valor, unidadMedida = "kg") => {
  const num = Number(valor);
  if (isNaN(num)) return "";

  const unidadTexto = formatUnidadMedida(unidadMedida);

  // Cantidad entera
  if (Number.isInteger(num) || num % 1 === 0) {
    return `${Math.round(num)} ${unidadTexto}`;
  }

  // Cantidad con decimales
  const formattedNum = num.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${formattedNum} ${unidadTexto}`;
};

/**
 * Formatea precios en pesos argentinos (ej: "$ 1.320")
 * @param {number|string} valor
 * @returns {string}
 */
export const formatPrecio = (valor) => {
  const num = Number(valor);
  if (isNaN(num)) return "$0";

  return num.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
};

/**
 * Formatea precio unitario con su unidad de medida (ej: "$ 1.320 / u" o "$ 9.500 / kg")
 * @param {number|string} precio
 * @param {string} unidadMedida
 * @returns {string}
 */
export const formatPrecioPorUnidad = (precio, unidadMedida = "kg") => {
  const unidad = formatUnidadMedida(unidadMedida);
  return `${formatPrecio(precio)} / ${unidad}`;
};

/**
 * Genera el resumen combinado de cantidades de kg y unidades (ej: "1 kg y 2 u" o "3 kg" o "5 u")
 * @param {number} totalKg
 * @param {number} totalUnidades
 * @returns {string}
 */
export const formatResumenCantidades = (totalKg = 0, totalUnidades = 0) => {
  const parts = [];
  if (totalKg > 0) {
    parts.push(formatCantidad(totalKg, "kg"));
  }
  if (totalUnidades > 0) {
    parts.push(`${totalUnidades} u`);
  }
  if (parts.length === 0) return "0 kg";
  return parts.join(" y ");
};
