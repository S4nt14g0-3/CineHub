// ============================================================
// Esqueleto animado para la cartelera mientras cargan las películas.
// Reproduce la forma exacta de PeliculaCard (póster + texto) para
// que la transición al cargar sea imperceptible.
// ============================================================
export default function SkeletonPelicula() {
  return (
    <div className="bg-[#16181d] rounded-2xl overflow-hidden border border-slate-800/80 flex flex-col animate-pulse">
      {/* Póster */}
      <div className="relative aspect-[2/3] w-full bg-slate-800/70" />

      {/* Título y duración */}
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-800" />
        <div className="h-3 w-1/3 rounded bg-slate-800/80" />
        {/* Chips de géneros */}
        <div className="flex gap-1.5 mt-3">
          <div className="h-5 w-14 rounded-md bg-slate-800/80" />
          <div className="h-5 w-12 rounded-md bg-slate-800/80" />
        </div>
      </div>
    </div>
  );
}
