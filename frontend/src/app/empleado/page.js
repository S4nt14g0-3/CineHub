'use client';

// ============================================================
// Pantalla de Empleado / Taquilla.
// - Lista los tickets con su código para poder validarlos sin adivinarlo.
// - Valida tickets por su código QR.
// - Consulta el aforo (ocupación) por función.
// Accesible para roles Empleado (2) y Administrador (3).
// ============================================================
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth, ROLES } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function EmpleadoPage() {
  const router = useRouter();
  const { usuario, cargando } = useAuth();

  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState(null); // { tipo, mensaje, ticket }
  const [validando, setValidando] = useState(false);

  const [aforo, setAforo] = useState([]);
  const [cargandoAforo, setCargandoAforo] = useState(true);

  // Lista de tickets para consultar/tomar su código (filtrable).
  const [tickets, setTickets] = useState([]);
  const [cargandoTickets, setCargandoTickets] = useState(true);
  const [filtroTickets, setFiltroTickets] = useState('pendientes');

  const esStaff = usuario?.rol_id === ROLES.EMPLEADO || usuario?.rol_id === ROLES.ADMINISTRADOR;

  // Protege la ruta: solo staff.
  useEffect(() => {
    if (!cargando) {
      if (!usuario) router.replace('/login?redirect=/empleado');
      else if (!esStaff) router.replace('/');
    }
  }, [cargando, usuario, esStaff, router]);

  const cargarAforo = useCallback(async () => {
    try {
      const data = await api.getAuth('/empleado/aforo');
      setAforo(data);
    } catch (error) {
      console.error('Error al cargar aforo:', error);
    } finally {
      setCargandoAforo(false);
    }
  }, []);

  // Carga los tickets según el filtro (pendientes por defecto).
  const cargarTickets = useCallback(async (estado) => {
    setCargandoTickets(true);
    try {
      const data = await api.getAuth(`/empleado/tickets?estado=${estado}`);
      setTickets(data);
    } catch (error) {
      console.error('Error al cargar tickets:', error);
    } finally {
      setCargandoTickets(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (esStaff) {
        await cargarAforo();
        await cargarTickets(filtroTickets);
      }
    })();
  }, [esStaff, cargarAforo, cargarTickets, filtroTickets]);

  const validar = async (e) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    setValidando(true);
    setResultado(null);
    try {
      const data = await api.postAuth('/empleado/validar', { codigo_ticket: codigo.trim() });
      setResultado({ tipo: 'ok', mensaje: data.mensaje, ticket: data.ticket });
      cargarAforo(); // refresca la ocupación tras validar
      cargarTickets(filtroTickets); // refresca el estado de los tickets
    } catch (error) {
      // El backend responde 404 (no existe) o 409 (ya validado) con datos del ticket.
      setResultado({ tipo: 'error', mensaje: error.message, ticket: error.data?.ticket });
      cargarTickets(filtroTickets);
    } finally {
      setValidando(false);
    }
  };

  if (cargando || !esStaff) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400">
          Verificando permisos...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full space-y-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2">🎫 Taquilla y Validación</h1>
          <p className="text-slate-400 text-sm">
            Valida los tickets en la entrada y revisa la ocupación de las salas.
          </p>
        </div>

        {/* VALIDACIÓN DE TICKET */}
        <section className="bg-[#13151a] border border-slate-800/80 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Validar ticket por código</h2>
          <form onSubmit={validar} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: TICK-12-3-45-7890"
              className="flex-1 bg-[#181a20] text-white px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 text-sm font-mono"
            />
            <button
              type="submit"
              disabled={validando}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-60 transition-colors"
            >
              {validando ? 'Validando...' : 'Validar'}
            </button>
          </form>

          {resultado && (
            <div
              className={`mt-4 rounded-xl px-4 py-3 text-sm border ${
                resultado.tipo === 'ok'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-red-950/40 border-red-900/60 text-red-300'
              }`}
            >
              <p className="font-bold">{resultado.mensaje}</p>
              {resultado.ticket && (
                <div className="mt-2 text-xs leading-relaxed opacity-90">
                  <p>🎬 {resultado.ticket.pelicula}</p>
                  <p>
                    🏛️ {resultado.ticket.sala} · Asiento{' '}
                    {resultado.ticket.asiento ||
                      `${resultado.ticket.fila || ''}${resultado.ticket.columna || ''}`}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* TICKETS DISPONIBLES (para tomar el código y validarlo) */}
        <section className="bg-[#13151a] border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h2 className="text-lg font-bold text-white">Tickets registrados</h2>
            <div className="flex gap-2">
              {[
                { id: 'pendientes', label: 'Pendientes' },
                { id: 'validados', label: 'Validados' },
                { id: 'todos', label: 'Todos' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFiltroTickets(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    filtroTickets === f.id
                      ? 'bg-amber-500 text-black border-amber-500'
                      : 'bg-[#181a20] text-slate-300 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {cargandoTickets ? (
            <p className="text-sm text-slate-400">Cargando tickets...</p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-slate-400">
              No hay tickets en este filtro. Realiza una compra desde el cliente para generar uno.
            </p>
          ) : (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#13151a]">
                  <tr className="text-left text-slate-400 border-b border-slate-800">
                    <th className="py-2 pr-4 font-semibold">Código</th>
                    <th className="py-2 pr-4 font-semibold">Película</th>
                    <th className="py-2 pr-4 font-semibold">Sala / Asiento</th>
                    <th className="py-2 pr-4 font-semibold">Estado</th>
                    <th className="py-2 pr-4 font-semibold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} className="border-b border-slate-800/60">
                      <td className="py-2.5 pr-4 text-slate-200 font-mono text-xs">{t.codigo_ticket}</td>
                      <td className="py-2.5 pr-4 text-white">{t.pelicula}</td>
                      <td className="py-2.5 pr-4 text-slate-300">
                        {t.sala} · {t.asiento}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`text-xs font-semibold ${
                            t.validado ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {t.validado ? 'Validado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        <button
                          onClick={() => setCodigo(t.codigo_ticket)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
                        >
                          Usar código
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* AFORO */}
        <section className="bg-[#13151a] border border-slate-800/80 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Ocupación por función</h2>

          {cargandoAforo ? (
            <p className="text-sm text-slate-400">Cargando aforo...</p>
          ) : aforo.length === 0 ? (
            <p className="text-sm text-slate-400">No hay funciones programadas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-800">
                    <th className="py-2 pr-4 font-semibold">Película</th>
                    <th className="py-2 pr-4 font-semibold">Sala</th>
                    <th className="py-2 pr-4 font-semibold">Fecha</th>
                    <th className="py-2 pr-4 font-semibold">Vendidas</th>
                    <th className="py-2 pr-4 font-semibold">Disponibles</th>
                    <th className="py-2 pr-4 font-semibold">Ocupación</th>
                  </tr>
                </thead>
                <tbody>
                  {aforo.map((f) => (
                    <tr key={f.funcion_id} className="border-b border-slate-800/60">
                      <td className="py-2.5 pr-4 text-white font-medium">{f.pelicula}</td>
                      <td className="py-2.5 pr-4 text-slate-300">{f.sala}</td>
                      <td className="py-2.5 pr-4 text-slate-400">
                        {new Date(f.fecha_hora).toLocaleString('es-CO')}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-300">{f.boletas_vendidas}</td>
                      <td className="py-2.5 pr-4 text-slate-300">{f.disponibles}</td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500"
                              style={{ width: `${Math.min(Number(f.porcentaje_ocupacion) || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">
                            {f.porcentaje_ocupacion ?? 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Endpoints usados: POST /empleado/validar, GET /empleado/aforo
     y GET /empleado/tickets?estado=pendientes|validados|todos.
   - Todos exigen token de Empleado o Administrador.
   - La tabla de tickets permite tomar un código real con "Usar código"
     y luego validarlo (así no hay que adivinar el QR).
   - Un ticket ya validado responde 409 (se muestra en rojo).
   - El código QR es único: formato TICK-{compra}-{funcion}-{asiento}-{random}.
   ============================================================ */
