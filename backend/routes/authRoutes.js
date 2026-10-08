const express = require('express');
const router = express.Router();
const { registrarUsuario, loginUsuario, getPerfil } = require('../controllers/authController');
const { verificarToken } = require('../verificaciones/auth');

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.get('/perfil', verificarToken, getPerfil);

module.exports = router;

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Define los endpoints del recurso y aplica verificarToken/permitirRoles.
   - Las rutas de escritura están restringidas a Administrador (o Empleado/Admin).
   - Se monta en server.js bajo /api/<recurso>.
   ============================================================ */
