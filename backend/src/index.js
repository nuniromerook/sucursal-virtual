const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const catalogoRoutes = require("./routes/catalogo.routes");
const sucursalRoutes = require("./routes/sucursales.routes");
const pedidosRoutes = require("./routes/pedidos.routes");
const clientesRoutes = require("./routes/clientes.routes");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(catalogoRoutes);
app.use(sucursalRoutes);
app.use(pedidosRoutes);
app.use(clientesRoutes);

app.get("/", (req, res) => {
  res.send("Sucursal Virtual running!");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
