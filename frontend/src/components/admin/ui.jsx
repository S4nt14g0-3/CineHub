// ============================================================
// Estilos y utilidades compartidas por los paneles de administración.
// Centralizarlos evita repetir las mismas clases en cada panel.
// ============================================================

export const inputClass =
  'w-full bg-[#181a20] text-white px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 text-sm';

export const labelClass = 'text-xs font-semibold text-slate-400 mb-1 block';

export const btnPrimary =
  'px-4 py-2.5 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-black transition-colors disabled:opacity-60';

export const btnSecondary =
  'px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors';

export const btnDanger =
  'px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-900/60 transition-colors';

export const btnSmall =
  'px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors';

export const cardClass = 'bg-[#13151a] border border-slate-800/80 rounded-2xl p-6';

export const tableHeadClass = 'text-left text-slate-400 border-b border-slate-800';

// Tarjeta de sección con título.
export function Seccion({ titulo, accion, children }) {
  return (
    <section className={cardClass}>
      <div className="flex items-center justify-between mb-4 gap-4">
        <h2 className="text-lg font-bold text-white">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

// Mensaje de error reutilizable.
export function ErrorBox({ mensaje }) {
  if (!mensaje) return null;
  return (
    <p className="text-xs bg-red-950/40 border border-red-900/60 text-red-300 rounded-lg px-3 py-2">
      {mensaje}
    </p>
  );
}

// Mensaje de éxito reutilizable.
export function ExitoBox({ mensaje }) {
  if (!mensaje) return null;
  return (
    <p className="text-xs bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 rounded-lg px-3 py-2">
      {mensaje}
    </p>
  );
}

// Modal genérico reutilizable (overlay + tarjeta). Acepta cualquier contenido.
export function Modal({ abierto, titulo, children }) {
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#13151a] border border-slate-800 rounded-2xl p-5 w-full max-w-md shadow-2xl">
        {titulo && <h3 className="text-lg font-bold text-white mb-2">{titulo}</h3>}
        {children}
      </div>
    </div>
  );
}

// Modal de confirmación reutilizable para eliminaciones en todos los paneles.
export function ConfirmDialog({ abierto, titulo = 'Confirmar eliminación', mensaje, cargando = false, textoConfirmar = 'Eliminar', onConfirm, onCancel }) {
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#13151a] border border-slate-800 rounded-2xl p-5 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-2">{titulo}</h3>
        <p className="text-sm text-slate-300 mb-5">{mensaje}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
            onClick={onCancel}
            disabled={cargando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-bold bg-red-950/60 hover:bg-red-900/70 text-red-300 border border-red-900/60 transition-colors"
            onClick={onConfirm}
            disabled={cargando}
          >
            {cargando ? 'Eliminando...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - `inputClass`, `labelClass`, `btnPrimary`, `btnDanger`, `cardClass`... son
     solo cadenas de clases Tailwind para mantener el estilo uniforme.
   - <Seccion> y <ErrorBox> son componentes de apoyo usados por los paneles.
   ============================================================ */
