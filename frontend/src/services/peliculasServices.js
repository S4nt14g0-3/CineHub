// ============================================================
// Servicios de películas (cartelera y detalle).
// Usa la capa central `api` para no duplicar fetch ni la URL base.
// Las lecturas devuelven valores seguros ([] / null) ante errores para
// que las pantallas no se rompan si el backend está caído.
// ============================================================
import { api } from '@/lib/api';

// Devuelve todas las películas en cartelera.
export const getPeliculas = async () => {
  try {
    return await api.get('/peliculas');
  } catch (error) {
    console.error('Error al obtener las películas:', error);
    return [];
  }
};

// Devuelve una película por id, incluyendo sus funciones futuras.
export const getPeliculaById = async (id) => {
  try {
    return await api.get(`/peliculas/${id}`);
  } catch (error) {
    console.error('Error al obtener la película:', error);
    return null;
  }
};

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Los campos que devuelve el backend son: id, titulo, duracion_minutos,
     sinopsis, poster_url, clasificacion, genero y (en detalle) funciones[].
   - NO existe `imagen_url` ni `rating`: la imagen correcta es `poster_url`.
   ============================================================ */
