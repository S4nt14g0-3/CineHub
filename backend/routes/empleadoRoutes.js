const express = require('express');
const router = express.Router();
const { validarTicket, getAforo, getTickets } = require('../controllers/empleadoController');
const { verificarToken, permitirRoles, ROLES } = require('../verificaciones/auth');

router.post('/validar', verificarToken, permitirRoles(ROLES.EMPLEADO, ROLES.ADMINISTRADOR), validarTicket);
router.get('/aforo', verificarToken, permitirRoles(ROLES.EMPLEADO, ROLES.ADMINISTRADOR), getAforo);
router.get('/tickets', verificarToken, permitirRoles(ROLES.EMPLEADO, ROLES.ADMINISTRADOR), getTickets);

module.exports = router;

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Define los endpoints del recurso y aplica verificarToken/permitirRoles.
   - Las rutas de escritura están restringidas a Administrador (o Empleado/Admin).
   - Se monta en server.js bajo /api/<recurso>.
   - Aquí: POST /validar, GET /aforo y GET /tickets (Empleado o Administrador).
   ============================================================ */
