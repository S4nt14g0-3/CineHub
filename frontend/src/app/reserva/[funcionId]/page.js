'use client';
import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getAsientosFuncion, crearCompra } from '@/services/reservaServices';

export default function ReservaPage({ params }) {
  const resolvedParams = use(params);
  const funcionId = resolvedParams.funcionId;
  const router = useRouter();

  const [funcionInfo, setFuncionInfo] = useState(null);
  const [asientos, setAsientos] = useState([]);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);

  // Función para obtener la información de la función y los asientos ocupados
  const cargarMapa = useCallback(async () => {
    if (!funcionId) return;
    try {
      const data = await getAsientosFuncion(funcionId);
      if (data) {
        setFuncionInfo(data.funcion || data);
        setAsientos(data.asientos || []);
      }
    } catch (error) {
      console.error('Error al cargar mapa de la sala:', error);
    } finally {
      setLoading(false);
    }
  }, [funcionId]);

  useEffect(() => {
    cargarMapa();
  }, [cargarMapa]);

  const toggleAsiento = (asiento) => {
    if (asiento.ocupado) return;

    const existe = asientosSeleccionados.find((a) => a.id === asiento.id);
    if (existe) {
      setAsientosSeleccionados(asientosSeleccionados.filter((a) => a.id !== asiento.id));
    } else {
      setAsientosSeleccionados([...asientosSeleccionados, asiento]);
    }
  };

  const precioUnitario = Number(funcionInfo?.precio_boleta || 12000);
  const totalPagar = asientosSeleccionados.length * precioUnitario;

  const handleConfirmarReserva = async () => {
    if (asientosSeleccionados.length === 0 || procesando) return;

    setProcesando(true);

    const idsComprados = asientosSeleccionados.map((a) => a.id);

    const payload = {
      funcion_id: parseInt(funcionId, 10),
      asientos_ids: idsComprados,
      metodo_pago: 'Tarjeta / Efectivo',
      total: totalPagar,
    };

    try {
      const resultado = await crearCompra(payload);

      if (resultado) {
        // 1. Actualización optimista: Cambia los asientos seleccionados a ocupados inmediatamente
        setAsientos((prevAsientos) =>
          prevAsientos.map((asiento) =>
            idsComprados.includes(asiento.id)
              ? { ...asiento, ocupado: true }
              : asiento
          )
        );

        // 2. Limpiar la lista de selección
        setAsientosSeleccionados([]);

        // 3. Volver a consultar el estado real desde la base de datos
        await cargarMapa();

        alert('¡Reserva realizada con éxito! 🍿 Disfruta tu película.');
        router.push('/');
      } else {
        alert('Ocurrió un error al procesar tu reserva. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error al reservar:', error);
      alert('Error en el servidor al procesar la reserva.');
    } finally {
      setProcesando(false);
    }
  };

  if (loading) {
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
        
        {/* SECCIÓN DEL MAPA DE SALA (2 COLUMNAS) */}
        <div className="lg:col-span-2 bg-[#13151a] p-8 rounded-2xl border border-slate-800/80 flex flex-col items-center">
          <h1 className="text-2xl font-bold text-white mb-2">Selección de Asientos</h1>
          <p className="text-xs text-slate-400 mb-8">
            {funcionInfo?.pelicula_titulo || 'Película'} — {funcionInfo?.sala_nombre || 'Sala General'}
          </p>

          {/* PANTALLA VISUAL */}
          <div className="w-full max-w-lg mb-10 text-center">
            <div className="h-2 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent rounded-full shadow-[0_10px_25px_rgba(245,158,11,0.3)] mb-2" />
            <p className="text-[10px] tracking-widest text-slate-500 uppercase font-bold">PANTALLA</p>
          </div>

          {/* GRILLA DE ASIENTOS */}
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

          {/* LEYENDA */}
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

        {/* RESUMEN DE COMPRA (1 COLUMNA) */}
        <div className="bg-[#13151a] p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between h-fit space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-800 pb-3">
              🎟️ Resumen de Compra
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Asientos seleccionados:</span>
                <span className="font-bold text-white">
                  {asientosSeleccionados.length > 0
                    ? asientosSeleccionados.map((a) => a.codigo || `${a.fila}${a.numero}`).join(', ')
                    : 'Ninguno'}
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Precio por boleta:</span>
                <span className="font-bold text-white">
                  ${precioUnitario.toLocaleString('es-CO')}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-base font-bold text-white">Total a pagar:</span>
                <span className="text-2xl font-extrabold text-amber-400">
                  ${totalPagar.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
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
    </div>
  );
}