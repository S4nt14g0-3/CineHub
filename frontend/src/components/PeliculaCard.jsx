import Link from 'next/link';

// ============================================================
// Tarjeta de película usada en la cartelera.
// Muestra el póster, la clasificación, la duración y los géneros.
// ============================================================
export default function PeliculaCard({ pelicula }) {
  return (
    <Link
      href={`/pelicula/${pelicula.id}`}
      className="group bg-[#16181d] rounded-2xl overflow-hidden border border-slate-800/80 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      {/* Póster y badge de clasificación */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-800">
        <img
          src={pelicula.poster_url || 'https://via.placeholder.com/400x600'}
          alt={pelicula.titulo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-slate-200 text-xs font-semibold px-2 py-1 rounded-md border border-slate-700/50">
          {pelicula.clasificacion || 'TP'}
        </span>
      </div>

      {/* Información de la película */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-bold text-white text-lg group-hover:text-amber-400 transition-colors line-clamp-1">
            {pelicula.titulo}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {pelicula.duracion_minutos ? `${pelicula.duracion_minutos} min` : 'Duración N/D'}
          </p>
        </div>

        {/* Géneros */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {pelicula.genero ? (
            pelicula.genero.split(',').map((gen, index) => (
              <span
                key={index}
                className="text-[11px] font-medium bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50"
              >
                {gen.trim()}
              </span>
            ))
          ) : (
            <span className="text-[11px] font-medium bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50">
              General
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - La imagen correcta es `pelicula.poster_url` (el backend no devuelve
     `imagen_url`; usar el nombre equivocado rompe la imagen).
   - `genero` llega como texto separado por comas y aquí se divide en chips.
   ============================================================ */
