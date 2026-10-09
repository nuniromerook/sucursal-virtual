// src/utils/priceCalculator.js

/**
 * Calcula el precio total, precio unitario efectivo y ahorro de un corte o producto
 * aplicando promociones por volumen (tanto packs cerrados como escalas mayoristas).
 * En PostgreSQL, 'precio_promocional' almacena el precio total del pack (ej: $8.000 x 5u, $25.600 x 2kg).
 *
 * @param {Object} item - Producto con precio base, cantidad_kg y array de promociones opcional.
 */
export const calculateItemPrice = (item) => {
  const kg = Math.max(1, parseFloat(item.cantidad_kg || item.cantidad || 1));
  const precioBase = parseFloat(item.precio || item.precio_por_kg_congelado || 0);
  const promos = Array.isArray(item.promos) ? item.promos : [];

  // Buscar promociones activas ordenadas de mayor cantidad requerida a menor
  const activePromos = [...promos]
    .filter((p) => p.activa !== false && parseFloat(p.cantidad_kg) > 0)
    .sort((a, b) => parseFloat(b.cantidad_kg) - parseFloat(a.cantidad_kg));

  // Encontrar la mejor escala alcanzada por la cantidad seleccionada
  const promoAplicable = activePromos.find((p) => kg >= parseFloat(p.cantidad_kg));

  let total = 0;
  let precioUnitarioEfectivo = precioBase;

  if (promoAplicable) {
    const promoCant = parseFloat(promoAplicable.cantidad_kg);
    const rawPromoPrice = parseFloat(promoAplicable.precio_promocional);

    // Si rawPromoPrice >= precioBase (ej: $8.000 para 5 chorizos de $1.700),
    // es el precio total del pack; de lo contrario ya vino como precio unitario.
    const unitPromoPrice =
      promoAplicable.precio_unitario_promo !== undefined
        ? parseFloat(promoAplicable.precio_unitario_promo)
        : rawPromoPrice >= precioBase
          ? rawPromoPrice / promoCant
          : rawPromoPrice;

    const packPromoPrice =
      rawPromoPrice >= precioBase
        ? rawPromoPrice
        : Math.round(rawPromoPrice * promoCant);

    // Paquetes cerrados que califican para la promo + unidades/kilos sobrantes
    const paquetes = Math.floor(kg / promoCant);
    const sobrante = kg % promoCant;

    // Los paquetes van al precio total promocional del pack.
    // El sobrante se liquida al precio unitario promocional (para premiar el volumen del cliente)
    total = Math.round(paquetes * packPromoPrice + sobrante * unitPromoPrice);
    precioUnitarioEfectivo = Math.round((total / kg) * 100) / 100;
  } else {
    total = Math.round(kg * precioBase);
    precioUnitarioEfectivo = precioBase;
  }

  const totalSinPromo = Math.round(kg * precioBase);
  const ahorro = Math.max(0, totalSinPromo - total);

  return {
    precioUnitario: precioUnitarioEfectivo,
    precioBase,
    total,
    ahorro,
    tienePromo: !!promoAplicable && ahorro > 0,
    promoAplicada: promoAplicable,
  };
};
