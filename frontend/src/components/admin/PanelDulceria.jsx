'use client';

// ============================================================
// Panel de administración de Dulcería (productos y stock).
// ============================================================
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
  btnDanger,
  btnSmall,
  Seccion,
  ErrorBox,
  ConfirmDialog,
} from './ui';

const FORM_INICIAL = { nombre: '', precio: '', stock: '' };

export default function PanelDulceria() {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = async () => {
    try {
      setProductos(await api.get('/dulceria'));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    (async () => {
      await cargar();
    })();
  }, []);

  const actualizar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const limpiar = () => {
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setError('');
  };

  const editar = (p) => {
    setForm({ nombre: p.nombre, precio: p.precio, stock: p.stock });
    setEditandoId(p.id);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    const payload = {
      nombre: form.nombre,
      precio: Number(form.precio),
      stock: Number(form.stock),
    };
    try {
      if (editandoId) await api.putAuth(`/dulceria/${editandoId}`, payload);
      else await api.postAuth('/dulceria', payload);
      limpiar();
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = (producto) => {
    setError('');
    setConfirmacion({
      id: producto.id,
      nombre: producto.nombre,
      mensaje: `¿Eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`,
    });
  };

  const confirmarEliminacion = async () => {
    if (!confirmacion) return;
    setEliminando(true);
    try {
      await api.delAuth(`/dulceria/${confirmacion.id}`);
      if (editandoId === confirmacion.id) limpiar();
      setConfirmacion(null);
      cargar();
    } catch (err) {
      setConfirmacion(null);
      setError(err.message);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="space-y-6">
      <Seccion titulo="Productos de dulcería">
        <ErrorBox mensaje={error} />
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="py-2 pr-3 font-semibold">Producto</th>
                <th className="py-2 pr-3 font-semibold">Precio</th>
                <th className="py-2 pr-3 font-semibold">Stock</th>
                <th className="py-2 pr-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/60">
                  <td className="py-2.5 pr-3 text-white font-medium">{p.nombre}</td>
                  <td className="py-2.5 pr-3 text-slate-300">
                    ${Number(p.precio).toLocaleString('es-CO')}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-300">{p.stock}</td>
                  <td className="py-2.5 pr-3 text-right space-x-2 whitespace-nowrap">
                    <button className={btnSmall} onClick={() => editar(p)}>
                      Editar
                    </button>
                    <button className={btnDanger} onClick={() => eliminar(p)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {productos.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500">
                    No hay productos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Seccion>

      <Seccion titulo={editandoId ? `Editar producto #${editandoId}` : 'Nuevo producto'}>
        <form onSubmit={guardar} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Nombre</label>
            <input
              className={inputClass}
              value={form.nombre}
              onChange={(e) => actualizar('nombre', e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Precio</label>
            <input
              type="number"
              className={inputClass}
              value={form.precio}
              onChange={(e) => actualizar('precio', e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Stock</label>
            <input
              type="number"
              className={inputClass}
              value={form.stock}
              onChange={(e) => actualizar('stock', e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-3 flex gap-3">
            <button type="submit" className={btnPrimary} disabled={guardando}>
              {guardando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Crear producto'}
            </button>
            {editandoId && (
              <button type="button" className={btnSecondary} onClick={limpiar}>
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </Seccion>

      <ConfirmDialog
        abierto={Boolean(confirmacion)}
        titulo="Confirmar eliminación de producto"
        mensaje={confirmacion?.mensaje}
        cargando={eliminando}
        onConfirm={confirmarEliminacion}
        onCancel={() => setConfirmacion(null)}
      />
    </div>
  );
}

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Endpoints: GET /dulceria (público), POST/PUT/DELETE /dulceria/:id (Admin).
   - El stock se descuenta automáticamente al comprar con dulcería.
   - No se puede borrar un producto con ventas registradas (409).
   ============================================================ */
