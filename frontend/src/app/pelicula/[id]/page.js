'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getPeliculaById } from '@/services/peliculasServices';

export default function PeliculaDetallePage({ params }) {
  // Desempaquetar los parámetros dinámicos de la URL usando React.use()
  const resolvedParams = use(params);
  const peliculaId = resolvedParams.id;
  const router = useRouter();

  const [pelicula, setPelicula] = useState(null);
  const [loading, setLoading] = useState(true);
  const [funcionSeleccionada, setFuncionSeleccionada] = useState(null);

  useEffect(() => {
    async function cargar() {
      if (peliculaId) {
        const data = await getPeliculaById(peliculaId);
        setPelicula(data);
        setLoading(false);
      }
    }
    cargar();
  }, [peliculaId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400">
          Cargando detalles de la película...
        </div>
      </div>
    );
  }

  if (!pelicula) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
          <p className="text-xl">No se encontró la película solicitada.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors"
          >
            Volver a la Cartelera
          </button>
        </div>
      </div>
    );
  }

  const handleContinuarASeleccionAsientos = () => {
    if (!funcionSeleccionada) return;
    // Navegar a la pantalla de reserva enviando el ID de la función
    router.push(`/reserva/${funcionSeleccionada.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full">
        {/* Botón Volver */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-8 font-medium"
        >
          ← Volver a la Cartelera
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
          {/* POSTER GRANDE */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#16181d] shadow-2xl">
            <img
              src={pelicula.imagen_url || 'https://via.placeholder.com/400x600'}
              alt={pelicula.titulo}
              className="w-full h-auto object-cover"
            />
          </div>

          {/* DETALLES Y FUNCIONES */}
          <div className="md:col-span-2 space-y-8">
            {/* Header / Badges */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="bg-amber-500/10 text-amber-400 text-xs font-semibold px-3 py-1 rounded-full border border-amber-500/20">
                  {pelicula.clasificacion || 'PG-13'}
                </span>
                <span className="bg-slate-800 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1">
                  ★ {pelicula.rating || '8.0'}
                </span>
                <span className="text-slate-400 text-xs font-medium">
                  ⏱️ {pelicula.duracion_minutos ? `${pelicula.duracion_minutos} min` : '120 min'}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                {pelicula.titulo}
              </h1>

              <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                {pelicula.sinopsis || 'Sinopsis no disponible para esta película.'}
              </p>
            </div>

            {/* SECCIÓN DE HORARIOS Y FUNCIONES */}
            <div className="bg-[#13151a] p-6 rounded-2xl border border-slate-800/80 space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                📅 Selecciona una Función
              </h2>

              {pelicula.funciones && pelicula.funciones.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pelicula.funciones.map((func) => {
                    const isSelected = funcionSeleccionada?.id === func.id;
                    const fecha = new Date(func.fecha_hora);
                    const horaFormateada = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const fechaFormateada = fecha.toLocaleDateString([], { month: 'short', day: 'numeric' });

                    return (
                      <button
                        key={func.id}
                        onClick={() => setFuncionSeleccionada(func)}
                        className={`p-4 rounded-xl border text-left transition-all duration-200 flex justify-between items-center ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/5'
                            : 'bg-[#181a20] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <div>
                          <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
                            Sala: {func.sala_nombre || `Sala ${func.sala_id}`}
                          </p>
                          <p className="text-lg font-bold text-white mt-0.5">
                            {horaFormateada}
                          </p>
                          <p className="text-xs text-slate-400">
                            {fechaFormateada}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">
                            ${Number(func.precio_boleta || 12000).toLocaleString('es-CO')}
                          </p>
                          <span className={`inline-block w-3 h-3 rounded-full mt-2 ${isSelected ? 'bg-amber-400' : 'bg-slate-700'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">
                  No hay funciones programadas actualmente para esta película.
                </p>
              )}

              {/* Botón Acción para ir a Asientos */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  disabled={!funcionSeleccionada}
                  onClick={handleContinuarASeleccionAsientos}
                  className={`px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                    funcionSeleccionada
                      ? 'bg-amber-500 hover:bg-amber-400 text-black cursor-pointer shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  }`}
                >
                  {funcionSeleccionada ? 'Seleccionar Asientos →' : 'Selecciona una función para continuar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}