const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/admin/usuarios
const getUsuarios = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.telefono, u.rol_id, r.nombre AS rol, u.creado_en
       FROM usuarios u JOIN roles r ON r.id = u.rol_id
       ORDER BY u.id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/admin/usuarios -> crea un usuario con el rol indicado
const crearUsuario = async (req, res) => {
  const { nombre, email, password, telefono, rol_id } = req.body;
  if (!nombre || !email || !password || !rol_id) {
    return res.status(400).json({ error: 'Nombre, email, contraseña y rol son obligatorios' });
  }
  try {
    const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, telefono, rol_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, email, telefono, rol_id`,
      [nombre, email, passwordHash, telefono || null, rol_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno al crear el usuario' });
  }
};

// PUT /api/admin/usuarios/:id
const actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, rol_id, password } = req.body;
  try {
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }
    const result = await pool.query(
      `UPDATE usuarios
       SET nombre = COALESCE($1, nombre),
           telefono = COALESCE($2, telefono),
           rol_id = COALESCE($3, rol_id),
           password_hash = COALESCE($4, password_hash)
       WHERE id = $5
       RETURNING id, nombre, email, telefono, rol_id`,
      [nombre, telefono, rol_id, passwordHash, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno al actualizar el usuario' });
  }
};

// DELETE /api/admin/usuarios/:id
const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  if (parseInt(id, 10) === req.usuario.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
  }
  try {
    const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    if (error.code === '23503') {
      return res.status(409).json({ error: 'No se puede eliminar: el usuario tiene compras registradas' });
    }
    res.status(500).json({ error: 'Error interno al eliminar el usuario' });
  }
};

// GET /api/admin/auditoria -> últimos accesos registrados
const getAuditoria = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.fecha_ingreso, a.ip_origen, a.exitoso,
              u.nombre AS usuario, u.email
       FROM auditoria_accesos a
       JOIN usuarios u ON u.id = a.usuario_id
       ORDER BY a.fecha_ingreso DESC
       LIMIT 200`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener auditoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/admin/reportes/ventas -> resumen de ingresos
const getReporteVentas = async (_req, res) => {
  try {
    const resumen = await pool.query(`
      SELECT
        COALESCE(SUM(monto_total), 0) AS ingresos_totales,
        COUNT(*)::int AS total_compras,
        COALESCE(AVG(monto_total), 0) AS ticket_promedio
      FROM compras
    `);
    const porPelicula = await pool.query(`
      SELECT p.titulo,
             COUNT(t.id)::int AS boletas,
             COALESCE(SUM(t.precio), 0) AS ingresos
      FROM tickets t
      JOIN funciones f ON f.id = t.funcion_id
      JOIN peliculas p ON p.id = f.pelicula_id
      GROUP BY p.titulo
      ORDER BY boletas DESC
    `);
    const dulceria = await pool.query(`
      SELECT pd.nombre,
             COALESCE(SUM(d.cantidad), 0)::int AS unidades,
             COALESCE(SUM(d.cantidad * d.precio_unitario), 0) AS ingresos
      FROM detalle_compras_dulceria d
      JOIN productos_dulceria pd ON pd.id = d.producto_id
      GROUP BY pd.nombre
      ORDER BY unidades DESC
    `);
    res.json({
      resumen: resumen.rows[0],
      por_pelicula: porPelicula.rows,
      dulceria: dulceria.rows
    });
  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(500).json({ error: 'Error interno al generar el reporte' });
  }
};

module.exports = {
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  getAuditoria,
  getReporteVentas
};

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - CRUD de usuarios desde el panel de administración.
   - No permite eliminar el propio usuario; si tiene compras responde 409.
   - getReporteVentas devuelve resumen, ventas por película y por producto.
   - getAuditoria lista los últimos 200 accesos registrados.
   ============================================================ */
