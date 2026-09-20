const express = require("express");
const http = require("http");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { initSocket } = require("./socket");
const { apiLimiter } = require("./middlewares/rateLimiter");

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
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

const httpServer = http.createServer(app);

// CORS: Permite dominios oficiales, variables de entorno y localhost de desarrollo
const defaultAllowedOrigins = [
  "https://abastecedoravalette.digital",
  "https://www.abastecedoravalette.digital",
  "https://admin.abastecedoravalette.digital",
  "https://api.abastecedoravalette.digital",
];

const envAllowed = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envAllowed]));

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  // Permitir localhost / 127.0.0.1 en cualquier puerto
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  // Permitir cualquier subdominio o dominio principal abastecedoravalette.digital (con o sin www)
  if (/^https:\/\/(.*\.)?abastecedoravalette\.digital$/.test(origin)) return true;
  // Permitir lista configurada o wildcard
  if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }

      console.warn(`[CORS] Origen bloqueado: ${origin}`);
      callback(new Error(`CORS bloqueado: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  })
);

// Inicializar Socket.io sobre el servidor HTTP
initSocket(httpServer);
app.use(morgan("dev"));
app.use(express.json());
app.use(apiLimiter);

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

// Middleware centralizado de captura de errores
app.use((err, req, res, next) => {
  console.error("💥 [Unhandled Express Error]:", err.stack || err.message);
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Ha ocurrido un error interno en el servidor."
        : err.message || "Error interno del servidor",
  });
});

// Eventos de proceso para prevenir caídas silenciosas
process.on("unhandledRejection", (reason) => {
  console.error("💥 [Unhandled Rejection at Promise]:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("💥 [Uncaught Exception]:", err.message, err.stack);
});

const pool = require("./db");

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, async () => {
  console.log(`Server & Socket.io running on port ${PORT}`);
  try {
    await pool.query("ALTER TABLE catalogo ADD COLUMN IF NOT EXISTS sin_stock BOOLEAN DEFAULT false;");
    console.log("✅ [DB Auto-Migration] Columna 'sin_stock' en tabla 'catalogo' verificada/creada.");
  } catch (err) {
    console.error("⚠️ [DB Auto-Migration Error]:", err.message);
  }
});
