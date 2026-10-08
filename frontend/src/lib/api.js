// ============================================================
// Capa de acceso a la API del backend.
// - Centraliza la URL base y el envío del token JWT.
// - Normaliza las respuestas y los errores para que las páginas
//   no tengan que repetir la misma lógica de fetch.
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Claves usadas en localStorage para recordar la sesión del usuario.
const TOKEN_KEY = 'cinehub_token';
const USUARIO_KEY = 'cinehub_usuario';

// --- Manejo del token en el navegador ---
export const getToken = () =>
  typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
  }
};

export const getUsuarioGuardado = () => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USUARIO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setUsuarioGuardado = (usuario) => {
  if (typeof window !== 'undefined') localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
};

// --- Petición genérica ---
// auth: si es true, exige token y lanza error si no hay sesión.
async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();

  if (auth && !token) {
    const error = new Error('Debes iniciar sesión para continuar');
    error.status = 401;
    throw error;
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Leemos como texto primero para tolerar respuestas no JSON (HTML de error, etc.)
  const texto = await response.text();
  let data = null;
  try {
    data = texto ? JSON.parse(texto) : null;
  } catch {
    data = { raw: texto };
  }

  if (!response.ok) {
    const error = new Error(data?.error || data?.mensaje || `Error ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Helpers con autenticación activada para acciones protegidas.
export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  // Variantes que envían el token (rutas protegidas por RBAC).
  getAuth: (path) => request(path, { auth: true }),
  postAuth: (path, body) => request(path, { method: 'POST', body, auth: true }),
  putAuth: (path, body) => request(path, { method: 'PUT', body, auth: true }),
  delAuth: (path) => request(path, { method: 'DELETE', auth: true }),
};

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - API_URL se toma de NEXT_PUBLIC_API_URL (si no existe, usa localhost:5000).
   - Las funciones get/post/put/del NO envían token; getAuth/postAuth/etc. SÍ.
   - Toda petición rechazada lanza un Error con .status (HTTP) y .data (cuerpo).
   - El token se guarda en localStorage bajo la clave 'cinehub_token'.
   ============================================================ */
