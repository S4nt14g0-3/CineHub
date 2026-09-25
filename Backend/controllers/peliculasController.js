const pool = require('../config/db');

// Obtener catálogo completo de películas
const getPeliculas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.titulo, p.duracion_minutos, p.sinopsis, c.codigo AS clasificacion
      FROM peliculas p
      LEFT JOIN clasificaciones c ON p.clasificacion_id = c.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener películas:', error);
    res.status(500).json({ error: 'Error al consultar el catálogo de películas' });
  }
};

module.exports = {
  getPeliculas
};