const pool = require('../config/db');

// GET /api/dulceria -> lista de productos
const getProductos = async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos_dulceria ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos de dulcería:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/dulceria (Administrador)
const crearProducto = async (req, res) => {
  const { nombre, precio, stock } = req.body;
  if (!nombre || precio == null) {
    return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO productos_dulceria (nombre, precio, stock)
       VALUES ($1, $2, $3) RETURNING *`,
      [nombre, precio, stock || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error interno al crear el producto' });
  }
};

// PUT /api/dulceria/:id (Administrador)
const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, stock } = req.body;
  try {
    const result = await pool.query(
      `UPDATE productos_dulceria
       SET nombre = COALESCE($1, nombre),
           precio = COALESCE($2, precio),
           stock = COALESCE($3, stock)
       WHERE id = $4 RETURNING *`,
      [nombre, precio, stock, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error interno al actualizar el producto' });
  }
};

// DELETE /api/dulceria/:id (Administrador)
const eliminarProducto = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM productos_dulceria WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    if (error.code === '23503') {
      return res.status(409).json({ error: 'No se puede eliminar: el producto tiene ventas asociadas' });
    }
    res.status(500).json({ error: 'Error interno al eliminar el producto' });
  }
};

module.exports = { getProductos, crearProducto, actualizarProducto, eliminarProducto };

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - GET /dulceria es público; POST/PUT/DELETE requieren Administrador.
   - eliminar devuelve 409 si el producto tiene ventas asociadas.
   - El stock se descuenta desde comprasController al comprar.
   ============================================================ */
