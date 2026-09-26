const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const getPeliculas = async () => {
  try {
    const response = await fetch(`${API_URL}/peliculas`);
    if (!response.ok) {
      throw new Error('Error al obtener las películas');
    }
    return await response.json();
  } catch (error) {
    console.error('Peliculas API Error:', error);
    return [];
  }
};

export const getPeliculaById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/peliculas/${id}`);
    if (!response.ok) {
      throw new Error('Error en la respuesta del servidor');
    }
    return await response.json();
  } catch (error) {
    console.error('Error al obtener la película:', error);
    return null;
  }
};