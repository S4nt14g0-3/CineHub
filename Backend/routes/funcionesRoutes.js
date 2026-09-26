const express = require('express');
const router = express.Router();
const { getFunciones, getAsientosPorFuncion } = require('../controllers/funcionesController');

router.get('/', getFunciones);
router.get('/:funcionId/asientos', getAsientosPorFuncion);

module.exports = router;