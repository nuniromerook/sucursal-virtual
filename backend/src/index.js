const express = require("express");
const http = require("http");
const morgan = require("morgan");
const cors = require("cors");
const { initSocket } = require("./socket");

const catalogoRoutes = require("./routes/catalogo.routes");
const sucursalRoutes = require("./routes/sucursales.routes");
const pedidosRoutes = require("./routes/pedidos.routes");
const clientesRoutes = require("./routes/clientes.routes");
const carritosRoutes = require("./routes/carritos.routes");
const empleadosRoutes = require("./routes/empleados.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const bannersRoutes = require("./routes/banners.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();
const httpServer = http.createServer(app);

// Inicializar Socket.io sobre el servidor HTTP
initSocket(httpServer);

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(catalogoRoutes);
app.use(sucursalRoutes);
app.use(pedidosRoutes);
app.use(clientesRoutes);
app.use(carritosRoutes);
app.use(empleadosRoutes);
app.use(analyticsRoutes);
app.use(bannersRoutes);
app.use(dashboardRoutes);

app.get("/", (req, res) => {
  res.send("Sucursal Virtual running with Socket.io!");
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server & Socket.io running on port ${PORT}`);
});
