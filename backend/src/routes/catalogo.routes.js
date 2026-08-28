// backend/src/routes/catalogo.routes.js
const { Router } = require("express");
const {
  getCatalogo,
  getCatalogoItem,
  createCatalogoItem,
  updateCatalogoItem,
  toggleActivoCatalogoItem,
  deleteCatalogoItem,
  createPromo,
  updatePromo,
  deletePromo,
  toggleFavorito,
  getFavoritosRanking,
} = require("../controllers/catalogo.controller");

const router = Router();

router.get("/catalogo", getCatalogo);
router.get("/catalogo/favoritos/ranking", getFavoritosRanking);
router.get("/catalogo/:id", getCatalogoItem);
router.post("/catalogo", createCatalogoItem);
router.put("/catalogo/:id", updateCatalogoItem);
router.patch("/catalogo/:id/estado", toggleActivoCatalogoItem);
router.delete("/catalogo/:id", deleteCatalogoItem);

router.post("/catalogo/:id/favorito", toggleFavorito);

router.post("/catalogo/:id/promos", createPromo);
router.put("/catalogo/:id/promos/:promoId", updatePromo);
router.delete("/catalogo/:id/promos/:promoId", deletePromo);

module.exports = router;
