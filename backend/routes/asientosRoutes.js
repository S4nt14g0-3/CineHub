const express = require('express');
const router = express.Router();
const { getAsientosPorFuncion } = require('../controllers/funcionesController');

// Alias usado por el frontend: GET /api/asientos/funcion/:funcionId
router.get('/funcion/:funcionId', getAsientosPorFuncion);

module.exports = router;

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Define los endpoints del recurso y aplica verificarToken/permitirRoles.
   - Las rutas de escritura están restringidas a Administrador (o Empleado/Admin).
   - Se monta en server.js bajo /api/<recurso>.
   ============================================================ */
