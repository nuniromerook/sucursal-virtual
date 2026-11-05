const { Pool } = require("pg");
const { db } = require("./config");

const pool = new Pool(db);

pool.on("error", (err) => {
  console.error(
    "⚠️ [PostgreSQL Pool] Error inesperado en cliente inactivo:",
    err.message,
  );
});

module.exports = pool;
