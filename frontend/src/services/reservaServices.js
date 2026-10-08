// ============================================================
// Servicios de reserva: mapa de asientos y creación de compra.
// ============================================================
import { api } from '@/lib/api';

// Obtiene la info de la función y el estado actual de sus asientos.
export const getAsientosFuncion = async (funcionId) => {
  try {
    return await api.get(`/asientos/funcion/${funcionId}`);
  } catch (error) {
    console.error('Error al obtener asientos de la función:', error);
    return null;
  }
};

// Crea la compra de boletas. Requiere sesión iniciada (envía el token).
// Lanza el error del backend para poder mostrar el motivo exacto.
export const crearCompra = async (datosCompra) => {
  return api.postAuth('/compras', datosCompra);
};

// Historial de compras de un usuario (Cliente solo puede ver el suyo).
export const getHistorialCompras = async (usuarioId) => {
  try {
    return await api.getAuth(`/compras/usuario/${usuarioId}`);
  } catch (error) {
    console.error('Error al obtener el historial:', error);
    return [];
  }
};

// Detalle de una compra: datos, tickets con QR y productos de dulcería.
export const getCompraDetalle = async (compraId) => {
  try {
    return await api.getAuth(`/compras/${compraId}/detalle`);
  } catch (error) {
    console.error('Error al obtener el detalle de la compra:', error);
    return null;
  }
};

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - getAsientosFuncion apunta a /asientos/funcion/:id (alias del backend).
   - crearCompra usa postAuth: si no hay sesión, lanza error 401.
   - El backend exige token en /compras; por eso la reserva redirige a /login.
   ============================================================ */
