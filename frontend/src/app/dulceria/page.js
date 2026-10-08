'use client';

// ============================================================
// Catálogo público de dulcería.
// Muestra los productos, su precio y disponibilidad.
// La compra real se realiza al reservar (como complemento).
// ============================================================
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';

export default function DulceriaPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dulceria')
      .then(setProductos)
      .catch((error) => console.error('Error al cargar dulcería:', error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full">
        <h1 className="text-3xl font-extrabold text-white mb-2">🍿 Dulcería</h1>
        <p className="text-slate-400 text-sm mb-8">
          Agrega tus snacks favoritos durante la reserva de tus boletas.
        </p>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Cargando productos...</div>
        ) : productos.length === 0 ? (
          <div className="text-center py-20 bg-[#13151a] rounded-2xl border border-slate-800 text-slate-400">
            No hay productos disponibles por el momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productos.map((producto) => (
              <div
                key={producto.id}
                className="bg-[#13151a] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-500/40 transition-colors"
              >
                <div>
                  <h3 className="text-lg font-bold text-white">{producto.nombre}</h3>
                  <p className="text-2xl font-extrabold text-amber-400 mt-2">
                    ${Number(producto.precio).toLocaleString('es-CO')}
                  </p>
                </div>
                <p
                  className={`text-xs mt-4 font-semibold ${
                    producto.stock > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {producto.stock > 0 ? `Disponible (${producto.stock})` : 'Agotado'}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 bg-[#13151a] border border-slate-800/80 rounded-2xl p-5 text-sm text-slate-400">
          💡 Los productos de dulcería se agregan al momento de{' '}
          <span className="text-amber-400 font-semibold">reservar una función</span>.
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Consume GET /dulceria (público) que devuelve id, nombre, precio, stock.
   - No permite compra directa: la dulcería se agrega en /reserva/:funcionId.
   ============================================================ */
