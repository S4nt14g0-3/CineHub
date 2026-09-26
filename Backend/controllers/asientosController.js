const pool = require('../config/db');

// Obtener asientos de una función específica
const getAsientosPorFuncion = async (req, res) => {
  const { funcionId } = req.params;

  try {
    // 1. Obtener información de la función, película y sala
    const funcionQuery = await pool.query(
      `SELECT f.id, f.fecha_hora, f.precio AS precio_boleta, 
              p.titulo AS pelicula_titulo, s.nombre AS sala_nombre, s.capacidad
       FROM funciones f
       JOIN peliculas p ON f.pelicula_id = p.id
       JOIN salas s ON f.sala_id = s.id
       WHERE f.id = $1`,
      [funcionId]
    );

    if (funcionQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Función no encontrada' });
    }

    const funcion = funcionQuery.rows[0];

    let asientos = [];
    
    // 2. Consultar asientos registrados y verificar disponibilidad en la tabla TICKETS
    try {
      const asientosDB = await pool.query(
        `SELECT a.id, a.fila, a.numero, 
                EXISTS(
                  SELECT 1 FROM tickets t 
                  WHERE t.asiento_id = a.id AND t.funcion_id = $1
                ) AS ocupado
         FROM asientos a
         WHERE a.sala_id = (SELECT sala_id FROM funciones WHERE id = $1)
         ORDER BY a.fila, a.numero`,
        [funcionId]
      );

      if (asientosDB.rows.length > 0) {
        asientos = asientosDB.rows.map(row => ({
          id: row.id,
          codigo: `${row.fila}${row.numero}`,
          fila: row.fila,
          numero: row.numero,
          ocupado: Boolean(row.ocupado) // Garantizamos que retorne boolean
        }));
      }
    } catch (dbError) {
      console.warn('Error al consultar la tabla asientos/tickets:', dbError.message);
    }

    // Fallback: Si no hay asientos cargados en la tabla 'asientos', generamos la grilla
    if (asientos.length === 0) {
      // 3. Consultar qué IDs de asientos ya tienen ticket para esta función
      const ticketsComprados = await pool.query(
        `SELECT asiento_id FROM tickets WHERE funcion_id = $1`,
        [funcionId]
      );
      const asientosOcupadosIds = ticketsComprados.rows.map(t => t.asiento_id);

      const filas = ['A', 'B', 'C', 'D'];
      let idCounter = 1;

      filas.forEach((fila) => {
        for (let num = 1; num <= 6; num++) {
          asientos.push({
            id: idCounter,
            codigo: `${fila}${num}`,
            fila: fila,
            numero: num,
            ocupado: asientosOcupadosIds.includes(idCounter) // Verifica si el ID ya fue comprado
          });
          idCounter++;
        }
      });
    }

    res.json({
      funcion,
      asientos
    });

  } catch (error) {
    console.error('Error al obtener asientos de la función:', error);
    res.status(500).json({ message: 'Error interno al consultar asientos' });
  }
};

module.exports = {
  getAsientosPorFuncion
};