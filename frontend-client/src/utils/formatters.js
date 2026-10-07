// src/utils/formatters.js

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
 * Formatea la cantidad en kg enteros (ej: 1 kg, 2 kg, 3 kg)
 */
export const formatCantidad = (kg) => {
  if (kg === undefined || kg === null || isNaN(kg)) return "1 kg";
  const num = Math.round(Number(kg));
  return `${num} kg`;
};

/**
 * Formatea el precio por unidad (ej: "$11.900 / kg")
 */
export const formatPrecioPorUnidad = (precio, unidad = "kg") => {
  return `${formatPrecio(precio)} / ${unidad}`;
};
