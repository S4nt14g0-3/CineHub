const express = require('express');
const router = express.Router();
const {
  getPeliculas,
  getPeliculaPorId,
  crearPelicula,
  actualizarPelicula,
  eliminarPelicula,
  confirmarEliminarPelicula
} = require('../controllers/peliculasController');
const { verificarToken, permitirRoles, ROLES } = require('../verificaciones/auth');

// Público
router.get('/', getPeliculas);
router.get('/:id', getPeliculaPorId);

// Solo Administrador
router.post('/', verificarToken, permitirRoles(ROLES.ADMINISTRADOR), crearPelicula);
router.put('/:id', verificarToken, permitirRoles(ROLES.ADMINISTRADOR), actualizarPelicula);
router.delete('/:id', verificarToken, permitirRoles(ROLES.ADMINISTRADOR), eliminarPelicula);
router.post('/:id/confirmar-eliminacion', verificarToken, permitirRoles(ROLES.ADMINISTRADOR), confirmarEliminarPelicula);

module.exports = router;

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Define los endpoints del recurso y aplica verificarToken/permitirRoles.
   - Las rutas de escritura están restringidas a Administrador (o Empleado/Admin).
   - Se monta en server.js bajo /api/<recurso>.
   ============================================================ */
