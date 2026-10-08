const express = require('express');
const router = express.Router();
const {
  getProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} = require('../controllers/dulceriaController');
const { verificarToken, permitirRoles, ROLES } = require('../verificaciones/auth');

router.get('/', getProductos);
router.post('/', verificarToken, permitirRoles(ROLES.ADMINISTRADOR), crearProducto);
router.put('/:id', verificarToken, permitirRoles(ROLES.ADMINISTRADOR), actualizarProducto);
router.delete('/:id', verificarToken, permitirRoles(ROLES.ADMINISTRADOR), eliminarProducto);

module.exports = router;

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Define los endpoints del recurso y aplica verificarToken/permitirRoles.
   - Las rutas de escritura están restringidas a Administrador (o Empleado/Admin).
   - Se monta en server.js bajo /api/<recurso>.
   ============================================================ */
