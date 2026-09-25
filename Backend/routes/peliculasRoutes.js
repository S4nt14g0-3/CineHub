const express = require('express');
const router = express.Router();
const { getPeliculas } = require('../controllers/peliculasController');

router.get('/', getPeliculas);

module.exports = router;