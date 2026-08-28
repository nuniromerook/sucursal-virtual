// backend/src/routes/banners.routes.js
const { Router } = require("express");
const {
  getBanners,
  registrarImpresionBanner,
  registrarClickBanner,
  createBanner,
  deleteBanner,
} = require("../controllers/banners.controller");

const router = Router();

router.get("/banners", getBanners);
router.post("/banners/:id/impresion", registrarImpresionBanner);
router.post("/banners/:id/click", registrarClickBanner);
router.post("/banners", createBanner);
router.delete("/banners/:id", deleteBanner);

module.exports = router;
