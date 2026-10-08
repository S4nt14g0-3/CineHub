'use client';

// ============================================================
// Historial de compras del usuario autenticado.
// - Lista sus compras y permite ver el detalle (tickets + dulcería).
// ============================================================
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { getHistorialCompras, getCompraDetalle } from '@/services/reservaServices';

export default function HistorialPage() {
  const router = useRouter();
  const { usuario, cargando } = useAuth();

  const [compras, setCompras] = useState([]);
  const [cargandoCompras, setCargandoCompras] = useState(true);
  const [detalle, setDetalle] = useState(null); // detalle de la compra abierta
  const [compraActiva, setCompraActiva] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Protege la ruta: se requiere sesión.
  useEffect(() => {
    if (!cargando && !usuario) router.replace('/login?redirect=/historial');
  }, [cargando, usuario, router]);

  useEffect(() => {
    async function cargar() {
      if (!usuario) return;
      const data = await getHistorialCompras(usuario.id);
      setCompras(data);
      setCargandoCompras(false);
    }
    cargar();
  }, [usuario]);

  const verDetalle = async (compraId) => {
    // Si ya está abierta, se cierra.
    if (compraActiva === compraId) {
      setCompraActiva(null);
      setDetalle(null);
      return;
    }
    setCompraActiva(compraId);
    setCargandoDetalle(true);
    const data = await getCompraDetalle(compraId);
    setDetalle(data);
    setCargandoDetalle(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
        <h1 className="text-3xl font-extrabold text-white mb-2">🎟️ Mis Compras</h1>
        <p className="text-slate-400 text-sm mb-8">
          Aquí encontrarás tus boletas y los productos de dulcería que compraste.
        </p>

        {cargandoCompras ? (
          <div className="text-center py-20 text-slate-500">Cargando historial...</div>
        ) : compras.length === 0 ? (
          <div className="text-center py-20 bg-[#13151a] rounded-2xl border border-slate-800 text-slate-400">
            Aún no tienes compras registradas.
          </div>
        ) : (
          <div className="space-y-4">
            {compras.map((compra) => (
              <div
                key={compra.compra_id}
                className="bg-[#13151a] border border-slate-800/80 rounded-2xl overflow-hidden"
              >
                {/* Encabezado de la compra */}
                <button
                  onClick={() => verDetalle(compra.compra_id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[#181a20] transition-colors"
                >
                  <div>
                    <p className="text-sm font-bold text-white">Compra #{compra.compra_id}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(compra.fecha_compra).toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">
                        {compra.total_entradas} entrada(s) · {compra.total_dulceria} dulcería
                      </p>
                      <p className="text-base font-extrabold text-amber-400">
                        ${Number(compra.monto_total).toLocaleString('es-CO')}
                      </p>
                    </div>
                    <span className="text-slate-500">
                      {compraActiva === compra.compra_id ? '▲' : '▼'}
                    </span>
                  </div>
                </button>

                {/* Detalle expandible */}
                {compraActiva === compra.compra_id && (
                  <div className="border-t border-slate-800 px-5 py-4 bg-[#0f1116]">
                    {cargandoDetalle ? (
                      <p className="text-sm text-slate-400">Cargando detalle...</p>
                    ) : !detalle ? (
                      <p className="text-sm text-red-400">No se pudo cargar el detalle.</p>
                    ) : (
                      <div className="space-y-4">
                        {/* Tickets */}
                        <div>
                          <p className="text-xs font-bold text-slate-300 uppercase mb-2">
                            Boletas
                          </p>
                          <div className="space-y-2">
                            {detalle.tickets.map((t) => (
                              <div
                                key={t.id}
                                className="flex items-center justify-between gap-4 bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-sm"
                              >
                                <div>
                                  <p className="font-semibold text-white">{t.pelicula}</p>
                                  <p className="text-xs text-slate-400">
                                    {t.cine} · {t.sala} · Asiento {t.asiento}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {new Date(t.fecha_hora).toLocaleString('es-CO')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-amber-400">
                                    ${Number(t.precio).toLocaleString('es-CO')}
                                  </p>
                                  <p
                                    className={`text-[11px] font-semibold ${
                                      t.validado ? 'text-emerald-400' : 'text-slate-400'
                                    }`}
                                  >
                                    {t.validado ? 'Validado' : 'Sin validar'}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    {t.codigo_ticket}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dulcería */}
                        {detalle.productos.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-slate-300 uppercase mb-2">
                              Dulcería
                            </p>
                            <div className="space-y-2">
                              {detalle.productos.map((p) => (
                                <div
                                  key={p.id}
                                  className="flex items-center justify-between bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2 text-sm"
                                >
                                  <span className="text-slate-200">
                                    {p.cantidad}x {p.nombre}
                                  </span>
                                  <span className="font-semibold text-white">
                                    ${(p.cantidad * Number(p.precio_unitario)).toLocaleString('es-CO')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-[11px] text-slate-500">
                          Presenta el código de tu boleta en la entrada. El personal lo validará
                          desde la pantalla de Taquilla.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Usa el id del usuario logueado (el backend bloquea ver historial ajeno).
   - Cada compra muestra: monto_total, fecha, total_entradas, total_dulceria.
   - El detalle incluye tickets (con codigo_ticket y validado) y productos.
   ============================================================ */
