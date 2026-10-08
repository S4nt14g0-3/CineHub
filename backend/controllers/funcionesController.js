const pool = require('../config/db');

// GET /api/funciones?todas=true -> funciones (por defecto solo futuras)
const getFunciones = async (req, res) => {
  const incluirTodas = req.query.todas === 'true';
  try {
    const query = `
      SELECT
        f.id,
        f.fecha_hora,
        f.precio_base,
        f.precio_base AS precio,
        p.id AS pelicula_id,
        p.titulo AS pelicula,
        p.duracion_minutos,
        s.id AS sala_id,
        s.nombre AS sala,
        c.nombre AS cine,
        (SELECT COUNT(*)::int FROM tickets t WHERE t.funcion_id = f.id) AS boletas_vendidas
      FROM funciones f
      JOIN peliculas p ON f.pelicula_id = p.id
      JOIN salas s ON f.sala_id = s.id
      JOIN cines c ON s.cine_id = c.id
      WHERE ($1 = true OR f.fecha_hora >= NOW())
      ORDER BY f.fecha_hora ASC
    `;
    const result = await pool.query(query, [incluirTodas]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener funciones:', error);
    res.status(500).json({ error: 'Error al consultar las funciones' });
  }
};

// GET /api/funciones/:id -> detalle de una función
const getFuncionPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT f.id, f.fecha_hora, f.precio_base, f.precio_base AS precio,
              p.titulo AS pelicula, s.nombre AS sala, c.nombre AS cine
       FROM funciones f
       JOIN peliculas p ON f.pelicula_id = p.id
       JOIN salas s ON f.sala_id = s.id
       JOIN cines c ON s.cine_id = c.id
       WHERE f.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener la función:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/funciones/:funcionId/asientos -> mapa de asientos + info de la función
const getAsientosPorFuncion = async (req, res) => {
  const { funcionId } = req.params;

  try {
    const funcionQuery = await pool.query(
      `SELECT f.id, f.fecha_hora, f.precio_base AS precio_boleta,
              p.titulo AS pelicula_titulo, s.nombre AS sala_nombre, s.capacidad
       FROM funciones f
       JOIN peliculas p ON f.pelicula_id = p.id
       JOIN salas s ON f.sala_id = s.id
       WHERE f.id = $1`,
      [funcionId]
    );

    if (funcionQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }

    const asientosQuery = await pool.query(
      `SELECT a.id, a.fila, a.columna, a.tipo,
              EXISTS(
                SELECT 1 FROM tickets t
                WHERE t.asiento_id = a.id AND t.funcion_id = $1
              ) AS ocupado
       FROM asientos a
       WHERE a.sala_id = (SELECT sala_id FROM funciones WHERE id = $1)
       ORDER BY a.fila, a.columna`,
      [funcionId]
    );

    const asientos = asientosQuery.rows.map((row) => ({
      id: row.id,
      fila: row.fila,
      columna: row.columna,
      numero: row.columna,
      tipo: row.tipo,
      codigo: `${row.fila}${row.columna}`,
      ocupado: Boolean(row.ocupado)
    }));

    res.json({ funcion: funcionQuery.rows[0], asientos });
  } catch (error) {
    console.error('Error al obtener mapa de asientos:', error);
    res.status(500).json({ error: 'Error al consultar disponibilidad de asientos' });
  }
};

// POST /api/funciones (Administrador)
const crearFuncion = async (req, res) => {
  const { pelicula_id, sala_id, fecha_hora, precio_base } = req.body;
  if (!pelicula_id || !sala_id || !fecha_hora || precio_base == null) {
    return res.status(400).json({ error: 'Película, sala, fecha y precio son obligatorios' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO funciones (pelicula_id, sala_id, fecha_hora, precio_base)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [pelicula_id, sala_id, fecha_hora, precio_base]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear función:', error);
    res.status(500).json({ error: 'Error interno al crear la función' });
  }
};

// PUT /api/funciones/:id (Administrador)
const actualizarFuncion = async (req, res) => {
  const { id } = req.params;
  const { pelicula_id, sala_id, fecha_hora, precio_base } = req.body;
  try {
    const result = await pool.query(
      `UPDATE funciones
       SET pelicula_id = COALESCE($1, pelicula_id),
           sala_id = COALESCE($2, sala_id),
           fecha_hora = COALESCE($3, fecha_hora),
           precio_base = COALESCE($4, precio_base)
       WHERE id = $5 RETURNING *`,
      [pelicula_id, sala_id, fecha_hora, precio_base, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar función:', error);
    res.status(500).json({ error: 'Error interno al actualizar la función' });
  }
};

// DELETE /api/funciones/:id (Administrador)
const eliminarFuncion = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM funciones WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Función no encontrada' });
    }
    res.json({ mensaje: 'Función eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar función:', error);
    if (error.code === '23503') {
      return res.status(409).json({ error: 'No se puede eliminar: la función ya tiene tickets vendidos' });
    }
    res.status(500).json({ error: 'Error interno al eliminar la función' });
  }
};

module.exports = {
  getFunciones,
  getFuncionPorId,
  getAsientosPorFuncion,
  crearFuncion,
  actualizarFuncion,
  eliminarFuncion
};

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - GET /funciones?todas=true incluye funciones pasadas; por defecto solo futuras.
   - getAsientosPorFuncion también responde en /asientos/funcion/:id (alias).
   - El precio llega como 'precio_base' y también como 'precio' por compatibilidad.
   - eliminar devuelve 409 si la función ya tiene tickets vendidos.
   ============================================================ */
