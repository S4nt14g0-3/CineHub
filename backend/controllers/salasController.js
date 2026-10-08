const pool = require('../config/db');

// GET /api/salas -> lista de salas con su cine y ocupación de asientos
const getSalas = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.nombre, s.capacidad, s.tipo_sala,
             c.id AS cine_id, c.nombre AS cine_nombre, c.ciudad,
             COUNT(a.id) AS asientos_registrados
      FROM salas s
      JOIN cines c ON c.id = s.cine_id
      LEFT JOIN asientos a ON a.sala_id = s.id
      GROUP BY s.id, c.id
      ORDER BY s.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener salas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/salas (Administrador) -> crea la sala y genera sus asientos
const crearSala = async (req, res) => {
  const { cine_id, nombre, filas, columnas, tipo_sala } = req.body;

  const nFilas = parseInt(filas, 10) || 5;
  const nColumnas = parseInt(columnas, 10) || 8;

  if (!cine_id || !nombre) {
    return res.status(400).json({ error: 'Cine y nombre de la sala son obligatorios' });
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const capacidad = nFilas * nColumnas;
    const sala = await cliente.query(
      `INSERT INTO salas (cine_id, nombre, capacidad, tipo_sala)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [cine_id, nombre, capacidad, tipo_sala || '2D']
    );

    // Genera los asientos de la nueva sala (filas A, B, C... y columnas 1..N)
    await cliente.query(
      `INSERT INTO asientos (sala_id, fila, columna, tipo)
       SELECT $1::int, chr(64 + r.n), c.n,
              CASE WHEN r.n >= $2::int THEN 'Preferencial' ELSE 'Estándar' END
       FROM generate_series(1, $3::int) AS r(n)
       CROSS JOIN generate_series(1, $4::int) AS c(n)`,
      [sala.rows[0].id, Math.max(nFilas - 1, 1), nFilas, nColumnas]
    );

    await cliente.query('COMMIT');
    res.status(201).json(sala.rows[0]);
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('Error al crear sala:', error);
    res.status(500).json({ error: 'Error interno al crear la sala' });
  } finally {
    cliente.release();
  }
};

// PUT /api/salas/:id (Administrador)
const actualizarSala = async (req, res) => {
  const { id } = req.params;
  const { nombre, tipo_sala, cine_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE salas
       SET nombre = COALESCE($1, nombre),
           tipo_sala = COALESCE($2, tipo_sala),
           cine_id = COALESCE($3, cine_id)
       WHERE id = $4 RETURNING *`,
      [nombre, tipo_sala, cine_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar sala:', error);
    res.status(500).json({ error: 'Error interno al actualizar la sala' });
  }
};

// DELETE /api/salas/:id (Administrador)
const eliminarSala = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM salas WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }
    res.json({ mensaje: 'Sala eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar sala:', error);
    if (error.code === '23503') {
      return res.status(409).json({ error: 'No se puede eliminar: la sala tiene funciones asociadas' });
    }
    res.status(500).json({ error: 'Error interno al eliminar la sala' });
  }
};

module.exports = { getSalas, crearSala, actualizarSala, eliminarSala };

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - GET /salas incluye el conteo de asientos registrados por sala.
   - crearSala genera la sala y sus asientos (filas A, B, C...; últimas filas
     se marcan como 'Preferencial') dentro de una transacción.
   - eliminar devuelve 409 si la sala tiene funciones asociadas.
   ============================================================ */
