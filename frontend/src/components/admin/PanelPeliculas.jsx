'use client';

// ============================================================
// Panel de administración de Películas (CRUD completo).
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
  ExitoBox,
  ConfirmDialog,
} from './ui';

const FORM_INICIAL = {
  titulo: '',
  duracion_minutos: '',
  sinopsis: '',
  poster_url: '',
  clasificacion_id: '',
  generos: [],
};

export default function PanelPeliculas() {
  const [peliculas, setPeliculas] = useState([]);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmar, setConfirmar] = useState(null);

  const cargar = async () => {
    try {
      const [p, c, g] = await Promise.all([
        api.get('/peliculas'),
        api.get('/catalogos/clasificaciones'),
        api.get('/catalogos/generos'),
      ]);
      setPeliculas(p);
      setClasificaciones(c);
      setGeneros(g);
    } catch (err) {
      console.error('Error al cargar películas:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    (async () => {
      await cargar();
    })();
  }, []);

  const actualizar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const alternarGenero = (id) => {
    setForm((f) => ({
      ...f,
      generos: f.generos.includes(id) ? f.generos.filter((x) => x !== id) : [...f.generos, id],
    }));
  };

  const limpiar = () => {
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setError('');
  };

  const editar = async (pelicula) => {
    setError('');
    try {
      const detalle = await api.get(`/peliculas/${pelicula.id}`);
      const todos = await api.get('/catalogos/generos');
      const nombres = (detalle.genero || '').split(',').map((n) => n.trim()).filter(Boolean);
      const ids = todos.filter((g) => nombres.includes(g.nombre)).map((g) => g.id);

      setForm({
        titulo: detalle.titulo || '',
        duracion_minutos: detalle.duracion_minutos || '',
        sinopsis: detalle.sinopsis || '',
        poster_url: detalle.poster_url || '',
        clasificacion_id: clasificaciones.find((c) => c.codigo === detalle.clasificacion)?.id || '',
        generos: ids,
      });
      setEditandoId(pelicula.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    const payload = {
      titulo: form.titulo,
      duracion_minutos: Number(form.duracion_minutos),
      sinopsis: form.sinopsis,
      poster_url: form.poster_url,
      clasificacion_id: Number(form.clasificacion_id),
      generos: form.generos,
    };
    try {
      if (editandoId) await api.putAuth(`/peliculas/${editandoId}`, payload);
      else await api.postAuth('/peliculas', payload);
      limpiar();
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const abrirConfirmacion = async (id) => {
    setError('');
    setExito('');
    try {
      const respuesta = await api.postAuth(`/peliculas/${id}/confirmar-eliminacion`);
      if (respuesta?.tipo === 'confirmar') {
        setConfirmar({ id, titulo: respuesta.pelicula.titulo, mensaje: respuesta.mensaje });
      } else {
        const detalle = respuesta?.error ? ` (${respuesta.error})` : '';
        setError(`Respuesta inesperada al solicitar eliminación.${detalle}`);
      }
    } catch (err) {
      const detalle = err?.data ? ` [datos: ${JSON.stringify(err.data)}]` : '';
      setError(`Error al solicitar eliminación: ${err.message}${detalle}`);
    }
  };

  const confirmarEliminacion = async () => {
    if (!confirmar) return;
    setGuardando(true);
    try {
      await api.delAuth(`/peliculas/${confirmar.id}`);
      if (editandoId === confirmar.id) limpiar();
      setConfirmar(null);
      setError('');
      setExito(`Película "${confirmar.titulo}" eliminada correctamente.`);
      cargar();
    } catch (err) {
      setConfirmar(null);
      const detalle = err?.data ? ` [datos: ${JSON.stringify(err.data)}]` : '';
      setExito('');
      setError(`Error al eliminar la película: ${err.message}${detalle}`);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = (id) => {
    abrirConfirmacion(id);
  };

  return (
    <div className="space-y-6">
      <Seccion titulo="Películas">
        <ErrorBox mensaje={error} />
        <ExitoBox mensaje={exito} />
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="py-2 pr-3 font-semibold">Título</th>
                <th className="py-2 pr-3 font-semibold">Clasif.</th>
                <th className="py-2 pr-3 font-semibold">Duración</th>
                <th className="py-2 pr-3 font-semibold">Géneros</th>
                <th className="py-2 pr-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {peliculas.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/60">
                  <td className="py-2.5 pr-3 text-white font-medium">{p.titulo}</td>
                  <td className="py-2.5 pr-3 text-slate-300">{p.clasificacion}</td>
                  <td className="py-2.5 pr-3 text-slate-300">{p.duracion_minutos} min</td>
                  <td className="py-2.5 pr-3 text-slate-400 text-xs">{p.genero || '—'}</td>
                  <td className="py-2.5 pr-3 text-right space-x-2 whitespace-nowrap">
                    <button className={btnSmall} onClick={() => editar(p)}>
                      Editar
                    </button>
                    <button className={btnDanger} onClick={() => eliminar(p.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {peliculas.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">
                    No hay películas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Seccion>

      <Seccion titulo={editandoId ? `Editar película #${editandoId}` : 'Nueva película'}>
        <form onSubmit={guardar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Título</label>
            <input
              className={inputClass}
              value={form.titulo}
              onChange={(e) => actualizar('titulo', e.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Duración (minutos)</label>
            <input
              type="number"
              className={inputClass}
              value={form.duracion_minutos}
              onChange={(e) => actualizar('duracion_minutos', e.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Clasificación</label>
            <select
              className={inputClass}
              value={form.clasificacion_id}
              onChange={(e) => actualizar('clasificacion_id', e.target.value)}
              required
            >
              <option value="">Selecciona...</option>
              {clasificaciones.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} — {c.descripcion}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>URL del póster</label>
            <input
              className={inputClass}
              value={form.poster_url}
              onChange={(e) => actualizar('poster_url', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Sinopsis</label>
            <textarea
              className={`${inputClass} min-h-20`}
              value={form.sinopsis}
              onChange={(e) => actualizar('sinopsis', e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Géneros</label>
            <div className="flex flex-wrap gap-2">
              {generos.map((g) => (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => alternarGenero(g.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    form.generos.includes(g.id)
                      ? 'bg-amber-500 text-black border-amber-500'
                      : 'bg-[#181a20] text-slate-300 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  {g.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className={btnPrimary} disabled={guardando}>
              {guardando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Crear película'}
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
        abierto={Boolean(confirmar)}
        titulo={confirmar?.titulo || 'Confirmar eliminación'}
        mensaje={confirmar?.mensaje}
        cargando={guardando}
        onConfirm={confirmarEliminacion}
        onCancel={() => setConfirmar(null)}
      />
    </div>
  );
}
