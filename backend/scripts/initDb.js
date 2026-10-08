// Script de inicialización de la base de datos.
// Ejecuta el script canónico database/CineHub.sql (crea las 15 tablas
// y carga los datos semilla). Uso:  npm run db:setup
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function main() {
  const sqlPath = path.join(__dirname, '..', '..', 'database', 'CineHub.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = await pool.connect();
  try {
    console.log('⏳ Ejecutando database/CineHub.sql ...');
    await client.query(sql);
    console.log('✅ Base de datos creada y poblada correctamente.');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Ejecuta database/CineHub.sql completo (crea 15 tablas y datos semilla).
   - Se lanza con: npm run db:setup.
   - ¡OJO! El SQL hace DROP TABLE: borra y recrea toda la base.
   ============================================================ */
