'use client';

// ============================================================
// Barra de navegación superior.
// - Muestra enlaces según el rol del usuario autenticado.
// - Permite iniciar/cerrar sesión.
// ============================================================
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, ROLES } from '@/context/AuthContext';

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const router = useRouter();

  const esAdmin = usuario?.rol_id === ROLES.ADMINISTRADOR;
  const esEmpleado = usuario?.rol_id === ROLES.EMPLEADO;
  const esStaff = esAdmin || esEmpleado;

  const handleLogout = () => {
    logout();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="w-full bg-[#0e0f12]/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="bg-amber-500 text-black p-1.5 rounded-lg font-black text-xl tracking-wider">
            CH
          </div>
          <span className="text-xl font-bold tracking-tight text-white hidden sm:inline">
            CineHub
          </span>
        </Link>

        {/* Enlaces principales */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <Link href="/" className="hover:text-amber-400 transition-colors">
            En Cartelera
          </Link>
          <Link href="/dulceria" className="hover:text-amber-400 transition-colors">
            Dulcería
          </Link>

          {usuario && !esStaff && (
            <Link href="/historial" className="hover:text-amber-400 transition-colors">
              Mis Compras
            </Link>
          )}

          {esStaff && (
            <Link href="/empleado" className="hover:text-amber-400 transition-colors">
              Taquilla / Validación
            </Link>
          )}

          {esAdmin && (
            <Link href="/admin" className="hover:text-amber-400 transition-colors">
              Panel Admin
            </Link>
          )}
        </nav>

        {/* Sesión */}
        <div className="flex items-center gap-3">
          {usuario ? (
            <>
              <span className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-sm font-semibold text-white">{usuario.nombre}</span>
                <span className="text-[11px] text-amber-400 font-medium">{usuario.rol}</span>
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition-colors"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Es un componente cliente porque usa el contexto de sesión y el router.
   - Los enlaces mostrados dependen de rol_id: 1 Cliente, 2 Empleado, 3 Admin.
   - "Cerrar Sesión" borra el token y el usuario del localStorage.
   ============================================================ */
