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

const router = Router();

router.get("/banners", getBanners);
router.get("/banners/admin", getBannersAdmin);
router.post("/banners/:id/impresion", registrarImpresionBanner);
router.post("/banners/:id/click", registrarClickBanner);
router.post("/banners", createBanner);
router.put("/banners/:id", updateBanner);
router.patch("/banners/:id/estado", toggleActivoBanner);
router.delete("/banners/:id", deleteBanner);

module.exports = router;
