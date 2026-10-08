require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

function qs(sql) {
  return sql;
}

async function main() {
  try {
    await pool.query('BEGIN');

    const idsAntes = await pool.query(qs('SELECT id, titulo FROM peliculas ORDER BY id'));
    console.log('PELICULAS ANTES:', JSON.stringify(idsAntes.rows));

    const funcsAntes = await pool.query(qs(
      "SELECT id, pelicula_id, (SELECT titulo FROM peliculas p WHERE p.id = f.pelicula_id) AS titulo, sala_id, precio_base, fecha_hora FROM funciones ORDER BY id"
    ));
    console.log('FUNCIONES ANTES (total):', funcsAntes.rows.length);

    const funcsDuplicadas = await pool.query(qs(
      "WITH conteo AS (" +
        "SELECT id, ROW_NUMBER() OVER (PARTITION BY pelicula_id, sala_id, precio_base, date_trunc('minute', fecha_hora) ORDER BY id) AS rn FROM funciones" +
      ") SELECT id FROM conteo WHERE rn > 1 ORDER BY id"
    ));

    const idsFuncsDuplicadas = funcsDuplicadas.rows.map((r) => r.id);
    console.log('IDs funciones duplicadas a eliminar:', idsFuncsDuplicadas);

    for (const id of idsFuncsDuplicadas) {
      await pool.query('DELETE FROM funciones WHERE id = $1', [id]);
    }

    const pelisDuplicadas = await pool.query(qs(
      "WITH conteo AS (" +
        "SELECT id, ROW_NUMBER() OVER (PARTITION BY titulo ORDER BY id) AS rn FROM peliculas" +
      ") SELECT id FROM conteo WHERE rn > 1 ORDER BY id"
    ));

    const idsPelisDuplicadas = pelisDuplicadas.rows.map((r) => r.id);
    console.log('IDs peliculas duplicadas a eliminar:', idsPelisDuplicadas);

    for (const id of idsPelisDuplicadas) {
      await pool.query('DELETE FROM pelicula_generos WHERE pelicula_id = $1', [id]);
      await pool.query('DELETE FROM funciones WHERE pelicula_id = $1', [id]);
      await pool.query('DELETE FROM peliculas WHERE id = $1', [id]);
    }

    await pool.query('COMMIT');

    const idsDespues = await pool.query(qs('SELECT id, titulo FROM peliculas ORDER BY id'));
    console.log('PELICULAS DESPUES (total):', idsDespues.rows.length);
    idsDespues.rows.forEach((r) => console.log(' -', r.id, r.titulo));

    const funcsDespues = await pool.query(qs(
      "SELECT f.id, p.titulo AS pelicula, s.nombre AS sala, c.nombre AS cine, f.fecha_hora, f.precio_base FROM funciones f JOIN peliculas p ON f.pelicula_id = p.id JOIN salas s ON f.sala_id = s.id JOIN cines c ON s.cine_id = c.id ORDER BY f.id"
    ));
    console.log('FUNCIONES DESPUES (total):', funcsDespues.rows.length);
    funcsDespues.rows.forEach(
      (r) =>
        console.log(
          ' -',
          r.id,
          r.pelicula,
          '|',
          r.sala,
          r.cine,
          '|',
          new Date(r.fecha_hora).toISOString(),
          '|',
          r.precio_base
        )
    );
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('ERROR', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('FALLA EXTERIOR', err.message);
  process.exit(1);
});
