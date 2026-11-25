// src/utils/address.js

export const EMPTY_ADDRESS = {
  calle: "",
  altura: "",
  piso: "",
  depto: "",
  localidad: "",
  codigo_postal: "",
  referencias: "",
};

/**
 * Reconstruye campos estructurados de dirección dando prioridad al objeto JSONB
 * (`direccion_datos`) y haciendo fallback limpio al string `direccion_default`.
 */
export function parseAddressParts(raw = "", structured = null) {
  if (
    structured &&
    typeof structured === "object" &&
    !Array.isArray(structured)
  ) {
    return {
      calle: String(structured.calle || "").trim(),
      altura: String(structured.altura || "").trim(),
      piso: String(structured.piso || "").trim(),
      depto: String(structured.depto || "").trim(),
      localidad: String(structured.localidad || "").trim(),
      codigo_postal: String(structured.codigo_postal || "").trim(),
      referencias: String(structured.referencias || "").trim(),
    };
  }

  const clean = String(raw || "").trim();
  if (!clean || /^retiro en /i.test(clean)) {
    return { ...EMPTY_ADDRESS };
  }

  let referencias = "";
  const refMatch = clean.match(/\s*·\s*Ref:\s*(.+)$/i);
  if (refMatch) {
    referencias = refMatch[1].trim();
  }
  const withoutRef = clean.replace(/\s*·\s*Ref:\s*.+$/i, "").trim();

  let codigo_postal = "";
  const cpMatch = withoutRef.match(/\(?\bCP\s*([A-Za-z0-9]{4,8})\)?/i);
  if (cpMatch) {
    codigo_postal = cpMatch[1].trim();
  }
  const withoutCp = withoutRef
    .replace(/\(?\bCP\s*[A-Za-z0-9]{4,8}\)?/gi, "")
    .trim();

  const segments = withoutCp
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const streetPart = segments[0] || "";
  let piso = "";
  let depto = "";
  const localitySegments = [];

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    if (/^(piso|p\.|depto|dpto|dto)/i.test(seg)) {
      const pMatch = seg.match(/(?:piso|p\.)\s*([^\s,]+)/i);
      const dMatch = seg.match(/(?:depto|dpto|dto\.?)\s*([^\s,]+)/i);
      if (pMatch) piso = pMatch[1].trim();
      if (dMatch) depto = dMatch[1].trim();
    } else {
      localitySegments.push(seg);
    }
  }

  const localidad = localitySegments
    .join(", ")
    .replace(/provincia de buenos aires|buenos aires|argentina/gi, "")
    .replace(/^[\s,]+|[\s,]+$/g, "")
    .trim();

  const match = streetPart.match(/^(.*?)\s+(\d+[a-zA-Z0-9/-]*)$/);
  if (match) {
    return {
      calle: match[1].trim(),
      altura: match[2].trim(),
      piso,
      depto,
      localidad,
      codigo_postal,
      referencias,
    };
  }
  return {
    calle: streetPart,
    altura: "",
    piso,
    depto,
    localidad,
    codigo_postal,
    referencias,
  };
}

/**
 * Formatea los campos estructurados en una dirección legible para tickets y repartidores.
 */
export function composeAddress({
  calle = "",
  altura = "",
  piso = "",
  depto = "",
  localidad = "",
  codigo_postal = "",
  referencias = "",
}) {
  const street = [calle.trim(), altura.trim()].filter(Boolean).join(" ");
  const unitParts = [];
  if (piso.trim()) unitParts.push(`Piso ${piso.trim()}`);
  if (depto.trim()) unitParts.push(`Depto ${depto.trim()}`);
  const unit = unitParts.join(" ");

  const loc = localidad.trim();
  const cp = codigo_postal.trim().toUpperCase();
  const locWithCp =
    loc && cp ? `${loc} (CP ${cp})` : loc || (cp ? `CP ${cp}` : "");

  const base = [street, unit, locWithCp].filter(Boolean).join(", ");
  const ref = referencias.trim();
  if (!base) return ref;
  return ref ? `${base} · Ref: ${ref}` : base;
}

/**
 * Genera el objeto estructurado estándar para PostgreSQL JSONB y APIs de envío.
 */
export function buildStructuredAddress({
  calle = "",
  altura = "",
  piso = "",
  depto = "",
  localidad = "",
  codigo_postal = "",
  referencias = "",
}) {
  const clean = {
    calle: calle.trim(),
    altura: altura.trim(),
    piso: piso.trim(),
    depto: depto.trim(),
    localidad: localidad.trim(),
    codigo_postal: codigo_postal.trim().toUpperCase(),
    referencias: referencias.trim(),
    provincia: "Buenos Aires",
    pais: "AR",
  };
  if (
    !clean.calle &&
    !clean.altura &&
    !clean.localidad &&
    !clean.codigo_postal
  ) {
    return null;
  }
  return clean;
}

export function hasRequiredAddress(parts) {
  return Boolean(
    parts?.calle?.trim() &&
      parts?.altura?.trim() &&
      parts?.localidad?.trim(),
  );
}
