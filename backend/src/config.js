// src/config.js
require("dotenv").config();

// Soporte para DATABASE_URL (Neon, Supabase, Railway, etc.)
// o las variables individuales DB_USER, DB_PASSWORD, etc. (desarrollo local)
const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Necesario para Neon.tech y otros proveedores cloud
    }
  : {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
    };

module.exports = {
  db: dbConfig,
  port: process.env.PORT || 3000,
};
