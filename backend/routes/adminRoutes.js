const express = require('express');
const router = express.Router();
const {
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  getAuditoria,
  getReporteVentas
} = require('../controllers/adminController');
const { verificarToken, permitirRoles, ROLES } = require('../verificaciones/auth');

// Todas las rutas de administración requieren ser Administrador
router.use(verificarToken, permitirRoles(ROLES.ADMINISTRADOR));

router.get('/usuarios', getUsuarios);
router.post('/usuarios', crearUsuario);
router.put('/usuarios/:id', actualizarUsuario);
router.delete('/usuarios/:id', eliminarUsuario);

router.get('/auditoria', getAuditoria);
router.get('/reportes/ventas', getReporteVentas);

module.exports = router;

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Define los endpoints del recurso y aplica verificarToken/permitirRoles.
   - Las rutas de escritura están restringidas a Administrador (o Empleado/Admin).
   - Se monta en server.js bajo /api/<recurso>.
   ============================================================ */
