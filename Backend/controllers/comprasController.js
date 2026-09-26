const pool = require('../config/db');

// Registrar una nueva compra (Entradas + Dulcería)
const realizarCompra = async (req, res) => {
  const client = await pool.connect();

  try {
    const { usuario_id, funcion_id, asientos_ids, productos_dulceria, metodo_pago } = req.body;

    if (!asientos_ids || asientos_ids.length === 0) {
      return res.status(400).json({ error: 'Debes seleccionar al menos un asiento.' });
    }

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
      [usuario_id, totalCompra, metodo_pago || 'Tarjeta']
    );
    const compraId = compraRes.rows[0].id;

    // 4. Crear los Tickets para cada asiento
    const ticketsCreados = [];
    for (const asientoId of asientos_ids) {
      // Generar un código único de ticket para la entrada
      const codigoTicket = `TICK-${compraId}-${funcion_id}-${asientoId}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const ticketRes = await client.query(
        `INSERT INTO tickets (compra_id, funcion_id, asiento_id, codigo_ticket, precio)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, codigo_ticket`,
        [compraId, funcion_id, asientoId, codigoTicket, precioBoleta]
      );
      ticketsCreados.push(ticketRes.rows[0]);
    }

    // 5. Procesar productos de Dulcería (si se incluyeron)
    if (productos_dulceria && productos_dulceria.length > 0) {
      for (const item of productos_dulceria) {
        // item = { producto_id: 1, cantidad: 2, precio_unitario: 22000 }
        const subtotal = item.cantidad * item.precio_unitario;
        totalCompra += subtotal;

        await client.query(
          `INSERT INTO detalle_compras_dulceria (compra_id, producto_id, cantidad, precio_unitario)
           VALUES ($1, $2, $3, $4)`,
          [compraId, item.producto_id, item.cantidad, item.precio_unitario]
        );
      }

      // Actualizar el total final de la compra con la dulcería
      await client.query('UPDATE compras SET total = $1 WHERE id = $2', [totalCompra, compraId]);
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
      GROUP BY c.id
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