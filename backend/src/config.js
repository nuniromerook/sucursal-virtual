// src/config.js
require("dotenv").config();

// Soporte para DATABASE_URL (Neon, Supabase, Railway, etc.)
// o las variables individuales DB_USER, DB_PASSWORD, etc. (desarrollo local)
const isNeon =
  (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("neon.tech")) ||
  (process.env.DB_HOST && process.env.DB_HOST.includes("neon.tech")) ||
  process.env.DB_SSL === "true";

const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isNeon || process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    }
  : {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      ssl: isNeon || process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    };

module.exports = {
  db: dbConfig,
  port: process.env.PORT || 3000,
};
