// backend/src/seoHandler.js
const pool = require("./db");

const SITE_URL = "https://abastecedoravalette.digital";

// Función para limpiar Markdown y HTML para Meta Tags y Snippets
const cleanTextForMeta = (text, maxLength = 160) => {
  if (!text) return "";
  let clean = text
    .replace(/<[^>]*>/g, "") // Eliminar HTML tags
    .replace(/^#+\s+/gm, "") // Encabezados Markdown (# Título)
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // Negritas (**texto** -> texto)
    .replace(/(\*|_)(.*?)\1/g, "$2") // Cursivas (*texto* -> texto)
    .replace(/^\s*>\s+/gm, "") // Citas (> texto)
    .replace(/^\s*[-*+]\s+/gm, "") // Listas desordenadas (- item)
    .replace(/^\s*\d+\.\s+/gm, "") // Listas ordenadas (1. item)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Enlaces [texto](url) -> texto
    .replace(/`{1,3}[^`]*`{1,3}/g, "") // Bloques de código
    .replace(/&[a-z]+;/gi, " ") // Entidades HTML básicas
    .replace(/\s+/g, " ") // Colapsar saltos de línea y espacios
    .trim();

  if (maxLength && clean.length > maxLength) {
    const truncated = clean.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    clean = (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "...";
  }

  return clean;
};

// Escapar caracteres para atributos HTML seguros
const escapeHtmlAttr = (str = "") => {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

// Schema.org base de la carnicería (ButcherShop)
const getButcherShopSchema = (sucursal) => {
  return {
    "@context": "https://schema.org",
    "@type": "ButcherShop",
    "name": "Abastecedora Valette",
    "image": `${SITE_URL}/logo192.png`,
    "@id": SITE_URL,
    "url": SITE_URL,
    "telephone": sucursal?.telefono || "1135534033",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": sucursal?.direccion || "Av. Luciano Valette 1696",
      "addressLocality": sucursal?.ciudad || "Luis Guillon",
      "addressRegion": "Buenos Aires",
      "addressCountry": "AR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -34.8143,
      "longitude": -58.4552
    }
  };
};

const getProductSchema = (product) => {
  const plainDesc = cleanTextForMeta(product.descripcion || product.nombre_producto, 300);
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.nombre_producto,
    "image": product.imagen_url || `${SITE_URL}/logo192.png`,
    "description": plainDesc,
    "sku": product.slug,
    "offers": {
      "@type": "Offer",
      "url": `${SITE_URL}/${product.categoria || product.especie || 'productos'}/${product.slug}`,
      "priceCurrency": "ARS",
      "price": product.precio,
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.sin_stock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
    }
  };
};

// Generar HTML estático para bots
const renderSeoHtml = async (req, res) => {
  let requestPath = req.query.path || req.originalUrl || "/";
  if (requestPath.startsWith("/api/seo/render")) {
    requestPath = requestPath.replace("/api/seo/render", "");
  }
  
  if (!requestPath || requestPath === "") requestPath = "/";

  // Obtenemos info base (la sucursal por defecto 1 por ahora)
  let sucursal = null;
  try {
    const sucRes = await pool.query(`SELECT * FROM sucursales WHERE activa = true LIMIT 1`);
    if (sucRes.rows.length > 0) sucursal = sucRes.rows[0];
  } catch (e) {}

  let title = "Abastecedora Valette";
  let description = "Venta de cortes de carne vacuno, cerdo, pollo y preparados.";
  let image = `${SITE_URL}/logo192.png`;
  let schemas = [getButcherShopSchema(sucursal)];
  
  // Buscar si es una ruta de producto: /categoria/slug o /especie/slug
  const pathParts = requestPath.split('?')[0].split('/').filter(Boolean);
  if (pathParts.length === 2) {
    const slug = pathParts[1];
    try {
      const prodRes = await pool.query(`SELECT * FROM catalogo WHERE slug = $1 AND activo = true`, [slug]);
      if (prodRes.rows.length > 0) {
        const product = prodRes.rows[0];
        title = `${product.nombre_producto} | Abastecedora Valette`;
        const cleanedProductDesc = cleanTextForMeta(product.descripcion, 160);
        description = cleanedProductDesc || `Comprá ${product.nombre_producto} al mejor precio en Abastecedora Valette.`;
        image = product.imagen_url || image;
        schemas.push(getProductSchema(product));
      }
    } catch (e) {
      console.error("Error SEO fetching product:", e);
    }
  }

  const safeTitle = escapeHtmlAttr(title);
  const safeDescription = escapeHtmlAttr(description);
  const safeImage = escapeHtmlAttr(image);
  const safeUrl = escapeHtmlAttr(`${SITE_URL}${requestPath}`);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${safeImage}">
  <meta property="og:url" content="${safeUrl}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  
  <script type="application/ld+json">
    ${JSON.stringify(schemas)}
  </script>
</head>
<body>
  <h1>${safeTitle}</h1>
  <p>${safeDescription}</p>
  <img src="${safeImage}" alt="${safeTitle}" />
</body>
</html>`;

  res.send(html);
};

// Generar Sitemap.xml dinámico
const generateSitemap = async (req, res) => {
  try {
    const productos = await pool.query(`SELECT slug, categoria, especie, actualizado_en FROM catalogo WHERE activo = true`);
    
    let urls = '';
    
    // Rutas estáticas
    urls += `
      <url>
        <loc>${SITE_URL}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>${SITE_URL}/ofertas</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
      </url>
    `;

    // Rutas dinámicas de productos
    for (const p of productos.rows) {
      const categoriaStr = p.categoria || p.especie || 'productos';
      const prodUrl = `${SITE_URL}/${categoriaStr.toLowerCase().trim()}/${p.slug}`;
      const lastMod = p.actualizado_en ? new Date(p.actualizado_en).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      urls += `
        <url>
          <loc>${prodUrl}</loc>
          <lastmod>${lastMod}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.9</priority>
        </url>
      `;
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (err) {
    console.error("Error al generar sitemap:", err);
    res.status(500).send("Error generando sitemap");
  }
};

module.exports = {
  renderSeoHtml,
  generateSitemap
};
