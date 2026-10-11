// admin/src/utils/formatters.js

export const formatMoney = (value) => {
  return "$ " + Number(value || 0).toLocaleString("es-AR", {
    maximumFractionDigits: 0,
  });
};

export const formatWeight = (value, unit = "kg") => {
  const num = Number(value || 0);
  if (unit === "u") return `${num} u`;
  return `${num.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 3 })} kg`;
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) + " hs";
};
