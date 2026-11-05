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
  getFavoritosCliente,
  sincronizarFavoritos,
  generarFichaIA,
} = require("../controllers/catalogo.controller");

const { requireAuth } = require("../utils/auth");
const { aiLimiter } = require("../middlewares/rateLimiter");

const router = Router();

router.get("/catalogo", getCatalogo);
router.get("/catalogo/favoritos/ranking", getFavoritosRanking);
router.get("/catalogo/favoritos/cliente/:clienteId", getFavoritosCliente);
router.post("/catalogo/favoritos/sincronizar", sincronizarFavoritos);
router.post("/catalogo/generar-ficha-ia", requireAuth, aiLimiter, generarFichaIA);
router.get("/catalogo/:id", getCatalogoItem);
router.post("/catalogo", requireAuth, createCatalogoItem);
router.put("/catalogo/:id", requireAuth, updateCatalogoItem);
router.patch("/catalogo/:id/estado", requireAuth, toggleActivoCatalogoItem);
router.delete("/catalogo/:id", requireAuth, deleteCatalogoItem);

router.post("/catalogo/:id/favorito", toggleFavorito);

router.post("/catalogo/:id/promos", requireAuth, createPromo);
router.put("/catalogo/:id/promos/:promoId", requireAuth, updatePromo);
router.delete("/catalogo/:id/promos/:promoId", requireAuth, deletePromo);

module.exports = router;
