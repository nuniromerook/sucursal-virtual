// src/routes/products.routes.js
const { Router } = require("express");
const {
  getHomeProducts,
  getProducts,
  getProduct,
  getAllProducts,
  getProductFromCatalog,
  createProduct,
} = require("../controllers/products.controller");

const router = Router();

// Endpoint unificado para la pantalla principal
router.get("/products/home", getHomeProducts);

router.get("/catalog", getAllProducts);
router.get("/catalog/product/:id", getProductFromCatalog);
router.get("/products", getProducts);
router.get("/products/:id", getProduct);
router.post("/products", createProduct);

module.exports = router;
