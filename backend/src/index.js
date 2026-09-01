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

// CORS: Permite dominios oficiales, variables de entorno y localhost de desarrollo
const defaultAllowedOrigins = [
  "https://abastecedoravalette.digital",
  "https://admin.abastecedoravalette.digital",
  "https://api.abastecedoravalette.digital",
];

const envAllowed = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envAllowed]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (como Postman, apps móviles o llamadas internas)
      if (!origin) return callback(null, true);

      // Permitir cualquier localhost / 127.0.0.1 en cualquier puerto para desarrollo
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      // Permitir dominios configurados
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`[CORS] Origen bloqueado: ${origin}`);
      callback(new Error(`CORS bloqueado: ${origin}`));
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
