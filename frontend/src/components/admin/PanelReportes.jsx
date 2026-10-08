'use client';

// ============================================================
// Panel de Reportes de ventas y Auditoría de accesos.
// ============================================================
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Seccion, ErrorBox, cardClass } from './ui';

export default function PanelReportes() {
  const [reporte, setReporte] = useState(null);
  const [auditoria, setAuditoria] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const [r, a] = await Promise.all([
          api.getAuth('/admin/reportes/ventas'),
          api.getAuth('/admin/auditoria'),
        ]);
        setReporte(r);
        setAuditoria(a);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  if (cargando) return <p className="text-sm text-slate-400">Cargando reportes...</p>;

  const resumen = reporte?.resumen || {};

  return (
    <div className="space-y-6">
      <ErrorBox mensaje={error} />

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={cardClass}>
          <p className="text-xs text-slate-400 font-semibold">Ingresos totales</p>
          <p className="text-2xl font-extrabold text-amber-400 mt-1">
            ${Number(resumen.ingresos_totales || 0).toLocaleString('es-CO')}
          </p>
        </div>
        <div className={cardClass}>
          <p className="text-xs text-slate-400 font-semibold">Compras registradas</p>
          <p className="text-2xl font-extrabold text-white mt-1">{resumen.total_compras || 0}</p>
        </div>
        <div className={cardClass}>
          <p className="text-xs text-slate-400 font-semibold">Ticket promedio</p>
          <p className="text-2xl font-extrabold text-white mt-1">
            ${Number(resumen.ticket_promedio || 0).toLocaleString('es-CO')}
          </p>
        </div>
      </div>

      {/* Ventas por película */}
      <Seccion titulo="Boletas e ingresos por película">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="py-2 pr-3 font-semibold">Película</th>
                <th className="py-2 pr-3 font-semibold">Boletas</th>
                <th className="py-2 pr-3 font-semibold">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {(reporte?.por_pelicula || []).map((p) => (
                <tr key={p.titulo} className="border-b border-slate-800/60">
                  <td className="py-2.5 pr-3 text-white font-medium">{p.titulo}</td>
                  <td className="py-2.5 pr-3 text-slate-300">{p.boletas}</td>
                  <td className="py-2.5 pr-3 text-slate-300">
                    ${Number(p.ingresos).toLocaleString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Seccion>

      {/* Ventas de dulcería */}
      <Seccion titulo="Ventas de dulcería">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="py-2 pr-3 font-semibold">Producto</th>
                <th className="py-2 pr-3 font-semibold">Unidades</th>
                <th className="py-2 pr-3 font-semibold">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {(reporte?.dulceria || []).map((d) => (
                <tr key={d.nombre} className="border-b border-slate-800/60">
                  <td className="py-2.5 pr-3 text-white font-medium">{d.nombre}</td>
                  <td className="py-2.5 pr-3 text-slate-300">{d.unidades}</td>
                  <td className="py-2.5 pr-3 text-slate-300">
                    ${Number(d.ingresos).toLocaleString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Seccion>

      {/* Auditoría de accesos */}
      <Seccion titulo="Auditoría de accesos (últimos 200)">
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#13151a]">
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="py-2 pr-3 font-semibold">Fecha</th>
                <th className="py-2 pr-3 font-semibold">Usuario</th>
                <th className="py-2 pr-3 font-semibold">Correo</th>
                <th className="py-2 pr-3 font-semibold">IP</th>
                <th className="py-2 pr-3 font-semibold">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {auditoria.map((a) => (
                <tr key={a.id} className="border-b border-slate-800/60">
                  <td className="py-2 pr-3 text-slate-400">
                    {new Date(a.fecha_ingreso).toLocaleString('es-CO')}
                  </td>
                  <td className="py-2 pr-3 text-white">{a.usuario}</td>
                  <td className="py-2 pr-3 text-slate-300">{a.email}</td>
                  <td className="py-2 pr-3 text-slate-400 font-mono text-xs">{a.ip_origen}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={`text-xs font-semibold ${
                        a.exitoso ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {a.exitoso ? 'Exitoso' : 'Fallido'}
                    </span>
                  </td>
                </tr>
              ))}
              {auditoria.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">
                    Sin registros de acceso.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Seccion>
    </div>
  );
}

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - Endpoints: GET /admin/reportes/ventas y GET /admin/auditoria (solo Admin).
   - Cada inicio de sesión (exitoso o fallido) queda registrado en
     auditoria_accesos desde authController.
   ============================================================ */
