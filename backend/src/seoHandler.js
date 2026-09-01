// backend/src/seoHandler.js
const pool = require("./db");

const SITE_URL = "https://abastecedoravalette.digital";

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
      "latitude": -34.8143, // coords dummy
      "longitude": -58.4552
    }
  };
};

const getProductSchema = (product) => {
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.nombre_producto,
    "image": product.imagen_url || `${SITE_URL}/logo192.png`,
    "description": product.descripcion || product.nombre_producto,
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
  const pathParts = requestPath.split('/').filter(Boolean);
  if (pathParts.length === 2) {
    const slug = pathParts[1];
    try {
      const prodRes = await pool.query(`SELECT * FROM catalogo WHERE slug = $1 AND activo = true`, [slug]);
      if (prodRes.rows.length > 0) {
        const product = prodRes.rows[0];
        title = `${product.nombre_producto} | Abastecedora Valette`;
        description = product.descripcion || `Comprá ${product.nombre_producto} al mejor precio en Abastecedora Valette.`;
        image = product.imagen_url || image;
        schemas.push(getProductSchema(product));
      }
    } catch (e) {
      console.error("Error SEO fetching product:", e);
    }
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${SITE_URL}${requestPath}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  
  <script type="application/ld+json">
    ${JSON.stringify(schemas)}
  </script>
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <img src="${image}" alt="${title}" />
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
