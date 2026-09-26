const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Obtener la información de la función y el estado actual de las sillas
export const getAsientosFuncion = async (funcionId) => {
  try {
    const response = await fetch(`${API_URL}/asientos/funcion/${funcionId}`);
    if (!response.ok) throw new Error('Error al obtener asientos de la función');
    return await response.json();
  } catch (error) {
    console.error('Error getAsientosFuncion:', error);
    return null;
  }
};

// Crear la compra / reserva de boletas
export const crearCompra = async (datosCompra) => {
  try {
    const response = await fetch(`${API_URL}/compras`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosCompra),
    });

    if (!response.ok) {
      // Intentar leer la respuesta como texto para no perder detalles
      const textResponse = await response.text();
      let errorData = {};
      try {
        errorData = JSON.parse(textResponse);
      } catch (e) {
        console.error('La API respondió con texto/HTML no JSON:', textResponse);
      }

      console.error('Detalle exacto devuelto por la API:', errorData);
      throw new Error(errorData.error || errorData.detalle || 'Error al procesar la compra');
    }

    return await response.json();
  } catch (error) {
    console.error('Error crearCompra:', error);
    throw error;
  }
};