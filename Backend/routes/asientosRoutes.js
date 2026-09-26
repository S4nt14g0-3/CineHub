const express = require('express');
const router = express.Router();
const { getAsientosPorFuncion } = require('../controllers/asientosController');

router.get('/funcion/:funcionId', getAsientosPorFuncion);

module.exports = router;