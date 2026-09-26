const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
require('dotenv').config();

const peliculasRoutes = require('./routes/peliculasRoutes');
const authRoutes = require('./routes/authRoutes');
const funcionesRoutes = require('./routes/funcionesRoutes');
const comprasRoutes = require('./routes/comprasRoutes');



const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/peliculas', peliculasRoutes);
app.use('/api/funciones', funcionesRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/auth', authRoutes);

// Endpoint de prueba para verificar conexión con las tablas
app.get('/api/test-db', async (req, res) => {
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});