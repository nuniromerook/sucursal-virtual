// src/utils/priceCalculator.js

/**
 * Calcula el precio total y ahorro de un corte aplicando promociones por volumen.
 * @param {Object} item - Producto con precio base, cantidad_kg y array de promociones opcional.
 */
export const calculateItemPrice = (item) => {
  const kg = parseFloat(item.cantidad_kg || item.cantidad || 1);
  const precioBase = parseFloat(item.precio || item.precio_por_kg_congelado || 0);
  const promos = Array.isArray(item.promos) ? item.promos : [];

  // Buscar si aplica alguna promoción escalonada activa (ordenada de mayor cantidad a menor)
  const promoAplicable = [...promos]
    .filter((p) => p.activa !== false && kg >= parseFloat(p.cantidad_kg))
    .sort((a, b) => parseFloat(b.cantidad_kg) - parseFloat(a.cantidad_kg))[0];

  const precioUnitarioEfectivo = promoAplicable
    ? parseFloat(promoAplicable.precio_promocional)
    : precioBase;

  const total = Math.round(kg * precioUnitarioEfectivo);
  const totalSinPromo = Math.round(kg * precioBase);
  const ahorro = Math.max(0, totalSinPromo - total);

  return {
    precioUnitario: precioUnitarioEfectivo,
    precioBase,
    total,
    ahorro,
    tienePromo: !!promoAplicable,
    promoAplicada: promoAplicable,
  };
};
