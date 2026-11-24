const { Router } = require("express");
const {
  getBanners,
  getBannersAdmin,
  registrarImpresionBanner,
  registrarClickBanner,
  createBanner,
  updateBanner,
  toggleActivoBanner,
  deleteBanner,
  resetBannersAnalytics,
  resetSingleBannerAnalytics,
} = require("../controllers/banners.controller");

const { requireAdmin } = require("../utils/auth");

const router = Router();

router.get("/banners", getBanners);
router.get("/banners/admin", requireAdmin, getBannersAdmin);
router.post("/banners/reset-analytics", requireAdmin, resetBannersAnalytics);
router.post("/banners/:id/reset-analytics", requireAdmin, resetSingleBannerAnalytics);
router.post("/banners/:id/impresion", registrarImpresionBanner);
router.post("/banners/:id/click", registrarClickBanner);
router.post("/banners", requireAdmin, createBanner);
router.put("/banners/:id", requireAdmin, updateBanner);
router.patch("/banners/:id/estado", requireAdmin, toggleActivoBanner);
router.delete("/banners/:id", requireAdmin, deleteBanner);

module.exports = router;
