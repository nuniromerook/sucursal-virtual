const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const productRoutes = require("./routes/products.routes");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(productRoutes);

app.get("/", (req, res) => {
  res.send("Sucursal Virtual running!");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
