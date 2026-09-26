import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="w-full bg-[#0e0f12]/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-amber-500 text-black p-1.5 rounded-lg font-black text-xl tracking-wider">
            CH
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            CineHub <span className="text-amber-500">Sur</span>
          </span>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <Link href="/" className="text-white hover:text-amber-400 transition-colors">
            En Cartelera
          </Link>

          <Link href="/dulceria" className="hover:text-amber-400 transition-colors">
            Dulcería
          </Link>
          <Link href="/historial" className="hover:text-amber-400 transition-colors">
            Mis Compras
          </Link>
        </nav>

        {/* Acciones */}
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </header>
  );
}