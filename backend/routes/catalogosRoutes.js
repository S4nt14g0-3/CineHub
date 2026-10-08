const express = require('express');
const router = express.Router();
const { getGeneros, getClasificaciones, getRoles, getCines, crearCine } = require('../controllers/catalogosController');
const { verificarToken, permitirRoles, ROLES } = require('../verificaciones/auth');

router.get('/generos', getGeneros);
router.get('/clasificaciones', getClasificaciones);
router.get('/roles', getRoles);
router.get('/cines', getCines);
router.post('/cines', verificarToken, permitirRoles(ROLES.ADMINISTRADOR), crearCine);

module.exports = router;

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Rutas base: /api/catalogos
   - GET  /generos | /clasificaciones | /roles | /cines  -> públicos.
   - POST /cines -> solo Administrador.
   ============================================================ */
