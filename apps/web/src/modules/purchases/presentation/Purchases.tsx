import { Download, Filter, Info, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { allowed, useSession } from '../../security/auth/application/session';
import { PageResult } from '../../../shared/domain/pagination';
import { Card, PageHeading } from '../../../shared/presentation/layout';
import { Empty, ErrorBox, Loading } from '../../../shared/presentation/feedback';
import { SearchInput } from '../../../shared/presentation/forms';
import { Pagination, RowMenu } from '../../../shared/presentation/table';
import { usePurchasesApi } from '../application/repository-context';
import { PurchaseReceipt } from '../domain/models';

export function Purchases() {
  const api = usePurchasesApi();
  const { user } = useSession();

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<PageResult<PurchaseReceipt>>(
    api.listPurchasesKey(q, undefined, page)
  );

  const exportCsv = () => {
    if (!data?.items?.length) return;
    const headers = ['Codigo', 'Fecha', 'Hora', 'Sucursal', 'TotalBs', 'Proveedor', 'Usuario'];
    const rows = data.items.map((p: PurchaseReceipt) => [
      `"${p.codigo}"`,
      `"${p.fecha}"`,
      `"${p.hora}"`,
      `"${p.sucursalNombre || ''}"`,
      p.montoTotal,
      `"${(p.proveedorNombre || '').replace(/"/g, '""')}"`,
      `"${p.usuarioNombre || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: (string | number)[]) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `compras_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <PageHeading title="Compras" subtitle="Listado de todas las compras realizadas por la empresa.">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="button" onClick={() => setShowFilter(!showFilter)}>
            <Filter size={16} /> Filtrar
          </button>
          <button className="button" onClick={exportCsv}>
            <Download size={16} /> Exportar
          </button>
          {allowed(user, 'compras', 'crear') && (
            <Link
              to="/compras/crear"
              className="button primary"
              style={{ background: '#0f172a', color: '#ffffff', borderRadius: '8px' }}
            >
              <PlusCircle size={16} /> Agregar compra
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
                  <th>Código</th>
                  <th>Fecha y hora</th>
                  <th>Sucursal</th>
                  <th>Total</th>
                  <th>Productos</th>
                  <th>Proveedor</th>
                  <th><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p: PurchaseReceipt) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.codigo}</strong>
                    </td>
                    <td>
                      {p.fecha} {p.hora ? p.hora.substring(0, 5) : ''}
                    </td>
                    <td>{p.sucursalNombre || '—'}</td>
                    <td>
                      <strong>Bs. {Number(p.montoTotal).toFixed(2)}</strong>
                    </td>
                    <td>{p.detalles?.length || 1}</td>
                    <td>{p.proveedorNombre || '—'}</td>
                    <td className="menu-cell">
                      <RowMenu label={p.codigo}>
                        <Link to={`/compras/${p.id}`}>
                          <Info size={14} style={{ marginRight: '6px' }} /> Ver Detalle
                        </Link>
                      </RowMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!data.items.length && (
            <Empty title="No hay compras registradas" text="Registre una nueva recepción de compra o utilice los filtros." />
          )}

          <Pagination page={page} pageSize={10} total={data.total} onChange={setPage} />
        </Card>
      )}
    </div>
  );
}
