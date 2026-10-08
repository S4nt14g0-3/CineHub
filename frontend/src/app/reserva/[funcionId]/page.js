'use client';

// ============================================================
// Página de reserva de una función.
// - Requiere sesión iniciada (si no, redirige a /login).
// - Permite elegir asientos y, opcionalmente, productos de dulcería.
// - Crea la compra contra el backend con el token del usuario.
// ============================================================
import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { getAsientosFuncion, crearCompra } from '@/services/reservaServices';
import { api } from '@/lib/api';
import { Modal } from '@/components/admin/ui';

export default function ReservaPage({ params }) {
  const resolvedParams = use(params);
  const funcionId = resolvedParams.funcionId;
  const router = useRouter();
  const { usuario, cargando: cargandoSesion } = useAuth();

  const [funcionInfo, setFuncionInfo] = useState(null);
  const [asientos, setAsientos] = useState([]);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState([]);
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState({}); // { productoId: cantidad }
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [reservaExitosa, setReservaExitosa] = useState(false);
  const [error, setError] = useState('');

  // Protege la ruta: sin sesión no se puede comprar.
  useEffect(() => {
    if (!cargandoSesion && !usuario) {
      router.replace(`/login?redirect=/reserva/${funcionId}`);
    }
  }, [cargandoSesion, usuario, router, funcionId]);

  // Carga el mapa de asientos de la función.
  const cargarMapa = useCallback(async () => {
    if (!funcionId) return;
    try {
      const data = await getAsientosFuncion(funcionId);
      if (data) {
        setFuncionInfo(data.funcion || data);
        setAsientos(data.asientos || []);
      }
    } catch (err) {
      console.error('Error al cargar mapa de la sala:', err);
    } finally {
      setLoading(false);
    }
  }, [funcionId]);

  useEffect(() => {
    (async () => {
      await cargarMapa();
    })();
  }, [cargarMapa]);

  // Carga el catálogo de dulcería (opcional para la compra).
  useEffect(() => {
    api
      .get('/dulceria')
      .then(setProductos)
      .catch(() => setProductos([]));
  }, []);

  const toggleAsiento = (asiento) => {
    if (asiento.ocupado) return;
    const existe = asientosSeleccionados.find((a) => a.id === asiento.id);
    if (existe) {
      setAsientosSeleccionados(asientosSeleccionados.filter((a) => a.id !== asiento.id));
    } else {
      setAsientosSeleccionados([...asientosSeleccionados, asiento]);
    }
  };

  const cambiarCantidad = (productoId, delta) => {
    setCarrito((prev) => {
      const actual = prev[productoId] || 0;
      const nueva = Math.max(0, actual + delta);
      const copia = { ...prev };
      if (nueva === 0) delete copia[productoId];
      else copia[productoId] = nueva;
      return copia;
    });
  };

  const precioUnitario = Number(funcionInfo?.precio_boleta || 0);
  const subtotalBoletas = asientosSeleccionados.length * precioUnitario;
  const subtotalDulceria = Object.entries(carrito).reduce((total, [id, cantidad]) => {
    const producto = productos.find((p) => p.id === Number(id));
    return total + (producto ? Number(producto.precio) * cantidad : 0);
  }, 0);
  const totalPagar = subtotalBoletas + subtotalDulceria;

  const handleConfirmarReserva = async () => {
    if (asientosSeleccionados.length === 0 || procesando) return;
    setProcesando(true);
    setError('');

    const idsComprados = asientosSeleccionados.map((a) => a.id);

    const payload = {
      funcion_id: parseInt(funcionId, 10),
      asientos_ids: idsComprados,
      productos_dulceria: Object.entries(carrito).map(([id, cantidad]) => ({
        producto_id: Number(id),
        cantidad,
      })),
    };

    try {
      await crearCompra(payload);

      // Actualización optimista: marca los asientos como ocupados.
      setAsientos((prev) =>
        prev.map((a) => (idsComprados.includes(a.id) ? { ...a, ocupado: true } : a))
      );
      setAsientosSeleccionados([]);
      setCarrito({});
      await cargarMapa();

      setReservaExitosa(true);
    } catch (err) {
      console.error('Error al reservar:', err);
      setError(err.message || 'Ocurrió un error al procesar tu reserva.');
    } finally {
      setProcesando(false);
    }
  };

  // Cierra el modal de éxito y lleva al usuario a sus boletas.
  const cerrarReservaExitosa = () => {
    setReservaExitosa(false);
    router.push(usuario?.rol_id === 1 ? '/historial' : '/empleado');
  };

  if (loading || cargandoSesion) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400">
          Cargando mapa de la sala...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* COLUMNA IZQUIERDA: MAPA + DULCERÍA */}
        <div className="lg:col-span-2 space-y-8">
          {/* MAPA DE ASIENTOS */}
          <div className="bg-[#13151a] p-8 rounded-2xl border border-slate-800/80 flex flex-col items-center">
            <h1 className="text-2xl font-bold text-white mb-2">Selección de Asientos</h1>
            <p className="text-xs text-slate-400 mb-8">
              {funcionInfo?.pelicula_titulo || 'Película'} —{' '}
              {funcionInfo?.sala_nombre || 'Sala General'}
            </p>

            {/* Pantalla visual */}
            <div className="w-full max-w-lg mb-10 text-center">
              <div className="h-2 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent rounded-full shadow-[0_10px_25px_rgba(245,158,11,0.3)] mb-2" />
              <p className="text-[10px] tracking-widest text-slate-500 uppercase font-bold">
                PANTALLA
              </p>
            </div>

            {/* Grilla de asientos */}
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-3 max-w-md my-4">
              {asientos.map((asiento) => {
                const esSeleccionado = asientosSeleccionados.some((a) => a.id === asiento.id);
                const esOcupado = Boolean(asiento.ocupado);

                return (
                  <button
                    key={asiento.id}
                    disabled={esOcupado}
                    onClick={() => toggleAsiento(asiento)}
                    className={`w-10 h-10 rounded-lg font-bold text-xs transition-all flex items-center justify-center border ${
                      esOcupado
                        ? 'bg-red-950/40 border-red-900/50 text-red-700 cursor-not-allowed'
                        : esSeleccionado
                        ? 'bg-amber-500 text-black border-amber-400 scale-110 shadow-lg shadow-amber-500/20'
                        : 'bg-[#1a1d24] text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white'
                    }`}
                  >
                    {asiento.codigo || `${asiento.fila}${asiento.numero}`}
                  </button>
                );
              })}
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-6 mt-10 pt-6 border-t border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-[#1a1d24] border border-slate-700 inline-block" />
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-amber-500 inline-block" />
                <span>Seleccionado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-red-950/60 border border-red-900 inline-block" />
                <span>Ocupado</span>
              </div>
            </div>
          </div>

          {/* DULCERÍA OPCIONAL */}
          {productos.length > 0 && (
            <div className="bg-[#13151a] p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-lg font-bold text-white mb-4">🍬 ¿Quieres agregar dulcería?</h2>
              <div className="space-y-3">
                {productos.map((producto) => {
                  const cantidad = carrito[producto.id] || 0;
                  const sinStock = producto.stock <= 0;
                  return (
                    <div
                      key={producto.id}
                      className="flex items-center justify-between gap-4 bg-[#181a20] border border-slate-800 rounded-xl px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{producto.nombre}</p>
                        <p className="text-xs text-slate-400">
                          ${Number(producto.precio).toLocaleString('es-CO')} · stock: {producto.stock}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => cambiarCantidad(producto.id, -1)}
                          disabled={cantidad === 0}
                          className="w-8 h-8 rounded-lg bg-slate-800 text-white disabled:opacity-40 hover:bg-slate-700"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-bold text-white">{cantidad}</span>
                        <button
                          onClick={() => cambiarCantidad(producto.id, 1)}
                          disabled={sinStock || cantidad >= producto.stock}
                          className="w-8 h-8 rounded-lg bg-slate-800 text-white disabled:opacity-40 hover:bg-slate-700"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RESUMEN DE COMPRA */}
        <div className="bg-[#13151a] p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between h-fit space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-800 pb-3">
              🎟️ Resumen de Compra
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-400 gap-4">
                <span>Asientos:</span>
                <span className="font-bold text-white text-right">
                  {asientosSeleccionados.length > 0
                    ? asientosSeleccionados
                        .map((a) => a.codigo || `${a.fila}${a.numero}`)
                        .join(', ')
                    : 'Ninguno'}
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Precio por boleta:</span>
                <span className="font-bold text-white">
                  ${precioUnitario.toLocaleString('es-CO')}
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Subtotal boletas:</span>
                <span className="font-bold text-white">
                  ${subtotalBoletas.toLocaleString('es-CO')}
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Subtotal dulcería:</span>
                <span className="font-bold text-white">
                  ${subtotalDulceria.toLocaleString('es-CO')}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-base font-bold text-white">Total a pagar:</span>
                <span className="text-2xl font-extrabold text-amber-400">
                  ${totalPagar.toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-xs bg-red-950/40 border border-red-900/60 text-red-300 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>

          <button
            disabled={asientosSeleccionados.length === 0 || procesando}
            onClick={handleConfirmarReserva}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              asientosSeleccionados.length > 0 && !procesando
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            {procesando ? 'Procesando...' : 'Confirmar y Reservar'}
          </button>
        </div>
      </main>

      {/* Modal de éxito tras reservar */}
      <Modal abierto={reservaExitosa} titulo="¡Reserva realizada con éxito! 🍿">
        <p className="text-sm text-slate-300 mb-5">
          Disfruta tu película. Tus tickets ya están disponibles en tu historial.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={cerrarReservaExitosa}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-black transition-colors"
          >
            Ver mis boletas
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Sin sesión, redirige a /login?redirect=/reserva/:funcionId.
   - El payload que espera el backend es:
       { funcion_id, asientos_ids: number[], productos_dulceria: [{producto_id, cantidad}] }
   - El backend calcula el total; el frontend solo lo muestra (no lo envía).
   - Si la compra falla (p. ej. asiento ocupado), se muestra el mensaje real.
   ============================================================ */
