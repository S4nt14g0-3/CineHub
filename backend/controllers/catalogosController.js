const pool = require('../config/db');

// GET /api/catalogos/generos
const getGeneros = async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM generos ORDER BY nombre');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener géneros:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/catalogos/clasificaciones
const getClasificaciones = async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clasificaciones ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener clasificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/catalogos/roles
const getRoles = async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, descripcion FROM roles ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/catalogos/cines
const getCines = async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cines ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener cines:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/catalogos/cines (Administrador)
const crearCine = async (req, res) => {
  const { nombre, direccion, ciudad } = req.body;
  if (!nombre || !direccion || !ciudad) {
    return res.status(400).json({ error: 'Nombre, dirección y ciudad son obligatorios' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO cines (nombre, direccion, ciudad) VALUES ($1, $2, $3) RETURNING *',
      [nombre, direccion, ciudad]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear cine:', error);
    res.status(500).json({ error: 'Error interno al crear el cine' });
  }
};

module.exports = { getGeneros, getClasificaciones, getRoles, getCines, crearCine };

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Catálogos de solo lectura: generos, clasificaciones, roles y cines.
   - POST /cines requiere token de Administrador (se protege en la ruta).
   - /roles lo consume el panel de administración para el selector de rol.
   ============================================================ */
