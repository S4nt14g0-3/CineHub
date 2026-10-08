const pool = require('../config/db');

// Reemplaza los géneros asociados a una película
const guardarGeneros = async (cliente, peliculaId, generos) => {
  await cliente.query('DELETE FROM pelicula_generos WHERE pelicula_id = $1', [peliculaId]);
  if (Array.isArray(generos)) {
    for (const generoId of generos) {
      await cliente.query(
        'INSERT INTO pelicula_generos (pelicula_id, genero_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [peliculaId, generoId]
      );
    }
  }
};

// 1. Obtener TODAS las películas (Cartelera) con su clasificación y géneros
const getPeliculas = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.titulo,
        p.duracion_minutos,
        p.sinopsis,
        p.poster_url,
        c.codigo AS clasificacion,
        COALESCE(string_agg(g.nombre, ', ' ORDER BY g.nombre), '') AS genero
      FROM peliculas p
      JOIN clasificaciones c ON c.id = p.clasificacion_id
      LEFT JOIN pelicula_generos pg ON pg.pelicula_id = p.id
      LEFT JOIN generos g ON g.id = pg.genero_id
      GROUP BY p.id, c.codigo
      ORDER BY p.id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener catálogo de películas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// 2. Obtener UNA película por ID con sus funciones futuras
const getPeliculaPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const peliculaResult = await pool.query(
      `SELECT
         p.id,
         p.titulo,
         p.duracion_minutos,
         p.sinopsis,
         p.poster_url,
         c.codigo AS clasificacion,
         COALESCE(string_agg(DISTINCT g.nombre, ', '), '') AS genero
       FROM peliculas p
       JOIN clasificaciones c ON c.id = p.clasificacion_id
       LEFT JOIN pelicula_generos pg ON pg.pelicula_id = p.id
       LEFT JOIN generos g ON g.id = pg.genero_id
       WHERE p.id = $1
       GROUP BY p.id, c.codigo`,
      [id]
    );

    if (peliculaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    const pelicula = peliculaResult.rows[0];

    const funcionesResult = await pool.query(
      `SELECT f.id, f.fecha_hora, f.precio_base AS precio_boleta,
              s.nombre AS sala_nombre, ci.nombre AS cine_nombre
       FROM funciones f
       JOIN salas s ON f.sala_id = s.id
       JOIN cines ci ON ci.id = s.cine_id
       WHERE f.pelicula_id = $1 AND f.fecha_hora >= NOW()
       ORDER BY f.fecha_hora ASC`,
      [id]
    );

    pelicula.funciones = funcionesResult.rows;

    res.json(pelicula);
  } catch (error) {
    console.error('Error al obtener la película por ID:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// 3. Crear película (Administrador)
const crearPelicula = async (req, res) => {
  const { titulo, duracion_minutos, sinopsis, poster_url, clasificacion_id, generos } = req.body;

  if (!titulo || !duracion_minutos || !clasificacion_id) {
    return res.status(400).json({ error: 'Título, duración y clasificación son obligatorios' });
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const result = await cliente.query(
      `INSERT INTO peliculas (titulo, duracion_minutos, sinopsis, poster_url, clasificacion_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [titulo, duracion_minutos, sinopsis || null, poster_url || null, clasificacion_id]
    );
    await guardarGeneros(cliente, result.rows[0].id, generos);
    await cliente.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('Error al crear película:', error);
    res.status(500).json({ error: 'Error interno al crear la película' });
  } finally {
    cliente.release();
  }
};

// 4. Actualizar película (Administrador)
const actualizarPelicula = async (req, res) => {
  const { id } = req.params;
  const { titulo, duracion_minutos, sinopsis, poster_url, clasificacion_id, generos } = req.body;

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const result = await cliente.query(
      `UPDATE peliculas
       SET titulo = COALESCE($1, titulo),
           duracion_minutos = COALESCE($2, duracion_minutos),
           sinopsis = COALESCE($3, sinopsis),
           poster_url = COALESCE($4, poster_url),
           clasificacion_id = COALESCE($5, clasificacion_id)
       WHERE id = $6
       RETURNING *`,
      [titulo, duracion_minutos, sinopsis, poster_url, clasificacion_id, id]
    );

    if (result.rows.length === 0) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    if (Array.isArray(generos)) {
      await guardarGeneros(cliente, id, generos);
    }

    await cliente.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('Error al actualizar película:', error);
    res.status(500).json({ error: 'Error interno al actualizar la película' });
  } finally {
    cliente.release();
  }
};

// 5. Eliminar película (Administrador) — borra la película y sus dependencias.
const eliminarPelicula = async (req, res) => {
  const { id } = req.params;
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    const datos = await cliente.query('SELECT id FROM peliculas WHERE id = $1', [id]);
    if (datos.rows.length === 0) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    await cliente.query('DELETE FROM tickets WHERE funcion_id IN (SELECT id FROM funciones WHERE pelicula_id = $1)', [id]);
    await cliente.query('DELETE FROM funciones WHERE pelicula_id = $1', [id]);
    await cliente.query('DELETE FROM pelicula_generos WHERE pelicula_id = $1', [id]);
    await cliente.query('DELETE FROM peliculas WHERE id = $1', [id]);

    await cliente.query('COMMIT');

    res.json({ mensaje: 'Película eliminada correctamente junto con sus funciones, géneros y tickets asociados' });
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('Error al eliminar película:', error);
    if (error.code === '23503') {
      return res.status(409).json({ error: 'No se pudo eliminar: existen referencias asociadas pendientes' });
    }
    return res.status(500).json({ error: 'Error interno al eliminar la película' });
  } finally {
    cliente.release();
  }
};

// Devuelve los datos para el modal de confirmación (no borra nada).
const confirmarEliminarPelicula = async (req, res) => {
  const { id } = req.params;

  try {
    const pelicula = await pool.query('SELECT id, titulo FROM peliculas WHERE id = $1', [id]);
    if (pelicula.rows.length === 0) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    return res.json({
      tipo: 'confirmar',
      pelicula: { id: pelicula.rows[0].id, titulo: pelicula.rows[0].titulo },
      mensaje: `¿Eliminar "${pelicula.rows[0].titulo}"? Se borrarán sus funciones, tickets y géneros asociados y luego la película.`
    });
  } catch (error) {
    console.error('Error al consultar película para eliminar:', error);
    return res.status(500).json({ error: 'Error interno al consultar la película' });
  }
};

module.exports = {
  getPeliculas,
  getPeliculaPorId,
  crearPelicula,
  actualizarPelicula,
  eliminarPelicula,
  confirmarEliminarPelicula
};

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - getPeliculas agrupa los géneros con string_agg (texto separado por comas).
   - crear/actualizar usan transacción y reescriben pelicula_generos.
   - eliminar devuelve 409 si la película tiene funciones asociadas.
   ============================================================ */
