const express = require('express');
const router = express.Router();
const { realizarCompra, getHistorialUsuario } = require('../controllers/comprasController');

router.post('/', realizarCompra);
router.get('/usuario/:usuarioId', getHistorialUsuario);

module.exports = router;