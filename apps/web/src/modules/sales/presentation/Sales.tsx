import { Download, Filter, Info, PlusCircle, ShieldCheck, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { allowed, setNotice, useAppDispatch, useSession } from '../../security/auth/application/session';
import { PageResult } from '../../../shared/domain/pagination';
import { Card, PageHeading } from '../../../shared/presentation/layout';
import { Empty, ErrorBox, Loading } from '../../../shared/presentation/feedback';
import { SearchInput } from '../../../shared/presentation/forms';
import { Pagination, RowMenu } from '../../../shared/presentation/table';
import { useSalesApi } from '../application/repository-context';
import { Sale } from '../domain/models';

export function Sales() {
  const api = useSalesApi();
  const { user } = useSession();
  const dispatch = useAppDispatch();

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<PageResult<Sale>>(
    api.listSalesKey(q, undefined, page)
  );

  const handleAnnul = async (s: Sale) => {
    if (!window.confirm(`¿Anular la venta ${s.codigo}? Se restituirá el stock de productos.`)) return;
    try {
      await api.annulSale(s.id);
      await mutate();
      dispatch(setNotice(`Venta ${s.codigo} anulada y existencias restituidas.`));
    } catch (err: any) {
      dispatch(setNotice(err?.message || 'Error al anular venta'));
    }
  };

  const exportCsv = () => {
    if (!data?.items?.length) return;
    const headers = ['Codigo', 'Fecha', 'Hora', 'Cliente', 'NIT', 'Placa', 'MetodoPago', 'TotalBs', 'Sucursal', 'Cajero'];
    const rows = data.items.map((s: Sale) => [
      `"${s.codigo}"`,
      `"${s.fecha}"`,
      `"${s.hora}"`,
      `"${s.nombreCliente.replace(/"/g, '""')}"`,
      `"${s.nit}"`,
      `"${s.placa}"`,
      `"${s.metodoPago}"`,
      Number(s.montoPagado) - Number(s.montoCambio),
      `"${s.sucursalNombre || ''}"`,
      `"${s.usuarioNombre || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: (string | number)[]) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `ventas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <PageHeading title="Ventas" subtitle="Registro de ventas de combustible y tienda de conveniencia.">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="button" onClick={() => setShowFilter(!showFilter)}>
            <Filter size={16} /> Filtrar
          </button>
          <button className="button" onClick={exportCsv}>
            <Download size={16} /> Exportar
          </button>
          {allowed(user, 'ventas', 'crear') && (
            <Link
              to="/ventas/nueva"
              className="button primary"
              style={{ background: '#0f172a', color: '#ffffff', borderRadius: '8px' }}
            >
              <PlusCircle size={16} /> Nueva Venta
            </Link>
          )}
        </div>
      </PageHeading>

      <ErrorBox error={error} retry={() => void mutate()} />

      {showFilter && (
        <Card className="mb-4">
          <div className="table-toolbar">
            <SearchInput value={q} onChange={setQ} placeholder="Buscar por código, cliente, placa o NIT..." />
          </div>
        </Card>
      )}

      {isLoading ? (
        <Loading />
      ) : data && (
        <Card>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Fecha y hora</th>
                  <th>Cliente</th>
                  <th>NIT / CI</th>
                  <th>Placa</th>
                  <th>Total Cobrado</th>
                  <th>Método Pago</th>
                  <th>B-SISA</th>
                  <th>Estado</th>
                  <th>Sucursal</th>
                  <th><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((s: Sale) => {
                  const totalCobrado = Number(s.montoPagado) - Number(s.montoCambio);
                  const isAnulada = s.estado === 'ANULADA';
                  return (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.codigo}</strong>
                      </td>
                      <td>
                        {s.fecha} {s.hora ? s.hora.substring(0, 5) : ''}
                      </td>
                      <td>{s.nombreCliente}</td>
                      <td>{s.nit}</td>
                      <td>
                        {s.placa ? (
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              background: '#f1f5f9',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {s.placa}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <strong>Bs. {totalCobrado.toFixed(2)}</strong>
                      </td>
                      <td>{s.metodoPago}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.78rem',
                            color: s.estadoBSisa ? '#10b981' : '#ef4444',
                            fontWeight: 600,
                          }}
                        >
                          <ShieldCheck size={14} />
                          {s.estadoBSisa ? 'Válido' : 'No reg.'}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: isAnulada ? '#fee2e2' : '#ecfdf5',
                            color: isAnulada ? '#991b1b' : '#065f46',
                          }}
                        >
                          {s.estado || 'EMITIDA'}
                        </span>
                      </td>
                      <td>{s.sucursalNombre || '—'}</td>
                      <td className="menu-cell">
                        <RowMenu label={s.codigo}>
                          <Link to={`/ventas/${s.id}`}>
                            <Info size={14} style={{ marginRight: '6px' }} /> Ver Comprobante
                          </Link>
                          {!isAnulada && allowed(user, 'ventas', 'deshabilitar') && (
                            <button onClick={() => handleAnnul(s)} style={{ color: '#ef4444' }}>
                              <XCircle size={14} style={{ marginRight: '6px' }} /> Anular Venta
                            </button>
                          )}
                        </RowMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!data.items.length && (
            <Empty title="No hay notas de venta" text="Comience registrando un despacho de combustible o venta en tienda." />
          )}

          <Pagination page={page} pageSize={10} total={data.total} onChange={setPage} />
        </Card>
      )}
    </div>
  );
}

// Alias de componente «UI» para trazabilidad UML (CU11: UI.Venta)
export const UIVenta = Sales;
export const VentaUI = Sales;
