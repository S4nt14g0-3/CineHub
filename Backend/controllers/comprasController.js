const pool = require('../config/db');

// Registrar una nueva compra (Entradas + Dulcería)
const realizarCompra = async (req, res) => {
  const client = await pool.connect();

  try {
    // Permitir tanto 'asientos_ids' como 'asientos' para evitar conflictos con el frontend
    const { usuario_id, funcion_id, productos_dulceria, metodo_pago } = req.body;
    const asientos_ids = req.body.asientos_ids || req.body.asientos;

    if (!asientos_ids || !Array.isArray(asientos_ids) || asientos_ids.length === 0) {
      return res.status(400).json({ error: 'Debes seleccionar al menos un asiento.' });
    }

    // Asegurar un usuario por defecto (ID 1) si el frontend no lo envía
    const usuarioFinal = usuario_id || 1;

    // Iniciar transacción SQL para garantizar integridad de la compra
    await client.query('BEGIN');

    // 1. Verificar si alguno de los asientos ya fue vendido para esa función
    const checkAsientos = await client.query(
      `SELECT id FROM tickets WHERE funcion_id = $1 AND asiento_id = ANY($2::int[])`,
      [funcion_id, asientos_ids]
    );

    if (checkAsientos.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Uno o más asientos seleccionados ya no están disponibles.' });
    }

    // 2. Obtener el precio unitario de la función
    const funcionRes = await client.query('SELECT precio FROM funciones WHERE id = $1', [funcion_id]);
    if (funcionRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'La función especificada no existe.' });
    }
    const precioBoleta = parseFloat(funcionRes.rows[0].precio);
    let totalCompra = precioBoleta * asientos_ids.length;

    // 3. Crear el registro principal en la tabla "compras"
    const compraRes = await client.query(
      `INSERT INTO compras (usuario_id, total, metodo_pago, fecha_compra)
       VALUES ($1, $2, $3, NOW()) RETURNING id, fecha_compra`,
      [usuarioFinal, totalCompra, metodo_pago || 'Tarjeta']
    );
    const compraId = compraRes.rows[0].id;

  // 4. Crear los Tickets para cada asiento
      const ticketsCreados = [];
      for (const asientoId of asientos_ids) {
        // Generar el código para el QR del ticket
        const codigoQR = `TICK-${compraId}-${funcion_id}-${asientoId}-${Math.floor(1000 + Math.random() * 9000)}`;
        
        const ticketRes = await client.query(
          `INSERT INTO tickets (compra_id, funcion_id, asiento_id, precio, codigo_qr, validado)
          VALUES ($1, $2, $3, $4, $5, $6) 
          RETURNING id, codigo_qr`,
          [compraId, funcion_id, asientoId, precioBoleta, codigoQR, false]
        );
        ticketsCreados.push(ticketRes.rows[0]);
      }

    // Confirmar la transacción
    await client.query('COMMIT');

    res.status(201).json({
      mensaje: '¡Compra realizada con éxito!',
      compra_id: compraId,
      total_pagado: totalCompra,
      tickets: ticketsCreados
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al procesar la compra:', error);
    res.status(500).json({ error: 'Error interno al procesar la reserva.' });
  } finally {
    client.release();
  }
};

// Historial de compras por usuario
const getHistorialUsuario = async (req, res) => {
  const { usuarioId } = req.params;

  try {
    const query = `
      SELECT 
        c.id AS compra_id,
        c.total,
        c.fecha_compra,
        c.metodo_pago,
        COUNT(t.id) AS total_entradas
      FROM compras c
      LEFT JOIN tickets t ON t.compra_id = c.id
      WHERE c.usuario_id = $1
      GROUP BY c.id, c.total, c.fecha_compra, c.metodo_pago
      ORDER BY c.fecha_compra DESC;
    `;
    const result = await pool.query(query, [usuarioId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al consultar el historial de compras.' });
  }
};

module.exports = {
  realizarCompra,
  getHistorialUsuario
};