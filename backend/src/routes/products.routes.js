// src/routes/products.routes.js
const { Router } = require("express");
const {
  getAllProducts,
  getProducts,
  getProduct,
  getProductFromCatalog,
  createProduct,
} = require("../controllers/products.controller");

const router = Router();

router.get("/catalog", getAllProducts); // obtener todos los productos del catalogo
router.get("/catalog/product/:id", getProductFromCatalog); // obtener producto por id desde el catalogo
router.get("/products", getProducts); // obtener productos con precio y stock por sucursal
router.get("/products/:id", getProduct); // obtener producto por id con precio y stock

router.post("/products", createProduct);

router.put("/products", (req, res) => {
  res.send("Updating a product");
});

router.delete("/products", (req, res) => {
  res.send("Deleting a product");
});

module.exports = router;
