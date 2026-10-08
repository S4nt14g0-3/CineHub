const express = require('express');
const router = express.Router();
const {
  getFunciones,
  getFuncionPorId,
  getAsientosPorFuncion,
  crearFuncion,
  actualizarFuncion,
  eliminarFuncion
} = require('../controllers/funcionesController');
const { verificarToken, permitirRoles, ROLES } = require('../verificaciones/auth');

// Público
router.get('/', getFunciones);
router.get('/:funcionId/asientos', getAsientosPorFuncion);
router.get('/:id', getFuncionPorId);

// Solo Administrador
router.post('/', verificarToken, permitirRoles(ROLES.ADMINISTRADOR), crearFuncion);
router.put('/:id', verificarToken, permitirRoles(ROLES.ADMINISTRADOR), actualizarFuncion);
router.delete('/:id', verificarToken, permitirRoles(ROLES.ADMINISTRADOR), eliminarFuncion);

module.exports = router;

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Define los endpoints del recurso y aplica verificarToken/permitirRoles.
   - Las rutas de escritura están restringidas a Administrador (o Empleado/Admin).
   - Se monta en server.js bajo /api/<recurso>.
   ============================================================ */
