const express = require('express');
const router = express.Router();
const { getPeliculas, getPeliculaById } = require('../controllers/peliculasController');

// Ruta para obtener todas las películas (Cartelera)
router.get('/', getPeliculas);

// Ruta para obtener una película específica por su ID
router.get('/:id', getPeliculaById);

module.exports = router;