// src/utils/bannerAmbient.js
// Extrae una paleta ambiental real de la imagen del banner (estilo YouTube Ambient Mode)
// sin usar filtros CSS pesados y aplicando clamping de luminancia WCAG para garantizar
// contraste legible (>= 4.5:1) sobre cualquier foto en desktop.

export const DEFAULT_AMBIENT_PALETTE = {
  base: "rgb(11 18 32)",
  edge: "rgb(20 33 56)",
  glowTop: "rgb(31 52 88)",
  glowBottom: "rgb(18 30 52)",
  extracted: false,
};

const paletteCache = new Map();

function toAmbientSampleUrl(url) {
  if (!url || typeof url !== "string") return "";
  // En Cloudinary pedimos una miniatura microscópica (< 1 KB) preservando la proporción completa (desktop 16:9 y mobile 4:5)
  if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    const [prefix, rest] = url.split("/image/upload/");
    const cleanedRest = rest.replace(/^(?:f_auto|q_auto|w_\d+|h_\d+|c_[^,/]+)(?:,(?:f_auto|q_auto|w_\d+|h_\d+|c_[^,/]+))*\//, "");
    return `${prefix}/image/upload/w_24,c_scale,q_auto,f_auto/${cleanedRest}`;
  }
  return url;
}

function channelToLinear(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r, g, b) {
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

function clampByte(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function boostAndClampForContrast(rgb, { maxLuminance, minLuminance = 0.012, satBoost = 1.18 }) {
  let [r, g, b] = rgb;
  const mean = (r + g + b) / 3;

  // Realzar suavemente la saturación antes de oscurecer para mantener el carácter cromático de la foto
  r = clampByte(mean + (r - mean) * satBoost);
  g = clampByte(mean + (g - mean) * satBoost);
  b = clampByte(mean + (b - mean) * satBoost);

  let lum = relativeLuminance(r, g, b);

  // Si la zona muestreada es casi negra absoluta, dar un leve piso para que el modo inmersivo respire
  if (lum < minLuminance) {
    const lift = Math.max(10, Math.round((minLuminance - lum) * 320));
    r = clampByte(r + lift * 0.85);
    g = clampByte(g + lift * 0.9);
    b = clampByte(b + lift);
    lum = relativeLuminance(r, g, b);
  }

  // Oscurecimiento proporcional preservando el tono exacto hasta cumplir contraste WCAG (>= 4.5:1 / 7:1)
  if (lum > maxLuminance) {
    let low = 0;
    let high = 1;
    for (let i = 0; i < 10; i++) {
      const mid = (low + high) / 2;
      const testLum = relativeLuminance(r * mid, g * mid, b * mid);
      if (testLum > maxLuminance) {
        high = mid;
      } else {
        low = mid;
      }
    }
    r = clampByte(r * low);
    g = clampByte(g * low);
    b = clampByte(b * low);
  }

  return `rgb(${r} ${g} ${b})`;
}

function sampleRegion(data, width, height, x0, x1, y0, y1, chromaWeight = 0.8) {
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let totalWeight = 0;

  const startX = Math.max(0, Math.min(width - 1, x0));
  const endX = Math.max(startX, Math.min(width - 1, x1));
  const startY = Math.max(0, Math.min(height - 1, y0));
  const endY = Math.max(startY, Math.min(height - 1, y1));

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];
      if (a < 16) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC > 0 ? (maxC - minC) / maxC : 0;
      const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Atenuar reflejos blancos quemados o sombras absolutas para capturar el color real de la escena
      const blowoutPenalty = luma > 0.92 ? 0.2 : luma < 0.05 ? 0.45 : 1;
      const weight = (1 + sat * chromaWeight) * blowoutPenalty;

      sumR += r * weight;
      sumG += g * weight;
      sumB += b * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight <= 0) return [15, 23, 42];
  return [sumR / totalWeight, sumG / totalWeight, sumB / totalWeight];
}

export function getCachedBannerAmbient(imageUrl) {
  if (!imageUrl) return null;
  return paletteCache.get(imageUrl) || null;
}

export function extractBannerAmbient(imageUrl) {
  if (!imageUrl || typeof window === "undefined") {
    return Promise.resolve(DEFAULT_AMBIENT_PALETTE);
  }

  const cached = paletteCache.get(imageUrl);
  if (cached) return Promise.resolve(cached);

  const sampleUrl = toAmbientSampleUrl(imageUrl);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";

    const finalizeFallback = () => {
      paletteCache.set(imageUrl, DEFAULT_AMBIENT_PALETTE);
      resolve(DEFAULT_AMBIENT_PALETTE);
    };

    img.onload = () => {
      try {
        const w = 24;
        const h = 14;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return finalizeFallback();

        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);

        // 1. Borde izquierdo de la imagen: zona exacta donde se funde con el área de texto
        const edgeRgb = sampleRegion(data, w, h, 0, 5, 1, h - 2, 0.75);
        // 2. Ancla oscura general (mitad izquierda) para la base inmersiva de la card
        const baseRgb = sampleRegion(data, w, h, 0, 12, 0, h - 1, 0.55);
        // 3. Resplandor ambiental superior (estilo YouTube Ambient Mode)
        const topRgb = sampleRegion(data, w, h, 0, 17, 0, 6, 1.9);
        // 4. Resplandor ambiental inferior (brasas, madera, luces cálidas/frías)
        const bottomRgb = sampleRegion(data, w, h, 0, 17, 7, h - 1, 1.9);

        const palette = {
          base: boostAndClampForContrast(baseRgb, {
            maxLuminance: 0.026,
            minLuminance: 0.008,
            satBoost: 1.15,
          }),
          edge: boostAndClampForContrast(edgeRgb, {
            maxLuminance: 0.044,
            minLuminance: 0.012,
            satBoost: 1.22,
          }),
          glowTop: boostAndClampForContrast(topRgb, {
            maxLuminance: 0.082,
            minLuminance: 0.018,
            satBoost: 1.32,
          }),
          glowBottom: boostAndClampForContrast(bottomRgb, {
            maxLuminance: 0.076,
            minLuminance: 0.018,
            satBoost: 1.32,
          }),
          extracted: true,
        };

        paletteCache.set(imageUrl, palette);
        resolve(palette);
      } catch {
        finalizeFallback();
      }
    };

    img.onerror = finalizeFallback;
    img.src = sampleUrl;
  });
}
