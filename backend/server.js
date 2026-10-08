const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
require('dotenv').config();

const peliculasRoutes = require('./routes/peliculasRoutes');
const authRoutes = require('./routes/authRoutes');
const funcionesRoutes = require('./routes/funcionesRoutes');
const comprasRoutes = require('./routes/comprasRoutes');
const asientosRoutes = require('./routes/asientosRoutes');
const catalogosRoutes = require('./routes/catalogosRoutes');
const salasRoutes = require('./routes/salasRoutes');
const dulceriaRoutes = require('./routes/dulceriaRoutes');
const empleadoRoutes = require('./routes/empleadoRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/peliculas', peliculasRoutes);
app.use('/api/funciones', funcionesRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/asientos', asientosRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/salas', salasRoutes);
app.use('/api/dulceria', dulceriaRoutes);
app.use('/api/empleado', empleadoRoutes);
app.use('/api/admin', adminRoutes);

// Endpoint de prueba para verificar conexión con la base de datos
app.get('/api/test-db', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      mensaje: 'Conexión exitosa a la base de datos',
      fecha_servidor_db: result.rows[0].now
    });
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    res.status(500).json({ error: 'Error interno en la base de datos' });
  }
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Monta todas las rutas bajo /api/* y habilita CORS y JSON.
   - GET /api/test-db sirve para comprobar la conexión con la base de datos.
   - El puerto se toma de PORT (por defecto 5000).
   ============================================================ */
