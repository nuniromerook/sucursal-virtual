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

// Escapar caracteres para XML (Sitemap)
const escapeXml = (unsafe = "") => {
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
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
    "priceRange": "$$",
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
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "07:00",
        "closes": "15:00"
      }
    ]
  };
};

// Schema.org para Sitelinks (Navegación principal de categorías y secciones)
const getNavigationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "SiteNavigationElement",
        "position": 1,
        "name": "Cortes Vacunos",
        "description": "Asado, Bife Ancho, Matambre, Roast Beef y más cortes de ternera y novillo seleccionados.",
        "url": `${SITE_URL}/vacuno`
      },
      {
        "@type": "SiteNavigationElement",
        "position": 2,
        "name": "Cortes de Cerdo",
        "description": "Bondiola, Pechito de Cerdo, Paleta y Tocino fresco.",
        "url": `${SITE_URL}/cerdo`
      },
      {
        "@type": "SiteNavigationElement",
        "position": 3,
        "name": "Pollo Fresco",
        "description": "Supremas de pollo, pollo entero y preparados especiales.",
        "url": `${SITE_URL}/pollo`
      },
      {
        "@type": "SiteNavigationElement",
        "position": 4,
        "name": "Preparados y Embutidos",
        "description": "Chorizos artesanales, hamburguesas de pollo y más preparados.",
        "url": `${SITE_URL}/preparados`
      },
      {
        "@type": "SiteNavigationElement",
        "position": 5,
        "name": "Sucursales y Horarios",
        "description": "Ubicación en Luis Guillón, horarios de atención, teléfonos y retiro sin cargo.",
        "url": `${SITE_URL}/sucursales`
      },
      {
        "@type": "SiteNavigationElement",
        "position": 6,
        "name": "Envíos y Zonas de Entrega",
        "description": "Envíos refrigerados a domicilio en Luis Guillón y Zona Sur.",
        "url": `${SITE_URL}/envios`
      }
    ]
  };
};

// Schema.org para Producto Individual
const getProductSchema = (product) => {
  const plainDesc = cleanTextForMeta(product.descripcion || product.nombre_producto, 300);
  const categoriaStr = (product.categoria || product.especie || "productos").toLowerCase().trim();
  const prodUrl = `${SITE_URL}/${categoriaStr}/${product.slug}`;
  const priceNum = Number(product.precio) || 0;

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.nombre_producto,
    "image": product.imagen_url ? [product.imagen_url] : [`${SITE_URL}/logo192.png`],
    "description": plainDesc,
    "sku": product.slug,
    "brand": {
      "@type": "Brand",
      "name": "Abastecedora Valette"
    },
    "offers": {
      "@type": "Offer",
      "url": prodUrl,
      "priceCurrency": "ARS",
      "price": priceNum,
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.sin_stock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Abastecedora Valette"
      }
    }
  };
};

// Schema.org Breadcrumbs
const getBreadcrumbSchema = (items) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
};

// Schema.org ItemList para catálogo de productos
const getCatalogItemListSchema = (products) => {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": products.map((p, index) => {
      const cat = (p.categoria || p.especie || "productos").toLowerCase().trim();
      return {
        "@type": "ListItem",
        "position": index + 1,
        "url": `${SITE_URL}/${cat}/${p.slug}`,
        "name": p.nombre_producto
      };
    })
  };
};

// Nombres descriptivos de especies/categorías
const CATEGORIA_NOMBRES = {
  vacuno: "Cortes Vacunos",
  cerdo: "Cortes de Cerdo",
  pollo: "Pollo Fresco",
  preparados: "Preparados y Embutidos",
  productos: "Catálogo General de Productos"
};

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE !== "false"; // Activo por defecto mientras está en preparación

/**
 * Renderizador de HTML Estático y Semántico para Bots (Googlebot, Bing, redes sociales)
 */
const renderSeoHtml = async (req, res) => {
  let requestPath = req.query.path || req.originalUrl || "/";
  if (requestPath.startsWith("/api/seo/render")) {
    requestPath = requestPath.replace("/api/seo/render", "");
  }
  
  if (!requestPath || requestPath === "") requestPath = "/";

  // ─── MODO MANTENIMIENTO ACTIVO PARA BOTS ───
  if (MAINTENANCE_MODE) {
    const html = `<!DOCTYPE html>
<html lang="es-AR">
<head>
  <meta charset="UTF-8">
  <title>Abastecedora Valette</title>
  <meta name="description" content="Abastecedora Valette. Sitio web en mantenimiento. Visitanos en nuestro sitio web oficial abastecedoravalette.com">
  <meta name="robots" content="noindex, nofollow">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 60px auto; padding: 24px; text-align: center; color: #1e293b; background-color: #ffffff;">
  <h1 style="font-size: 26px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; color: #0f172a;">Abastecedora Valette</h1>
  <p style="font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 32px;">Sitio web en mantenimiento</p>
  <p style="margin-bottom: 40px;">
    <a href="https://abastecedoravalette.com" style="display: inline-block; padding: 14px 28px; background: #003366; color: #ffffff; font-weight: bold; text-decoration: none; border-radius: 12px; font-size: 15px;">Visitar sitio web oficial (abastecedoravalette.com) →</a>
  </p>
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;">
  <div style="display: flex; gap: 16px; text-align: left; justify-content: center; flex-wrap: wrap;">
    <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; flex: 1; min-width: 220px; background: #f8fafc;">
      <h3 style="font-size: 12px; color: #003366; text-transform: uppercase; margin: 0 0 6px 0;">Sucursal Luis Guillón</h3>
      <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">Av. Luciano Valette 1696</p>
      <p style="margin: 0; font-size: 12px; color: #64748b;">Lun. a Sáb. de 07:00 a 15:00 hs</p>
    </div>
    <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; flex: 1; min-width: 220px; background: #f8fafc;">
      <h3 style="font-size: 12px; color: #003366; text-transform: uppercase; margin: 0 0 6px 0;">Sucursal Moreno</h3>
      <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">Av. del Libertador 4200</p>
      <p style="margin: 0; font-size: 12px; color: #64748b;">Lun. a Sáb. de 07:00 a 15:00 hs</p>
    </div>
  </div>
</body>
</html>`;
    res.header("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  }

  // Obtenemos info base de la sucursal
  let sucursal = null;
  try {
    const sucRes = await pool.query(`SELECT * FROM sucursales WHERE activa = true LIMIT 1`);
    if (sucRes.rows.length > 0) sucursal = sucRes.rows[0];
  } catch (e) {}

  let title = "Abastecedora Valette | Carnicería Online y Cortes de Calidad";
  let description = "Venta mayorista y minorista de cortes de carne vacuna, cerdo, pollo y preparados artesanales. Producción propia y envíos a domicilio en Luis Guillón y Zona Sur.";
  let image = `${SITE_URL}/logo192.png`;
  let schemas = [getButcherShopSchema(sucursal), getNavigationSchema()];
  let bodyContent = "";

  const pathParts = requestPath.split("?")[0].split("/").filter(Boolean);

  try {
    // ─── CASO 1: PÁGINA DE PRODUCTO ESPECÍFICO (/:categoria/:slug) ───
    if (pathParts.length >= 2) {
      const slug = pathParts[pathParts.length - 1];
      const prodRes = await pool.query(
        `SELECT * FROM catalogo WHERE slug = $1 AND activo = true LIMIT 1`,
        [slug]
      );

      if (prodRes.rows.length > 0) {
        const product = prodRes.rows[0];
        const categoriaSlug = (product.categoria || product.especie || "productos").toLowerCase().trim();
        const categoriaNombre = CATEGORIA_NOMBRES[categoriaSlug] || "Cortes";

        title = `${product.nombre_producto} | Abastecedora Valette`;
        const cleanedProductDesc = cleanTextForMeta(product.descripcion, 160);
        description = cleanedProductDesc || `Comprá ${product.nombre_producto} al mejor precio en Abastecedora Valette. Venta online con retiro en sucursal o envío en el día.`;
        image = product.imagen_url || image;

        // Schemas
        schemas.push(getProductSchema(product));
        schemas.push(
          getBreadcrumbSchema([
            { name: "Inicio", url: `${SITE_URL}/` },
            { name: categoriaNombre, url: `${SITE_URL}/${categoriaSlug}` },
            { name: product.nombre_producto, url: `${SITE_URL}/${categoriaSlug}/${product.slug}` }
          ])
        );

        // Productos relacionados
        const relRes = await pool.query(
          `SELECT slug, nombre_producto, precio, unidad_medida, imagen_url, categoria, especie 
           FROM catalogo 
           WHERE activo = true AND id != $1 AND (categoria = $2 OR especie = $3)
           LIMIT 4`,
          [product.id, product.categoria, product.especie]
        );

        const precioFormateado = Number(product.precio).toLocaleString("es-AR", {
          style: "currency",
          currency: "ARS",
          maximumFractionDigits: 0
        });

        bodyContent = `
          <header style="margin-bottom: 24px;">
            <a href="/" style="color: #003366; text-decoration: none; font-weight: bold;">← Volver a Abastecedora Valette</a>
            <nav aria-label="Navegación de categorías" style="margin-top: 12px; display: flex; gap: 12px; flex-wrap: wrap;">
              <a href="/vacuno">Cortes Vacunos</a> |
              <a href="/cerdo">Cortes de Cerdo</a> |
              <a href="/pollo">Pollo Fresco</a> |
              <a href="/preparados">Preparados</a> |
              <a href="/sucursales">Sucursales</a> |
              <a href="/envios">Envíos</a>
            </nav>
          </header>
          <main>
            <nav aria-label="Migas de pan" style="font-size: 14px; margin-bottom: 16px;">
              <a href="/">Inicio</a> &gt; <a href="/${categoriaSlug}">${categoriaNombre}</a> &gt; <strong>${escapeHtmlAttr(product.nombre_producto)}</strong>
            </nav>
            <article>
              <h1>${escapeHtmlAttr(product.nombre_producto)}</h1>
              <p style="font-size: 20px; font-weight: bold; color: #16a34a;">
                Precio: ${precioFormateado} / ${escapeHtmlAttr(product.unidad_medida || "kg")}
              </p>
              <p>
                <strong>Disponibilidad:</strong> ${product.sin_stock ? "Temporalmente agotado" : "En stock - Entrega inmediata"}
              </p>
              ${product.imagen_url ? `<img src="${escapeHtmlAttr(product.imagen_url)}" alt="${escapeHtmlAttr(product.nombre_producto)}" style="max-width: 100%; height: auto; border-radius: 8px;" />` : ""}
              <div style="margin-top: 16px; line-height: 1.6;">
                <h2>Descripción del corte</h2>
                <p>${escapeHtmlAttr(cleanTextForMeta(product.descripcion, 500))}</p>
              </div>
            </article>

            ${relRes.rows.length > 0 ? `
              <section style="margin-top: 32px; border-top: 1px solid #e5e5e5; pt-4">
                <h2>Otros cortes de ${escapeHtmlAttr(categoriaNombre)} que te pueden interesar:</h2>
                <ul>
                  ${relRes.rows.map(r => {
                    const rCat = (r.categoria || r.especie || "productos").toLowerCase().trim();
                    return `<li><a href="/${rCat}/${r.slug}">${escapeHtmlAttr(r.nombre_producto)}</a> - $${Number(r.precio).toLocaleString("es-AR")}</li>`;
                  }).join("")}
                </ul>
              </section>
            ` : ""}
          </main>
        `;
      }
    }

    // ─── CASO 2: HOME (/) O PÁGINA DE CATEGORÍA (/:categoria) ───
    if (!bodyContent) {
      const categoriaFiltro = pathParts.length === 1 && pathParts[0] !== "productos" && CATEGORIA_NOMBRES[pathParts[0]]
        ? pathParts[0]
        : null;

      let catalogQuery = `SELECT * FROM catalogo WHERE activo = true`;
      let queryParams = [];

      if (categoriaFiltro) {
        catalogQuery += ` AND (LOWER(categoria) = $1 OR LOWER(especie) = $1)`;
        queryParams.push(categoriaFiltro);
        title = `${CATEGORIA_NOMBRES[categoriaFiltro]} | Abastecedora Valette`;
        description = `Conocé nuestros mejores ${CATEGORIA_NOMBRES[categoriaFiltro]} de ternera, cerdo o pollo directo de criadero propio. Precios mayoristas y minoristas con entrega en Luis Guillón.`;
      }

      catalogQuery += ` ORDER BY destacar DESC, id ASC`;
      const catRes = await pool.query(catalogQuery, queryParams);
      const productos = catRes.rows;

      if (productos.length > 0) {
        schemas.push(getCatalogItemListSchema(productos));
      }

      bodyContent = `
        <header style="margin-bottom: 24px;">
          <h1>Abastecedora Valette — Carnicería Online y Cortes Seleccionados</h1>
          <p style="font-size: 16px; line-height: 1.5;">${escapeHtmlAttr(description)}</p>
          <nav aria-label="Categorías principales" style="margin: 16px 0; display: flex; gap: 12px; flex-wrap: wrap; background: #f4f6f8; padding: 12px; border-radius: 8px;">
            <a href="/productos" style="font-weight: bold; color: #003366;">Todos los Productos</a>
            <a href="/vacuno" style="color: #003366;">Cortes Vacunos</a>
            <a href="/cerdo" style="color: #003366;">Cortes de Cerdo</a>
            <a href="/pollo" style="color: #003366;">Pollo Fresco</a>
            <a href="/preparados" style="color: #003366;">Preparados y Embutidos</a>
            <a href="/sucursales" style="color: #003366;">Sucursales y Horarios</a>
            <a href="/envios" style="color: #003366;">Envíos y Cobertura</a>
          </nav>
        </header>
        <main>
          <h2>${categoriaFiltro ? CATEGORIA_NOMBRES[categoriaFiltro] : "Catálogo Completo de Cortes Disponibles"}</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin-top: 16px;">
            ${productos.map(p => {
              const cat = (p.categoria || p.especie || "productos").toLowerCase().trim();
              const prodUrl = `/${cat}/${p.slug}`;
              const desc = cleanTextForMeta(p.descripcion, 100);
              const precio = Number(p.precio).toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS",
                maximumFractionDigits: 0
              });

              return `
                <article style="border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px;">
                  <a href="${prodUrl}" style="text-decoration: none; color: inherit;">
                    ${p.imagen_url ? `<img src="${escapeHtmlAttr(p.imagen_url)}" alt="${escapeHtmlAttr(p.nombre_producto)}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 4px;" loading="lazy" />` : ""}
                    <h3 style="margin: 8px 0 4px; color: #003366;">${escapeHtmlAttr(p.nombre_producto)}</h3>
                  </a>
                  <p style="font-weight: bold; color: #16a34a; margin: 4px 0;">${precio} / ${escapeHtmlAttr(p.unidad_medida || "kg")}</p>
                  <p style="font-size: 13px; color: #64748b; margin: 4px 0;">${escapeHtmlAttr(desc)}</p>
                  <a href="${prodUrl}" style="display: inline-block; margin-top: 8px; font-size: 13px; font-weight: bold; color: #003366;">Ver corte y detalles →</a>
                </article>
              `;
            }).join("")}
          </div>
        </main>
        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b;">
          <p><strong>Abastecedora Valette</strong> — Sucursal Luis Guillón: Av. Luciano Valette 1696 (Horarios: Lun a Sáb de 07:00 a 15:00 hs).</p>
          <p>Envíos refrigerados directos en Luis Guillón, Esteban Echeverría y Zona Sur.</p>
        </footer>
      `;
    }
  } catch (err) {
    console.error("Error en renderSeoHtml:", err);
    bodyContent = `<h1>Abastecedora Valette</h1><p>${escapeHtmlAttr(description)}</p><a href="/productos">Ver Catálogo</a>`;
  }

  const safeTitle = escapeHtmlAttr(title);
  const safeDescription = escapeHtmlAttr(description);
  const safeImage = escapeHtmlAttr(image);
  const safeUrl = escapeHtmlAttr(`${SITE_URL}${requestPath}`);

  const html = `<!DOCTYPE html>
<html lang="es-AR">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <link rel="canonical" href="${safeUrl}">

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:site_name" content="Abastecedora Valette">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${safeImage}">
  <meta property="og:url" content="${safeUrl}">
  <meta property="og:type" content="website">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${safeImage}">
  
  <!-- Schema.org Estructurado (JSON-LD) -->
  <script type="application/ld+json">
    ${JSON.stringify(schemas)}
  </script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; color: #1e293b;">
  ${bodyContent}
</body>
</html>`;

  res.header("Content-Type", "text/html; charset=utf-8");
  res.send(html);
};

/**
 * Generador de Sitemap.xml Dinámico con imágenes de productos para Google Search Console
 */
const generateSitemap = async (req, res) => {
  try {
    if (MAINTENANCE_MODE) {
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
      res.header("Content-Type", "application/xml; charset=utf-8");
      return res.send(sitemap);
    }

    const productos = await pool.query(
      `SELECT slug, categoria, especie, nombre_producto, descripcion, imagen_url, actualizado_en 
       FROM catalogo 
       WHERE activo = true 
       ORDER BY id ASC`
    );

    const staticRoutes = [
      { loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" },
      { loc: `${SITE_URL}/productos`, changefreq: "daily", priority: "0.9" },
      { loc: `${SITE_URL}/vacuno`, changefreq: "daily", priority: "0.9" },
      { loc: `${SITE_URL}/cerdo`, changefreq: "daily", priority: "0.9" },
      { loc: `${SITE_URL}/pollo`, changefreq: "daily", priority: "0.9" },
      { loc: `${SITE_URL}/preparados`, changefreq: "daily", priority: "0.9" },
      { loc: `${SITE_URL}/sucursales`, changefreq: "weekly", priority: "0.8" },
      { loc: `${SITE_URL}/envios`, changefreq: "weekly", priority: "0.7" },
    ];

    let urls = "";

    // Rutas estáticas principales
    for (const r of staticRoutes) {
      urls += `
  <url>
    <loc>${r.loc}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`;
    }

    // Rutas de productos dinámicas con soporte de Google Images
    for (const p of productos.rows) {
      const categoriaStr = (p.categoria || p.especie || "productos").toLowerCase().trim();
      const prodUrl = `${SITE_URL}/${categoriaStr}/${p.slug}`;
      const lastMod = p.actualizado_en
        ? new Date(p.actualizado_en).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      let imageBlock = "";
      if (p.imagen_url) {
        const safeImgUrl = escapeXml(p.imagen_url);
        const safeImgTitle = escapeXml(p.nombre_producto);
        imageBlock = `
    <image:image>
      <image:loc>${safeImgUrl}</image:loc>
      <image:title>${safeImgTitle}</image:title>
    </image:image>`;
      }

      urls += `
  <url>
    <loc>${prodUrl}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imageBlock}
  </url>`;
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;

    res.header("Content-Type", "application/xml; charset=utf-8");
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
