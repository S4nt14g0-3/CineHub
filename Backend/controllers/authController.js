const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registrar un nuevo usuario (Cliente por defecto)
const registrarUsuario = async (req, res) => {
  const { nombre, email, password } = req.body;

  try {
    const existe = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const rolResult = await pool.query("SELECT id FROM roles WHERE nombre = 'Cliente' LIMIT 1");
    const rolId = rolResult.rows[0]?.id || 1;

    const nuevoUsuario = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol_id) 
       VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol_id`,
      [nombre, email, passwordHash, rolId]
    );

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: nuevoUsuario.rows[0]
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error interno al registrar usuario' });
  }
};

// Iniciar sesión
const loginUsuario = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = result.rows[0];
    const esCorrecta = await bcrypt.compare(password, usuario.password_hash);
    
    if (!esCorrecta) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

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
        rol_id: usuario.rol_id
      }
    });
  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
};

module.exports = { registrarUsuario, loginUsuario };