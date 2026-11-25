// src/utils/searchRanking.js

/**
 * Normaliza texto removiendo tildes/diacríticos y pasando a minúsculas.
 */
export function normalizeSearchText(text = "") {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Divide una búsqueda en tokens únicos no vacíos.
 */
export function getSearchTokens(query = "") {
  const norm = normalizeSearchText(query);
  if (!norm) return [];
  return Array.from(new Set(norm.split(/\s+/).filter(Boolean)));
}

/**
 * Calcula puntaje de coincidencias para un producto/corte.
 * Prioriza cantidad de términos coincidentes, coincidencia exacta de frase y título.
 */
export function scoreProductMatch(product, query) {
  const normQuery = normalizeSearchText(query);
  const tokens = getSearchTokens(query);
  if (!normQuery || tokens.length === 0) return 0;

  const nombre = normalizeSearchText(product?.nombre || product?.nombre_producto);
  const categoria = normalizeSearchText(
    `${product?.categoria || ""} ${product?.especie || ""} ${product?.categoria_label || ""}`,
  );
  const extra = normalizeSearchText(
    `${product?.descripcion || ""} ${product?.badge || ""} ${
      Array.isArray(product?.metodos_coccion)
        ? product.metodos_coccion.join(" ")
        : ""
    }`,
  );

  let matchedTokens = 0;
  let score = 0;

  if (nombre.includes(normQuery)) {
    score += 12;
    if (nombre.startsWith(normQuery)) score += 6;
  }

  for (const token of tokens) {
    let tokenHit = false;
    if (nombre.includes(token)) {
      score += 5;
      tokenHit = true;
    }
    if (categoria.includes(token)) {
      score += 3;
      tokenHit = true;
    }
    if (extra.includes(token)) {
      score += 2;
      tokenHit = true;
    }
    if (tokenHit) matchedTokens += 1;
  }

  if (matchedTokens === 0) return 0;
  // Bonus fuerte por cantidad de términos coincidentes
  return matchedTokens * 10 + score;
}

/**
 * Calcula puntaje de coincidencias para un combo (título, descripción, badge e ítems incluidos).
 */
export function scoreComboMatch(combo, query) {
  const normQuery = normalizeSearchText(query);
  const tokens = getSearchTokens(query);
  if (!normQuery || tokens.length === 0) return 0;

  const nombre = normalizeSearchText(combo?.nombre);
  const descripcion = normalizeSearchText(
    `${combo?.descripcion || ""} ${combo?.badge || ""}`,
  );
  const itemsText = Array.isArray(combo?.items)
    ? combo.items
        .map((it) =>
          normalizeSearchText(`${it?.nombre || ""} ${it?.categoria || ""}`),
        )
        .join(" ")
    : "";

  let matchedTokens = 0;
  let score = 0;

  if (nombre.includes(normQuery)) {
    score += 12;
    if (nombre.startsWith(normQuery)) score += 6;
  }
  if (itemsText.includes(normQuery)) {
    score += 6;
  }

  for (const token of tokens) {
    let tokenHit = false;
    if (nombre.includes(token)) {
      score += 5;
      tokenHit = true;
    }
    if (itemsText.includes(token)) {
      score += 4;
      tokenHit = true;
    }
    if (descripcion.includes(token)) {
      score += 2;
      tokenHit = true;
    }
    if (tokenHit) matchedTokens += 1;
  }

  if (matchedTokens === 0) return 0;
  return matchedTokens * 10 + score;
}
