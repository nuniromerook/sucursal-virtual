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
} = require("../controllers/banners.controller");

const { requireAuth } = require("../utils/auth");

const router = Router();

router.get("/banners", getBanners);
router.get("/banners/admin", requireAuth, getBannersAdmin);
router.post("/banners/:id/impresion", registrarImpresionBanner);
router.post("/banners/:id/click", registrarClickBanner);
router.post("/banners", requireAuth, createBanner);
router.put("/banners/:id", requireAuth, updateBanner);
router.patch("/banners/:id/estado", requireAuth, toggleActivoBanner);
router.delete("/banners/:id", requireAuth, deleteBanner);

module.exports = router;
