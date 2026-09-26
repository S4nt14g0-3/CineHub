import Link from 'next/link';

export default function PeliculaCard({ pelicula }) {
  return (
    <Link 
      href={`/pelicula/${pelicula.id}`}
      className="group bg-[#16181d] rounded-2xl overflow-hidden border border-slate-800/80 hover:border-amber-500/50 transition-all duration-300 flex flex-col"
    >
      {/* Poster e Badges */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-800">
        <img
          src={pelicula.imagen_url || 'https://via.placeholder.com/400x600'}
          alt={pelicula.titulo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badge Clasificación (Izquierda) */}
        <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-slate-200 text-xs font-semibold px-2 py-1 rounded-md border border-slate-700/50">
          {pelicula.clasificacion || 'PG-13'}
        </span>

        {/* Badge Rating (Derecha) */}
        <span className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-amber-400 text-xs font-bold px-2 py-1 rounded-md border border-slate-700/50 flex items-center gap-1">
          ★ {pelicula.rating || '8.0'}
        </span>
      </div>

      {/* Info de la Película */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-bold text-white text-lg group-hover:text-amber-400 transition-colors line-clamp-1">
            {pelicula.titulo}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {pelicula.duracion_minutos ? `${pelicula.duracion_minutos} min` : '120 min'}
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