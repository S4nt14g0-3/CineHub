'use client';

// ============================================================
// Panel de administración de Salas.
// Al crear una sala el backend genera automáticamente sus asientos.
// ============================================================
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inputClass, labelClass, btnPrimary, btnSecondary, btnDanger, Seccion, ErrorBox, ConfirmDialog, Modal } from './ui';

const FORM_INICIAL = { cine_id: '', nombre: '', filas: 5, columnas: 8, tipo_sala: '2D' };

export default function PanelSalas() {
  const [salas, setSalas] = useState([]);
  const [cines, setCines] = useState([]);
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [cineModal, setCineModal] = useState(false);
  const [cineForm, setCineForm] = useState({ nombre: '', direccion: '', ciudad: '' });
  const [creandoCine, setCreandoCine] = useState(false);

  const cargar = async () => {
    try {
      const [s, c] = await Promise.all([api.get('/salas'), api.get('/catalogos/cines')]);
      setSalas(s);
      setCines(c);
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

  // Modal de "Nuevo cine" (sustituye los prompt() nativos del navegador).
  const abrirCineModal = () => {
    setError('');
    setCineForm({ nombre: '', direccion: '', ciudad: '' });
    setCineModal(true);
  };

  const crearCine = async (e) => {
    e.preventDefault();
    setCreandoCine(true);
    try {
      await api.postAuth('/catalogos/cines', cineForm);
      setCineModal(false);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreandoCine(false);
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await api.postAuth('/salas', {
        cine_id: Number(form.cine_id),
        nombre: form.nombre,
        filas: Number(form.filas),
        columnas: Number(form.columnas),
        tipo_sala: form.tipo_sala,
      });
      setForm(FORM_INICIAL);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = (sala) => {
    setError('');
    setConfirmacion({
      id: sala.id,
      mensaje: `¿Eliminar la sala "${sala.nombre}" (${sala.cine_nombre})? Se eliminarán también sus asientos. Esta acción no se puede deshacer.`,
    });
  };

  const confirmarEliminacion = async () => {
    if (!confirmacion) return;
    setEliminando(true);
    try {
      await api.delAuth(`/salas/${confirmacion.id}`);
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
      <Seccion
        titulo="Salas"
        accion={
          <button className={btnSecondary} onClick={abrirCineModal}>
            + Nuevo cine
          </button>
        }
      >
        <ErrorBox mensaje={error} />
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="py-2 pr-3 font-semibold">Sala</th>
                <th className="py-2 pr-3 font-semibold">Cine</th>
                <th className="py-2 pr-3 font-semibold">Tipo</th>
                <th className="py-2 pr-3 font-semibold">Capacidad</th>
                <th className="py-2 pr-3 font-semibold">Asientos</th>
                <th className="py-2 pr-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {salas.map((s) => (
                <tr key={s.id} className="border-b border-slate-800/60">
                  <td className="py-2.5 pr-3 text-white font-medium">{s.nombre}</td>
                  <td className="py-2.5 pr-3 text-slate-300">
                    {s.cine_nombre} ({s.ciudad})
                  </td>
                  <td className="py-2.5 pr-3 text-slate-300">{s.tipo_sala}</td>
                  <td className="py-2.5 pr-3 text-slate-300">{s.capacidad}</td>
                  <td className="py-2.5 pr-3 text-slate-300">{s.asientos_registrados}</td>
                  <td className="py-2.5 pr-3 text-right">
                    <button className={btnDanger} onClick={() => eliminar(s.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {salas.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500">
                    No hay salas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Seccion>

      <Seccion titulo="Nueva sala">
        <form onSubmit={guardar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Cine</label>
            <select
              className={inputClass}
              value={form.cine_id}
              onChange={(e) => actualizar('cine_id', e.target.value)}
              required
            >
              <option value="">Selecciona...</option>
              {cines.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} — {c.ciudad}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Nombre de la sala</label>
            <input
              className={inputClass}
              value={form.nombre}
              onChange={(e) => actualizar('nombre', e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Tipo de sala</label>
            <select
              className={inputClass}
              value={form.tipo_sala}
              onChange={(e) => actualizar('tipo_sala', e.target.value)}
            >
              <option value="2D">2D</option>
              <option value="3D">3D</option>
              <option value="IMAX">IMAX</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Filas</label>
            <input
              type="number"
              className={inputClass}
              value={form.filas}
              onChange={(e) => actualizar('filas', e.target.value)}
              min={1}
            />
          </div>
          <div>
            <label className={labelClass}>Columnas</label>
            <input
              type="number"
              className={inputClass}
              value={form.columnas}
              onChange={(e) => actualizar('columnas', e.target.value)}
              min={1}
            />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className={btnPrimary} disabled={guardando}>
              {guardando ? 'Creando...' : 'Crear sala y generar asientos'}
            </button>
          </div>
        </form>
      </Seccion>

      <ConfirmDialog
        abierto={Boolean(confirmacion)}
        titulo="Confirmar eliminación de sala"
        mensaje={confirmacion?.mensaje}
        cargando={eliminando}
        onConfirm={confirmarEliminacion}
        onCancel={() => setConfirmacion(null)}
      />

      <Modal abierto={cineModal} titulo="Nuevo cine">
        <form onSubmit={crearCine} className="space-y-4">
          <div>
            <label className={labelClass}>Nombre</label>
            <input
              className={inputClass}
              value={cineForm.nombre}
              onChange={(e) => setCineForm((f) => ({ ...f, nombre: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Dirección</label>
            <input
              className={inputClass}
              value={cineForm.direccion}
              onChange={(e) => setCineForm((f) => ({ ...f, direccion: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Ciudad</label>
            <input
              className={inputClass}
              value={cineForm.ciudad}
              onChange={(e) => setCineForm((f) => ({ ...f, ciudad: e.target.value }))}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
              onClick={() => setCineModal(false)}
              disabled={creandoCine}
            >
              Cancelar
            </button>
            <button type="submit" className={btnPrimary} disabled={creandoCine}>
              {creandoCine ? 'Guardando...' : 'Crear cine'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Endpoints: GET /salas, POST/DELETE /salas, GET/POST /catalogos/cines.
   - La capacidad se calcula como filas × columnas.
   - Las últimas filas se crean como 'Preferencial' (regla del backend).
   - Borrar una sala con funciones asociadas responde 409.
   ============================================================ */
