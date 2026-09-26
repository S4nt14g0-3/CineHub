const express = require('express');
const router = express.Router();
const { realizarCompra, getHistorialUsuario } = require('../controllers/comprasController');

// 1. POST /api/compras -> Crear una nueva reserva/compra
router.post('/', realizarCompra);

// 2. GET /api/compras/usuario/:usuarioId -> Historial de compras por usuario
router.get('/usuario/:usuarioId', getHistorialUsuario);

// 3. GET /api/compras/:usuarioId -> Ruta directa por si el frontend la consulta directamente
router.get('/:usuarioId', getHistorialUsuario);

module.exports = router;