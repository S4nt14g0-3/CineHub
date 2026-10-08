const pool = require('../config/db');

// POST /api/empleado/validar -> valida el ingreso de un ticket por su código
const validarTicket = async (req, res) => {
  const { codigo_ticket } = req.body;
  if (!codigo_ticket) {
    return res.status(400).json({ error: 'Debes ingresar el código del ticket' });
  }

  try {
    const result = await pool.query(
      `SELECT t.id, t.codigo_ticket, t.validado, t.precio, t.funcion_id, t.asiento_id,
              p.titulo AS pelicula, s.nombre AS sala, f.fecha_hora, a.fila, a.columna
       FROM tickets t
       JOIN funciones f ON f.id = t.funcion_id
       JOIN peliculas p ON p.id = f.pelicula_id
       JOIN salas s ON s.id = f.sala_id
       JOIN asientos a ON a.id = t.asiento_id
       WHERE t.codigo_ticket = $1`,
      [codigo_ticket.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado o código inválido', valido: false });
    }

    const ticket = result.rows[0];

    if (ticket.validado) {
      return res.status(409).json({ error: 'Este ticket ya fue validado previamente', valido: false, ticket });
    }

    await pool.query('UPDATE tickets SET validado = true WHERE id = $1', [ticket.id]);

    res.json({
      mensaje: '✅ Ingreso autorizado',
      valido: true,
      ticket: { ...ticket, validado: true, asiento: `${ticket.fila}${ticket.columna}` }
    });
  } catch (error) {
    console.error('Error al validar ticket:', error);
    res.status(500).json({ error: 'Error interno al validar el ticket' });
  }
};

// GET /api/empleado/aforo?todas=true -> ocupación por función
const getAforo = async (req, res) => {
  const incluirTodas = req.query.todas === 'true';
  try {
    const result = await pool.query(
      `SELECT
         f.id AS funcion_id,
         p.titulo AS pelicula,
         s.nombre AS sala,
         s.capacidad,
         f.fecha_hora,
         f.precio_base,
         COUNT(t.id)::int AS boletas_vendidas,
         (s.capacidad - COUNT(t.id))::int AS disponibles,
         ROUND((COUNT(t.id)::numeric / NULLIF(s.capacidad, 0)) * 100, 1) AS porcentaje_ocupacion
       FROM funciones f
       JOIN peliculas p ON p.id = f.pelicula_id
       JOIN salas s ON s.id = f.sala_id
       LEFT JOIN tickets t ON t.funcion_id = f.id
       WHERE ($1 = true OR f.fecha_hora::date = CURRENT_DATE OR f.fecha_hora >= NOW())
       GROUP BY f.id, p.titulo, s.nombre, s.capacidad, f.fecha_hora, f.precio_base
       ORDER BY f.fecha_hora ASC`,
      [incluirTodas]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener aforo:', error);
    res.status(500).json({ error: 'Error interno al consultar el aforo' });
  }
};

// GET /api/empleado/tickets?estado=pendientes|validados|todos
// Lista los tickets para que el empleado vea los códigos disponibles sin
// tener que adivinarlos (útil para operar en taquilla y para pruebas).
const getTickets = async (req, res) => {
  const { estado } = req.query;
  try {
    const filtro =
      estado === 'pendientes'
        ? 'WHERE t.validado = false'
        : estado === 'validados'
        ? 'WHERE t.validado = true'
        : '';

    const result = await pool.query(
      `SELECT t.id, t.codigo_ticket, t.validado, t.precio,
              p.titulo AS pelicula, s.nombre AS sala,
              f.fecha_hora, (a.fila || a.columna) AS asiento
       FROM tickets t
       JOIN funciones f ON f.id = t.funcion_id
       JOIN peliculas p ON p.id = f.pelicula_id
       JOIN salas s ON s.id = f.sala_id
       JOIN asientos a ON a.id = t.asiento_id
       ${filtro}
       ORDER BY t.id DESC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    res.status(500).json({ error: 'Error interno al consultar los tickets' });
  }
};

module.exports = { validarTicket, getAforo, getTickets };

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - validarTicket marca el ticket como validado; si ya lo estaba responde 409.
   - getAforo calcula boletas_vendidas, disponibles y porcentaje de ocupación.
   - getTickets lista los códigos QR (filtrable con ?estado=pendientes|validados).
   - Solo accesible para Empleado y Administrador (definido en las rutas).
   ============================================================ */
