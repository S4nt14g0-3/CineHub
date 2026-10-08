'use client';

// ============================================================
// Panel de Administración (solo rol Administrador).
// Reúne en pestañas la gestión de películas, funciones, salas,
// dulcería, usuarios y los reportes/auditoría.
// ============================================================
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth, ROLES } from '@/context/AuthContext';
import PanelPeliculas from '@/components/admin/PanelPeliculas';
import PanelFunciones from '@/components/admin/PanelFunciones';
import PanelSalas from '@/components/admin/PanelSalas';
import PanelDulceria from '@/components/admin/PanelDulceria';
import PanelUsuarios from '@/components/admin/PanelUsuarios';
import PanelReportes from '@/components/admin/PanelReportes';

const TABS = [
  { id: 'peliculas', label: '🎬 Películas' },
  { id: 'funciones', label: '📅 Funciones' },
  { id: 'salas', label: '🏛️ Salas' },
  { id: 'dulceria', label: '🍿 Dulcería' },
  { id: 'usuarios', label: '👥 Usuarios' },
  { id: 'reportes', label: '📊 Reportes' },
];

export default function AdminPage() {
  const router = useRouter();
  const { usuario, cargando } = useAuth();
  const [tab, setTab] = useState('peliculas');

  const esAdmin = usuario?.rol_id === ROLES.ADMINISTRADOR;

  // Protege la ruta: solo Administrador.
  useEffect(() => {
    if (!cargando) {
      if (!usuario) router.replace('/login?redirect=/admin');
      else if (!esAdmin) router.replace('/');
    }
  }, [cargando, usuario, esAdmin, router]);

  if (cargando || !esAdmin) {
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

      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full">
        <h1 className="text-3xl font-extrabold text-white mb-2">⚙️ Panel de Administración</h1>
        <p className="text-slate-400 text-sm mb-8">
          Gestiona el catálogo, la programación, el personal y revisa las métricas del cine.
        </p>

        {/* Pestañas */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 border-b border-slate-800">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-t-lg text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                tab === t.id
                  ? 'text-amber-400 border-amber-500'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenido de la pestaña activa */}
        {tab === 'peliculas' && <PanelPeliculas />}
        {tab === 'funciones' && <PanelFunciones />}
        {tab === 'salas' && <PanelSalas />}
        {tab === 'dulceria' && <PanelDulceria />}
        {tab === 'usuarios' && <PanelUsuarios />}
        {tab === 'reportes' && <PanelReportes />}
      </main>
    </div>
  );
}

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Solo accesible con rol Administrador (rol_id = 3).
   - Cada pestaña es un componente independiente en components/admin/.
   - Las peticiones protegidas usan los helpers getAuth/postAuth/etc. de lib/api.
   ============================================================ */
