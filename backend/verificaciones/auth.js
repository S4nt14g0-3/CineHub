// Verificación de autenticación y control de acceso basado en roles (RBAC).
const jwt = require('jsonwebtoken');

// Roles del sistema (coinciden con la tabla `roles`)
const ROLES = { CLIENTE: 1, EMPLEADO: 2, ADMINISTRADOR: 3 };

// Verifica el JWT enviado en el header Authorization: Bearer <token>
const verificarToken = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Intenta autenticar sin bloquear la petición (útil para compras de invitado)
const tokenOpcional = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      req.usuario = null;
    }
  }
  return next();
};

// Restringe el acceso a los roles indicados. Debe usarse después de verificarToken.
const permitirRoles = (...roles) => (req, res, next) => {
  if (!req.usuario || !roles.includes(req.usuario.rol_id)) {
    return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
  }
  return next();
};

module.exports = { verificarToken, tokenOpcional, permitirRoles, ROLES };

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - verificarToken: valida el JWT del header 'Authorization: Bearer ...'.
   - tokenOpcional: autentica si hay token pero no bloquea (no se usa por ahora).
   - permitirRoles(...): restringe por rol. ROLES = { CLIENTE:1, EMPLEADO:2, ADMINISTRADOR:3 }.
   ============================================================ */
