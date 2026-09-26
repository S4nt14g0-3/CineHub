const pool = require('../config/db');

// Obtener funciones disponibles
const getFunciones = async (req, res) => {
  try {
    const query = `
      SELECT 
        f.id AS funcion_id,
        p.titulo AS pelicula,
        p.duracion_minutos,
        c.nombre AS cine,
        s.nombre AS sala,
        f.fecha_hora,
        f.precio
      FROM funciones f
      JOIN peliculas p ON f.pelicula_id = p.id
      JOIN salas s ON f.sala_id = s.id
      JOIN cines c ON s.cine_id = c.id
      WHERE f.fecha_hora >= NOW()
      ORDER BY f.fecha_hora ASC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener funciones:', error);
    res.status(500).json({ error: 'Error al consultar las funciones' });
  }
};

// Obtener mapa de asientos con la columna numero renombrada
const getAsientosPorFuncion = async (req, res) => {
  const { funcionId } = req.params;

  try {
    const query = `
      SELECT 
        a.id AS asiento_id,
        a.fila,
        a.numero,
        a.tipo,
        CASE 
          WHEN t.id IS NOT NULL THEN 'ocupado'
          ELSE 'disponible'
        END AS estado
      FROM funciones f
      JOIN asientos a ON a.sala_id = f.sala_id
      LEFT JOIN tickets t ON t.asiento_id = a.id AND t.funcion_id = f.id
      WHERE f.id = $1
      ORDER BY a.fila, a.numero;
    `;
    const result = await pool.query(query, [funcionId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener mapa de asientos:', error);
    res.status(500).json({ error: 'Error al consultar disponibilidad de asientos' });
  }
};

module.exports = {
  getFunciones,
  getAsientosPorFuncion
};