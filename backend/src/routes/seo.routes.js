const express = require("express");
const { renderSeoHtml, generateSitemap } = require("../seoHandler");

const router = express.Router();

router.get("/api/seo/render", renderSeoHtml);
router.get("/sitemap.xml", generateSitemap);

module.exports = router;
