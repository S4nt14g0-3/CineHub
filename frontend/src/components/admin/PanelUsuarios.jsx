'use client';

// ============================================================
// Panel de administración de Usuarios y sus roles.
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

const FORM_INICIAL = { nombre: '', email: '', password: '', telefono: '', rol_id: 1 };

export default function PanelUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = async () => {
    try {
      const [u, r] = await Promise.all([
        api.getAuth('/admin/usuarios'),
        api.get('/catalogos/roles').catch(() => [
          { id: 1, nombre: 'Cliente' },
          { id: 2, nombre: 'Empleado' },
          { id: 3, nombre: 'Administrador' },
        ]),
      ]);
      setUsuarios(u);
      setRoles(r);
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

  const editar = (u) => {
    setForm({
      nombre: u.nombre,
      email: u.email,
      password: '',
      telefono: u.telefono || '',
      rol_id: u.rol_id,
    });
    setEditandoId(u.id);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      if (editandoId) {
        // En edición el email no se modifica; la contraseña es opcional.
        await api.putAuth(`/admin/usuarios/${editandoId}`, {
          nombre: form.nombre,
          telefono: form.telefono,
          rol_id: Number(form.rol_id),
          password: form.password || undefined,
        });
      } else {
        await api.postAuth('/admin/usuarios', {
          nombre: form.nombre,
          email: form.email,
          password: form.password,
          telefono: form.telefono,
          rol_id: Number(form.rol_id),
        });
      }
      limpiar();
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = (usuario) => {
    setError('');
    setConfirmacion({
      id: usuario.id,
      nombre: usuario.nombre,
      mensaje: `¿Eliminar el usuario "${usuario.nombre}" (${usuario.email})? Esta acción no se puede deshacer.`,
    });
  };

  const confirmarEliminacion = async () => {
    if (!confirmacion) return;
    setEliminando(true);
    try {
      await api.delAuth(`/admin/usuarios/${confirmacion.id}`);
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
      <Seccion titulo="Usuarios del sistema">
        <ErrorBox mensaje={error} />
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="py-2 pr-3 font-semibold">Nombre</th>
                <th className="py-2 pr-3 font-semibold">Correo</th>
                <th className="py-2 pr-3 font-semibold">Teléfono</th>
                <th className="py-2 pr-3 font-semibold">Rol</th>
                <th className="py-2 pr-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/60">
                  <td className="py-2.5 pr-3 text-white font-medium">{u.nombre}</td>
                  <td className="py-2.5 pr-3 text-slate-300">{u.email}</td>
                  <td className="py-2.5 pr-3 text-slate-300">{u.telefono || '—'}</td>
                  <td className="py-2.5 pr-3 text-slate-300">{u.rol}</td>
                  <td className="py-2.5 pr-3 text-right space-x-2 whitespace-nowrap">
                    <button className={btnSmall} onClick={() => editar(u)}>
                      Editar
                    </button>
                    <button className={btnDanger} onClick={() => eliminar(u)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Seccion>

      <Seccion titulo={editandoId ? `Editar usuario #${editandoId}` : 'Nuevo usuario'}>
        <form onSubmit={guardar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className={labelClass}>Correo</label>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => actualizar('email', e.target.value)}
              disabled={!!editandoId}
              required
            />
          </div>
          <div>
            <label className={labelClass}>
              Contraseña {editandoId && <span className="text-slate-500">(dejar vacío = no cambiar)</span>}
            </label>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => actualizar('password', e.target.value)}
              required={!editandoId}
            />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input
              className={inputClass}
              value={form.telefono}
              onChange={(e) => actualizar('telefono', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Rol</label>
            <select
              className={inputClass}
              value={form.rol_id}
              onChange={(e) => actualizar('rol_id', e.target.value)}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className={btnPrimary} disabled={guardando}>
              {guardando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Crear usuario'}
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
        titulo="Confirmar eliminación de usuario"
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
   - Endpoints: GET/POST/PUT/DELETE /admin/usuarios (solo Admin).
   - El correo no se puede editar (solo se envía al crear).
   - Roles: 1 Cliente, 2 Empleado, 3 Administrador.
   - No puedes eliminar tu propio usuario (el backend lo bloquea).
   ============================================================ */
