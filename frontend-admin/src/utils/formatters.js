// Helper para formatear peso/unidad según unidad_medida
export const formatCantidad = (cantidad, unidadMedida = "kg") => {
  if (
    unidadMedida === "unidad" ||
    unidadMedida === "cajon" ||
    unidadMedida === "gancho"
  ) {
    return `${cantidad} u.`;
  }

  // Si la medida es por peso (kg)
  if (cantidad < 1) {
    // Menos de 1kg se expresa en gramos (ej: 0.95 -> 950g)
    return `${Math.round(cantidad * 1000)}g`;
  }

  // Si es mayor o igual a 1kg, formateamos a máximo 2 decimales
  return `${Number(cantidad.toFixed(2))} kg`;
};

export const formatMoney = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "$0";
  return `$${Number(amount).toLocaleString("es-AR")}`;
};

export const formatPrecio = formatMoney;
