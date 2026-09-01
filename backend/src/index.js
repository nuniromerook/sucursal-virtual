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
const notificacionesRoutes = require("./routes/notificaciones.routes");
const seoRoutes = require("./routes/seo.routes");

const app = express();
const httpServer = http.createServer(app);

// CORS: En desarrollo permite todo, en producción usa ALLOWED_ORIGINS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["*"];

app.use(
  cors({
    origin: allowedOrigins.includes("*") ? "*" : (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS bloqueado: ${origin}`));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Inicializar Socket.io sobre el servidor HTTP
initSocket(httpServer);
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
app.use(notificacionesRoutes);
app.use(seoRoutes);

app.get("/", (req, res) => {
  res.send("Sucursal Virtual running with Socket.io!");
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server & Socket.io running on port ${PORT}`);
});
