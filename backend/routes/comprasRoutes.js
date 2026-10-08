const express = require('express');
const router = express.Router();
const {
  realizarCompra,
  getHistorialUsuario,
  getCompraDetalle,
  getTodasLasCompras
} = require('../controllers/comprasController');
const { verificarToken, permitirRoles, ROLES } = require('../verificaciones/auth');

// POST /api/compras -> crear una compra (entradas + dulcería)
router.post('/', verificarToken, realizarCompra);

// Historial de un usuario
router.get('/usuario/:usuarioId', verificarToken, getHistorialUsuario);

// Detalle de una compra con sus tickets
router.get('/:compraId/detalle', verificarToken, getCompraDetalle);

// Todas las compras (Administrador)
router.get('/', verificarToken, permitirRoles(ROLES.ADMINISTRADOR), getTodasLasCompras);

module.exports = router;

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Define los endpoints del recurso y aplica verificarToken/permitirRoles.
   - Las rutas de escritura están restringidas a Administrador (o Empleado/Admin).
   - Se monta en server.js bajo /api/<recurso>.
   ============================================================ */
