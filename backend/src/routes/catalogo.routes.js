// backend/src/routes/catalogo.routes.js
const { Router } = require("express");
const {
  getCatalogo,
  getCatalogoItem,
  createCatalogoItem,
  updateCatalogoItem,
  toggleStockCatalogoItem,
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

const { requireStaff, requireAdmin } = require("../utils/auth");
const { aiLimiter } = require("../middlewares/rateLimiter");

const router = Router();

router.get("/catalogo", getCatalogo);
router.get("/catalogo/favoritos/ranking", getFavoritosRanking);
router.get("/catalogo/favoritos/cliente/:clienteId", getFavoritosCliente);
router.post("/catalogo/favoritos/sincronizar", sincronizarFavoritos);
router.post("/catalogo/generar-ficha-ia", requireAdmin, aiLimiter, generarFichaIA);
router.get("/catalogo/:id", getCatalogoItem);
router.post("/catalogo", requireAdmin, createCatalogoItem);
router.put("/catalogo/:id", requireAdmin, updateCatalogoItem);
router.patch("/catalogo/:id/stock", requireStaff, toggleStockCatalogoItem);
router.patch("/catalogo/:id/estado", requireStaff, toggleActivoCatalogoItem);
router.delete("/catalogo/:id", requireAdmin, deleteCatalogoItem);

router.post("/catalogo/:id/favorito", toggleFavorito);

router.post("/catalogo/:id/promos", requireAdmin, createPromo);
router.put("/catalogo/:id/promos/:promoId", requireAdmin, updatePromo);
router.delete("/catalogo/:id/promos/:promoId", requireAdmin, deletePromo);

module.exports = router;
