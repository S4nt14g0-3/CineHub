const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('⚡ Conectado exitosamente a Neon DB (PostgreSQL)');
});

module.exports = pool;
/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Crea un Pool de PostgreSQL usando DATABASE_URL del .env.
   - ssl.rejectUnauthorized=false es necesario para Neon.
   - Se exporta como módulo único (pool compartido por todos los controllers).
   ============================================================ */
