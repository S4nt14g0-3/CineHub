'use client';

// ============================================================
// Página de inicio de sesión y registro.
// - Alterna entre los formularios de Login y Registro.
// - Al autenticarse redirige al panel según el rol o a ?redirect=.
// ============================================================
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';

// Lee el parámetro ?redirect= de la URL (fuera del componente para que sea estable).
const leerRedirect = () =>
  typeof window === 'undefined'
    ? ''
    : new URLSearchParams(window.location.search).get('redirect') || '';

export default function LoginPage() {
  const router = useRouter();
  const { usuario, cargando, login, registro, homePorRol } = useAuth();

  const [modo, setModo] = useState('login'); // 'login' | 'registro'
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Si ya hay sesión, no tiene sentido quedarse en el login.
  useEffect(() => {
    (async () => {
      if (!cargando && usuario) {
        router.replace(leerRedirect() || homePorRol(usuario));
      }
    })();
  }, [cargando, usuario, homePorRol, router]);

  const actualizar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      let destino;
      if (modo === 'login') {
        const u = await login(form.email, form.password);
        destino = leerRedirect() || homePorRol(u);
      } else {
        const u = await registro({
          nombre: form.nombre,
          email: form.email,
          password: form.password,
          telefono: form.telefono,
        });
        destino = leerRedirect() || homePorRol(u);
      }
      router.push(destino);
    } catch (err) {
      setError(err.message || 'No se pudo completar la operación');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-[#13151a] border border-slate-800/80 rounded-2xl p-8">
          <h1 className="text-2xl font-extrabold text-white text-center">
            {modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h1>
          <p className="text-sm text-slate-400 text-center mt-1 mb-6">
            {modo === 'login'
              ? 'Accede para reservar tus boletas.'
              : 'Regístrate como cliente en segundos.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === 'registro' && (
              <div>
                <label className="text-xs font-semibold text-slate-400">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={actualizar('nombre')}
                  className="mt-1 w-full bg-[#181a20] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-400">Correo electrónico</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={actualizar('email')}
                className="mt-1 w-full bg-[#181a20] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            {modo === 'registro' && (
              <div>
                <label className="text-xs font-semibold text-slate-400">Teléfono (opcional)</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={actualizar('telefono')}
                  className="mt-1 w-full bg-[#181a20] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-400">Contraseña</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={actualizar('password')}
                className="mt-1 w-full bg-[#181a20] text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            {error && (
              <p className="text-xs bg-red-950/40 border border-red-900/60 text-red-300 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full py-3 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-60 transition-colors"
            >
              {enviando ? 'Procesando...' : modo === 'login' ? 'Entrar' : 'Registrarme'}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-slate-400">
            {modo === 'login' ? (
              <>
                ¿No tienes cuenta?{' '}
                <button
                  onClick={() => {
                    setModo('registro');
                    setError('');
                  }}
                  className="text-amber-400 font-semibold hover:underline"
                >
                  Regístrate
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={() => {
                    setModo('login');
                    setError('');
                  }}
                  className="text-amber-400 font-semibold hover:underline"
                >
                  Inicia sesión
                </button>
              </>
            )}
          </div>

          {/* Credenciales de prueba (definidas en database/CineHub.sql) */}
          <div className="mt-6 text-[11px] text-slate-500 border-t border-slate-800 pt-4 leading-relaxed">
            <p className="font-semibold text-slate-400">Usuarios de prueba:</p>
            <p>admin@cinehub.com / admin123 (Administrador)</p>
            <p>empleado@cinehub.com / empleado123 (Empleado)</p>
            <p>cliente@cinehub.com / cliente123 (Cliente)</p>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - El registro crea siempre un usuario con rol Cliente.
   - Tras el login: Admin → /admin, Empleado → /empleado, Cliente → /.
   - Si vienes de una reserva (?redirect=/reserva/:id) te devuelve ahí.
   - Credenciales de prueba: ver database/CineHub.sql (sección usuarios).
   ============================================================ */
