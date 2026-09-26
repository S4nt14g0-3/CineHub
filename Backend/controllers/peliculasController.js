const pool = require('../config/db'); // O la ruta donde tengas tu conexión a Neon DB

// 1. Obtener TODAS las películas (Cartelera)
const getPeliculas = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM peliculas ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener catálogo de películas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// 2. Obtener UNA película por ID con sus funciones
const getPeliculaById = async (req, res) => {
  const { id } = req.params;
  try {
    const peliculaResult = await pool.query(
      'SELECT * FROM peliculas WHERE id = $1',
      [id]
    );

    if (peliculaResult.rows.length === 0) {
      return res.status(404).json({ message: 'Película no encontrada' });
    }

    const pelicula = peliculaResult.rows[0];

    const funcionesResult = await pool.query(
      `SELECT f.id, f.fecha_hora, f.precio AS precio_boleta, s.nombre AS sala_nombre 
       FROM funciones f 
       JOIN salas s ON f.sala_id = s.id 
       WHERE f.pelicula_id = $1`,
      [id]
    );

    pelicula.funciones = funcionesResult.rows;

    res.json(pelicula);
  } catch (error) {
    console.error('Error al obtener la película por ID:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getPeliculas,
  getPeliculaById
};