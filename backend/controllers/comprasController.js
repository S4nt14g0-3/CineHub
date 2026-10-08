const pool = require('../config/db');

// Genera un código único para el QR del ticket
const generarCodigoQR = (compraId, funcionId, asientoId) =>
  `TICK-${compraId}-${funcionId}-${asientoId}-${Math.floor(1000 + Math.random() * 9000)}`;

// POST /api/compras -> registra una compra (entradas + dulcería) de forma transaccional
// Requiere token. Los usuarios Cliente compran para sí mismos; Empleado/Admin pueden
// indicar `usuario_id` para ventas en taquilla.
const realizarCompra = async (req, res) => {
  const { funcion_id, usuario_id, productos_dulceria } = req.body;
  const asientos_ids = req.body.asientos_ids || req.body.asientos;

  if (!funcion_id) {
    return res.status(400).json({ error: 'La función es obligatoria' });
  }
  if (!Array.isArray(asientos_ids) || asientos_ids.length === 0) {
    return res.status(400).json({ error: 'Debes seleccionar al menos un asiento.' });
  }

  // Un Cliente solo puede comprar para sí mismo
  const esStaff = req.usuario.rol_id === 2 || req.usuario.rol_id === 3;
  const usuarioFinal = esStaff && usuario_id ? usuario_id : req.usuario.id;

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    // 1. Verificar que los asientos sigan disponibles (bloqueo para evitar doble reserva)
    const checkAsientos = await cliente.query(
      `SELECT id FROM tickets
       WHERE funcion_id = $1 AND asiento_id = ANY($2::int[])
       FOR UPDATE`,
      [funcion_id, asientos_ids]
    );
    if (checkAsientos.rows.length > 0) {
      await cliente.query('ROLLBACK');
      return res.status(409).json({ error: 'Uno o más asientos seleccionados ya no están disponibles.' });
    }

    // 2. Precio de la función
    const funcionRes = await cliente.query(
      'SELECT precio_base FROM funciones WHERE id = $1',
      [funcion_id]
    );
    if (funcionRes.rows.length === 0) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ error: 'La función especificada no existe.' });
    }
    const precioBoleta = parseFloat(funcionRes.rows[0].precio_base);
    let totalCompra = precioBoleta * asientos_ids.length;

    // 3. Validar y descontar dulcería
    const productosFinales = [];
    if (Array.isArray(productos_dulceria) && productos_dulceria.length > 0) {
      for (const item of productos_dulceria) {
        const cantidad = parseInt(item.cantidad, 10);
        if (!item.producto_id || !cantidad || cantidad <= 0) continue;

        const stockRes = await cliente.query(
          `UPDATE productos_dulceria
           SET stock = stock - $1
           WHERE id = $2 AND stock >= $1
           RETURNING id, nombre, precio, stock`,
          [cantidad, item.producto_id]
        );

        if (stockRes.rows.length === 0) {
          await cliente.query('ROLLBACK');
          return res.status(409).json({ error: 'Stock insuficiente para uno de los productos de dulcería.' });
        }

        const producto = stockRes.rows[0];
        const precioUnitario = parseFloat(producto.precio);
        totalCompra += precioUnitario * cantidad;
        productosFinales.push({
          producto_id: producto.id,
          nombre: producto.nombre,
          cantidad,
          precio_unitario: precioUnitario
        });
      }
    }

    // 4. Encabezado de la compra
    const compraRes = await cliente.query(
      `INSERT INTO compras (usuario_id, monto_total, estado, fecha_compra)
       VALUES ($1, $2, 'Completada', NOW()) RETURNING id, fecha_compra`,
      [usuarioFinal, totalCompra]
    );
    const compraId = compraRes.rows[0].id;

    // 5. Tickets
    const ticketsCreados = [];
    for (const asientoId of asientos_ids) {
      const codigoQR = generarCodigoQR(compraId, funcion_id, asientoId);
      const ticketRes = await cliente.query(
        `INSERT INTO tickets (compra_id, funcion_id, asiento_id, precio, codigo_ticket, validado)
         VALUES ($1, $2, $3, $4, $5, false)
         RETURNING id, codigo_ticket`,
        [compraId, funcion_id, asientoId, precioBoleta, codigoQR]
      );
      ticketsCreados.push(ticketRes.rows[0]);
    }

    // 6. Detalle de dulcería
    for (const producto of productosFinales) {
      await cliente.query(
        `INSERT INTO detalle_compras_dulceria (compra_id, producto_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [compraId, producto.producto_id, producto.cantidad, producto.precio_unitario]
      );
    }

    await cliente.query('COMMIT');

    res.status(201).json({
      mensaje: '¡Compra realizada con éxito!',
      compra_id: compraId,
      total_pagado: totalCompra,
      tickets: ticketsCreados,
      productos_dulceria: productosFinales
    });
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('Error al procesar la compra:', error);
    res.status(500).json({ error: 'Error interno al procesar la reserva.' });
  } finally {
    cliente.release();
  }
};

// GET /api/compras/usuario/:usuarioId -> historial de compras de un usuario
const getHistorialUsuario = async (req, res) => {
  const { usuarioId } = req.params;

  // Un Cliente solo puede ver su propio historial
  if (req.usuario.rol_id === 1 && parseInt(usuarioId, 10) !== req.usuario.id) {
    return res.status(403).json({ error: 'No puedes consultar el historial de otro usuario' });
  }

  try {
    const query = `
      SELECT
        c.id AS compra_id,
        c.monto_total,
        c.estado,
        c.fecha_compra,
        (SELECT COUNT(*) FROM tickets t WHERE t.compra_id = c.id)::int AS total_entradas,
        (SELECT COALESCE(SUM(d.cantidad), 0) FROM detalle_compras_dulceria d WHERE d.compra_id = c.id)::int AS total_dulceria
      FROM compras c
      WHERE c.usuario_id = $1
      ORDER BY c.fecha_compra DESC
    `;
    const result = await pool.query(query, [usuarioId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al consultar el historial de compras.' });
  }
};

// GET /api/compras/:compraId/detalle -> tickets con QR + productos de una compra
const getCompraDetalle = async (req, res) => {
  const { compraId } = req.params;
  try {
    const compraRes = await pool.query(
      `SELECT c.id, c.usuario_id, c.monto_total, c.estado, c.fecha_compra,
              u.nombre AS usuario_nombre, u.email AS usuario_email
       FROM compras c JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.id = $1`,
      [compraId]
    );
    if (compraRes.rows.length === 0) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }
    const compra = compraRes.rows[0];

    if (req.usuario.rol_id === 1 && compra.usuario_id !== req.usuario.id) {
      return res.status(403).json({ error: 'No puedes consultar esta compra' });
    }

    const ticketsRes = await pool.query(
      `SELECT t.id, t.precio, t.codigo_ticket, t.validado,
              p.titulo AS pelicula, s.nombre AS sala, ci.nombre AS cine,
              f.fecha_hora, a.fila, a.columna,
              (a.fila || a.columna) AS asiento
       FROM tickets t
       JOIN funciones f ON f.id = t.funcion_id
       JOIN peliculas p ON p.id = f.pelicula_id
       JOIN salas s ON s.id = f.sala_id
       JOIN cines ci ON ci.id = s.cine_id
       JOIN asientos a ON a.id = t.asiento_id
       WHERE t.compra_id = $1
       ORDER BY t.id`,
      [compraId]
    );

    const productosRes = await pool.query(
      `SELECT d.id, d.cantidad, d.precio_unitario, pd.nombre
       FROM detalle_compras_dulceria d
       JOIN productos_dulceria pd ON pd.id = d.producto_id
       WHERE d.compra_id = $1`,
      [compraId]
    );

    res.json({ compra, tickets: ticketsRes.rows, productos: productosRes.rows });
  } catch (error) {
    console.error('Error al obtener detalle de compra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/compras -> todas las compras (Administrador)
const getTodasLasCompras = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id AS compra_id, c.monto_total, c.estado, c.fecha_compra,
             u.nombre AS usuario, u.email,
             COUNT(t.id)::int AS total_entradas
      FROM compras c
      JOIN usuarios u ON u.id = c.usuario_id
      LEFT JOIN tickets t ON t.compra_id = c.id
      GROUP BY c.id, u.nombre, u.email
      ORDER BY c.fecha_compra DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener todas las compras:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  realizarCompra,
  getHistorialUsuario,
  getCompraDetalle,
  getTodasLasCompras
};

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - realizarCompra es transaccional (BEGIN/COMMIT/ROLLBACK): valida asientos,
     descuenta stock de dulcería e inserta compra, tickets y detalle.
   - Si un asiento ya está vendido responde 409; si no hay stock, 409.
   - Genera un codigo_ticket único por ticket con formato TICK-compra-funcion-asiento-rand.
   - getHistorialUsuario y getCompraDetalle: un Cliente solo ve lo suyo.
   ============================================================ */
