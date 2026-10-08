const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registra un acceso en la tabla de auditoría (no debe romper el flujo si falla)
const registrarAuditoria = async (usuarioId, ip, exitoso) => {
  try {
    await pool.query(
      `INSERT INTO auditoria_accesos (usuario_id, ip_origen, exitoso)
       VALUES ($1, $2, $3)`,
      [usuarioId, ip, exitoso]
    );
  } catch (error) {
    console.warn('No se pudo registrar la auditoría de acceso:', error.message);
  }
};

// POST /api/auth/registro -> nuevo usuario con rol Cliente
const registrarUsuario = async (req, res) => {
  const { nombre, email, password, telefono } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
  }

  try {
    const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const rolResult = await pool.query("SELECT id FROM roles WHERE nombre = 'Cliente' LIMIT 1");
    const rolId = rolResult.rows[0]?.id || 1;

    const nuevo = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, telefono, rol_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, email, telefono, rol_id`,
      [nombre, email, passwordHash, telefono || null, rolId]
    );

    const usuario = nuevo.rows[0];
    const token = jwt.sign(
      { id: usuario.id, rol_id: usuario.rol_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      token,
      usuario: { ...usuario, rol: 'Cliente' }
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error interno al registrar usuario' });
  }
};

// POST /api/auth/login
const loginUsuario = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    const result = await pool.query(
      `SELECT u.*, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = result.rows[0];
    const esCorrecta = await bcrypt.compare(password, usuario.password_hash);

    if (!esCorrecta) {
      await registrarAuditoria(usuario.id, req.ip, false);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    await registrarAuditoria(usuario.id, req.ip, true);

    const token = jwt.sign(
      { id: usuario.id, rol_id: usuario.rol_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        rol_id: usuario.rol_id,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
};

// GET /api/auth/perfil (requiere token)
const getPerfil = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.telefono, u.rol_id, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.id = $1`,
      [req.usuario.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { registrarUsuario, loginUsuario, getPerfil };

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - POST /auth/registro crea siempre un usuario con rol Cliente.
   - POST /auth/login verifica con bcrypt y firma un JWT de 8 horas.
   - Cada intento de login se registra en auditoria_accesos (éxito/fallo + IP).
   ============================================================ */
