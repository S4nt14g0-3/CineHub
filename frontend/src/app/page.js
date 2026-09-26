'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import PeliculaCard from '@/components/PeliculaCard';
import { getPeliculas } from '@/services/peliculasServices';

const GENEROS = [
  'Todos', 'Acción', 'Aventura', 'Animación', 'Crimen', 
  'Drama', 'Fantasía', 'Terror', 'Misterio', 'Romance', 'Ciencia Ficción'
];

export default function Home() {
  const [peliculas, setPeliculas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [generoSeleccionado, setGeneroSeleccionado] = useState('Todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      const data = await getPeliculas();
      setPeliculas(data);
      setLoading(false);
    }
    cargar();
  }, []);

  // Filtrado dinámico por búsqueda y género
  const peliculasFiltradas = peliculas.filter((pelicula) => {
    const coincideTexto = pelicula.titulo.toLowerCase().includes(busqueda.toLowerCase());
    const coincideGenero = generoSeleccionado === 'Todos' || 
      (pelicula.genero && pelicula.genero.toLowerCase().includes(generoSeleccionado.toLowerCase()));
    return coincideTexto && coincideGenero;
  });

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full">
        {/* HERO SECTION */}
        <section className="mb-12 text-left">
          <span className="inline-block bg-amber-500/10 text-amber-400 text-xs font-semibold px-3 py-1 rounded-full border border-amber-500/20 mb-4">
            🍿 En Cartelera Esta Semana
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight max-w-2xl leading-tight">
            Reserva tu lugar para las mejores películas
          </h1>
          <p className="text-slate-400 mt-3 text-base max-w-xl">
            Explora las funciones de la semana, consulta los detalles y asegura los mejores asientos en pocos pasos.
          </p>
        </section>

        {/* BUSCADOR Y FILTROS */}
        <section className="space-y-6 mb-10">
          {/* Input de Búsqueda */}
          <div className="relative max-w-2xl">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar por título o género..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-[#13151a] text-white pl-11 pr-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 transition-colors text-sm placeholder-slate-500"
            />
          </div>

          {/* Chips de Géneros */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {GENEROS.map((gen) => (
              <button
                key={gen}
                onClick={() => setGeneroSeleccionado(gen)}
                className={`px-4 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  generoSeleccionado === gen
                    ? 'bg-amber-500 text-black border-amber-500 font-bold'
                    : 'bg-[#13151a] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {gen}
              </button>
            ))}
          </div>
        </section>

        {/* CATALOGO DE PELICULAS */}
        <section>
          {loading ? (
            <div className="text-center py-20 text-slate-500">Cargando cartelera...</div>
          ) : peliculasFiltradas.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {peliculasFiltradas.map((pelicula) => (
                <PeliculaCard key={pelicula.id} pelicula={pelicula} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-[#13151a] rounded-2xl border border-slate-800 text-slate-400">
              No se encontraron películas para esta búsqueda.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}