const express = require('express');
const router = express.Router();
const { getSalas, crearSala, actualizarSala, eliminarSala } = require('../controllers/salasController');
const { verificarToken, permitirRoles, ROLES } = require('../verificaciones/auth');

router.get('/', getSalas);
router.post('/', verificarToken, permitirRoles(ROLES.ADMINISTRADOR), crearSala);
router.put('/:id', verificarToken, permitirRoles(ROLES.ADMINISTRADOR), actualizarSala);
router.delete('/:id', verificarToken, permitirRoles(ROLES.ADMINISTRADOR), eliminarSala);

module.exports = router;

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Define los endpoints del recurso y aplica verificarToken/permitirRoles.
   - Las rutas de escritura están restringidas a Administrador (o Empleado/Admin).
   - Se monta en server.js bajo /api/<recurso>.
   ============================================================ */
