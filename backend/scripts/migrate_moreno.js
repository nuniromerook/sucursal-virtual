// backend/scripts/migrate_moreno.js
const pool = require("../src/db");

async function migrateMoreno() {
  try {
    console.log("🏢 [Migración] Verificando sucursal Moreno...");
    const horarios = {
      lunes: { apertura: "06:00", cierre: "15:00", abierto: true },
      martes: { apertura: "06:00", cierre: "15:00", abierto: true },
      miercoles: { apertura: "06:00", cierre: "15:00", abierto: true },
      jueves: { apertura: "06:00", cierre: "15:00", abierto: true },
      viernes: { apertura: "06:00", cierre: "15:00", abierto: true },
      sabado: { apertura: "06:00", cierre: "15:00", abierto: true },
      domingo: { apertura: "", cierre: "", abierto: false },
    };

    await pool.query(
      `INSERT INTO sucursales (nombre, slug, direccion, ciudad, telefono, horario_atencion, activa, horarios_apertura)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7)
       ON CONFLICT (slug) DO UPDATE SET
         horario_atencion = EXCLUDED.horario_atencion,
         horarios_apertura = EXCLUDED.horarios_apertura,
         direccion = EXCLUDED.direccion,
         ciudad = EXCLUDED.ciudad,
         actualizado_en = NOW();`,
      [
        "Moreno",
        "moreno",
        "Av. del Libertador 4200",
        "Moreno",
        "1130531313",
        "Lunes a Sábados de 06:00 a 15:00 hs",
        JSON.stringify(horarios),
      ]
    );

    console.log("✅ [Migración] Sucursal Moreno guardada con éxito con horarios 06:00 a 15:00 hs.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error en migración de Moreno:", err);
    process.exit(1);
  }
}

migrateMoreno();
