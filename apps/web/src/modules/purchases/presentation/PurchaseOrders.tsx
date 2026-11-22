import { CheckCircle2, Download, Filter, Info, PlusCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { allowed, setNotice, useAppDispatch, useSession } from '../../security/auth/application/session';
import { PageResult } from '../../../shared/domain/pagination';
import { Card, PageHeading } from '../../../shared/presentation/layout';
import { Empty, ErrorBox, Loading } from '../../../shared/presentation/feedback';
import { SearchInput } from '../../../shared/presentation/forms';
import { Pagination, RowMenu } from '../../../shared/presentation/table';
import { usePurchasesApi } from '../application/repository-context';
import { PurchaseOrder } from '../domain/models';

export function PurchaseOrders() {
  const api = usePurchasesApi();
  const { user } = useSession();
  const dispatch = useAppDispatch();

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  const { data, error, isLoading, mutate } = useSWR<PageResult<PurchaseOrder>>(
    api.listOrdersKey(q, undefined, page)
  );

  const handleUpdateStatus = async (id: number, nuevoEstado: string) => {
    const actionLabel = nuevoEstado === 'ANULADA' ? 'anular' : 'aprobar';
    if (!window.confirm(`¿Está seguro de que desea ${actionLabel} esta orden de compra?`)) return;
    try {
      await api.updateOrderStatus(id, nuevoEstado);
      await mutate();
      dispatch(setNotice(`Orden de compra actualizada a ${nuevoEstado}.`));
    } catch (err: any) {
      dispatch(setNotice(err?.message || 'Error al actualizar estado'));
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'RECIBIDA':
        return (
          <span
            style={{
              padding: '3px 12px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: '#0f172a',
              color: '#ffffff',
            }}
          >
            finalizado
          </span>
        );
      case 'ANULADA':
        return (
          <span
            style={{
              padding: '3px 12px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: '#ef4444',
              color: '#ffffff',
            }}
          >
            cancelado
          </span>
        );
      case 'PENDIENTE':
      default:
        return (
          <span
            style={{
              padding: '3px 12px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
            }}
          >
            en proceso
          </span>
        );
    }
  };

  const exportCsv = () => {
    if (!data?.items?.length) return;
    const headers = ['Codigo', 'Fecha', 'Motivo', 'Proveedor', 'Sucursal', 'Estado', 'Items'];
    const rows = data.items.map((o: PurchaseOrder) => [
      `"${o.codigo}"`,
      `"${o.fecha}"`,
      `"${o.motivo.replace(/"/g, '""')}"`,
      `"${(o.proveedorNombre || '').replace(/"/g, '""')}"`,
      `"${o.sucursalNombre || ''}"`,
      `"${o.estado}"`,
      o.cantidad,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: (string | number)[]) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `ordenes_compra_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <PageHeading title="Ordenes de Compra" subtitle="Listado de todas las ordenes de compra.">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="button" onClick={() => setShowFilter(!showFilter)}>
            <Filter size={16} /> Filtrar
          </button>
          <button className="button" onClick={exportCsv}>
            <Download size={16} /> Exportar
          </button>
          {allowed(user, 'ordenes', 'crear') && (
            <Link
              to="/compras/ordenes/crear"
              className="button primary"
              style={{ background: '#0f172a', color: '#ffffff', borderRadius: '8px' }}
            >
              <PlusCircle size={16} /> Agregar Orden
            </Link>
          )}
        </div>
      </PageHeading>

      <ErrorBox error={error} retry={() => void mutate()} />

      {showFilter && (
        <Card className="mb-4">
          <div className="table-toolbar">
            <SearchInput value={q} onChange={setQ} placeholder="Buscar por código, motivo, proveedor..." />
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
                  <th>Fecha y hora</th>
                  <th>Motivo</th>
                  <th>Proveedor</th>
                  <th>Sucursal</th>
                  <th>Estado</th>
                  <th>Productos</th>
                  <th><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((o: PurchaseOrder) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.fecha}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{o.codigo}</div>
                    </td>
                    <td>{o.motivo || 'Abastecimiento de stock'}</td>
                    <td>{o.proveedorNombre || '—'}</td>
                    <td>{o.sucursalNombre || '—'}</td>
                    <td>{getStatusBadge(o.estado)}</td>
                    <td>
                      <strong>{o.cantidad}</strong> ítems
                    </td>
                    <td className="menu-cell">
                      <RowMenu label={o.codigo}>
                        <button onClick={() => setSelectedOrder(o)}>
                          <Info size={14} style={{ marginRight: '6px' }} /> Ver Detalle
                        </button>
                        {o.estado === 'PENDIENTE' && allowed(user, 'ordenes', 'editar') && (
                          <button onClick={() => handleUpdateStatus(o.id, 'ANULADA')}>
                            <XCircle size={14} color="#ef4444" style={{ marginRight: '6px' }} /> Cancelar Orden
                          </button>
                        )}
                        {o.estado === 'PENDIENTE' && allowed(user, 'compras', 'crear') && (
                          <Link to={`/compras/crear?ordenId=${o.id}`}>
                            <CheckCircle2 size={14} color="#10b981" style={{ marginRight: '6px' }} /> Recibir Compra
                          </Link>
                        )}
                      </RowMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!data.items.length && (
            <Empty title="No hay órdenes de compra" text="Cree una nueva orden para iniciar el proceso de abastecimiento." />
          )}

          <Pagination page={page} pageSize={10} total={data.total} onChange={setPage} />
        </Card>
      )}

      {/* Modal for viewing order items */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', maxWidth: '600px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Orden {selectedOrder.codigo}</h3>
              {getStatusBadge(selectedOrder.estado)}
            </div>

            <p style={{ margin: '4px 0 16px 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Proveedor: <strong>{selectedOrder.proveedorNombre || 'No especificado'}</strong> · Sucursal:{' '}
              <strong>{selectedOrder.sucursalNombre}</strong>
            </p>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
              <table style={{ width: '100%', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Producto</th>
                    <th style={{ padding: '8px' }}>Código</th>
                    <th style={{ padding: '8px' }}>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.detalles || []).map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px' }}>{d.productoNombre}</td>
                      <td style={{ padding: '8px', color: 'var(--muted)' }}>{d.productoCodigo || '—'}</td>
                      <td style={{ padding: '8px' }}>
                        <strong>{d.cantidad}</strong> {d.productoUnidadMedida || 'u'}
                      </td>
                    </tr>
                  ))}
                  {(!selectedOrder.detalles || !selectedOrder.detalles.length) && (
                    <tr>
                      <td colSpan={3} style={{ padding: '16px', textAlign: 'center', color: 'var(--muted)' }}>
                        Cargando detalle de productos...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="button" onClick={() => setSelectedOrder(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
