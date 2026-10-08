'use client';

// ============================================================
// Panel de administración de Funciones (programación de horarios).
// ============================================================
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inputClass, labelClass, btnPrimary, btnDanger, Seccion, ErrorBox, ConfirmDialog } from './ui';

const FORM_INICIAL = { pelicula_id: '', sala_id: '', fecha_hora: '', precio_base: '' };

export default function PanelFunciones() {
  const [funciones, setFunciones] = useState([]);
  const [peliculas, setPeliculas] = useState([]);
  const [salas, setSalas] = useState([]);
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null); // { id, pelicula, sala }
  const [eliminando, setEliminando] = useState(false);

  const cargar = async () => {
    try {
      // `todas=true` incluye funciones pasadas, no solo las futuras.
      const [f, p, s] = await Promise.all([
        api.get('/funciones?todas=true'),
        api.get('/peliculas'),
        api.get('/salas'),
      ]);
      setFunciones(f);
      setPeliculas(p);
      setSalas(s);
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

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await api.postAuth('/funciones', {
        pelicula_id: Number(form.pelicula_id),
        sala_id: Number(form.sala_id),
        fecha_hora: form.fecha_hora,
        precio_base: Number(form.precio_base),
      });
      setForm(FORM_INICIAL);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = (funcion) => {
    setError('');
    setConfirmacion({
      id: funcion.id,
      mensaje: `¿Eliminar la función de "${funcion.pelicula}" en ${funcion.sala} del ${new Date(funcion.fecha_hora).toLocaleString('es-CO')}? Esta acción no se puede deshacer.`,
    });
  };

  const confirmarEliminacion = async () => {
    if (!confirmacion) return;
    setEliminando(true);
    try {
      await api.delAuth(`/funciones/${confirmacion.id}`);
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
      <Seccion titulo="Funciones programadas">
        <ErrorBox mensaje={error} />
        <div className="overflow-x-auto mt-3 max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#13151a]">
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="py-2 pr-3 font-semibold">Película</th>
                <th className="py-2 pr-3 font-semibold">Sala</th>
                <th className="py-2 pr-3 font-semibold">Fecha</th>
                <th className="py-2 pr-3 font-semibold">Precio</th>
                <th className="py-2 pr-3 font-semibold">Vendidas</th>
                <th className="py-2 pr-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {funciones.map((f) => (
                <tr key={f.id} className="border-b border-slate-800/60">
                  <td className="py-2.5 pr-3 text-white font-medium">{f.pelicula}</td>
                  <td className="py-2.5 pr-3 text-slate-300">{f.sala}</td>
                  <td className="py-2.5 pr-3 text-slate-400">
                    {new Date(f.fecha_hora).toLocaleString('es-CO')}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-300">
                    ${Number(f.precio).toLocaleString('es-CO')}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-300">{f.boletas_vendidas}</td>
                  <td className="py-2.5 pr-3 text-right">
                    <button className={btnDanger} onClick={() => eliminar(f)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {funciones.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500">
                    No hay funciones programadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Seccion>

      <Seccion titulo="Programar nueva función">
        <form onSubmit={guardar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Película</label>
            <select
              className={inputClass}
              value={form.pelicula_id}
              onChange={(e) => actualizar('pelicula_id', e.target.value)}
              required
            >
              <option value="">Selecciona...</option>
              {peliculas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titulo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Sala</label>
            <select
              className={inputClass}
              value={form.sala_id}
              onChange={(e) => actualizar('sala_id', e.target.value)}
              required
            >
              <option value="">Selecciona...</option>
              {salas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} — {s.cine_nombre} ({s.tipo_sala})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Fecha y hora</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={form.fecha_hora}
              onChange={(e) => actualizar('fecha_hora', e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Precio base</label>
            <input
              type="number"
              className={inputClass}
              value={form.precio_base}
              onChange={(e) => actualizar('precio_base', e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className={btnPrimary} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Crear función'}
            </button>
          </div>
        </form>
      </Seccion>

      <ConfirmDialog
        abierto={Boolean(confirmacion)}
        titulo="Confirmar eliminación de función"
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
   - Endpoints: GET /funciones?todas=true, POST/DELETE /funciones.
   - `fecha_hora` se envía en formato ISO local (input datetime-local).
   - Eliminar una función con tickets vendidos devuelve 409 (se muestra el error).
   ============================================================ */
