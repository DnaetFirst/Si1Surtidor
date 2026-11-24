import { Download, Filter, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { allowed, useSession } from '../../security/auth/application/session';
import { PageResult } from '../../../shared/domain/pagination';
import { Card, PageHeading } from '../../../shared/presentation/layout';
import { Empty, ErrorBox, Loading } from '../../../shared/presentation/feedback';
import { SearchInput } from '../../../shared/presentation/forms';
import { Pagination } from '../../../shared/presentation/table';
import { useInventoryApi } from '../application/repository-context';
import { ProductExit } from '../domain/models';

export function ProductExits() {
  const api = useInventoryApi();
  const { user } = useSession();

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<PageResult<ProductExit>>(
    api.listExitsKey(q, undefined, page)
  );

  const exportCsv = () => {
    if (!data?.items?.length) return;
    const headers = ['Fecha', 'Producto', 'Cantidad', 'Lote', 'Motivo', 'Sucursal'];
    const rows = data.items.map((e: ProductExit) => [
      `"${e.fecha}"`,
      `"${e.productoNombre || ''}"`,
      e.cantidad,
      `"${e.loteCodigo || ''}"`,
      `"${e.motivo.replace(/"/g, '""')}"`,
      `"${e.sucursalNombre || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: (string | number)[]) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `salidas_productos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <PageHeading title="Salida de Productos" subtitle="Registro de mermas, vencimientos y bajas de inventario.">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="button" onClick={() => setShowFilter(!showFilter)}>
            <Filter size={16} /> Filtrar
          </button>
          <button className="button" onClick={exportCsv}>
            <Download size={16} /> Exportar
          </button>
          {allowed(user, 'salidas', 'crear') && (
            <Link
              to="/inventario/salidas/crear"
              className="button primary"
              style={{ background: '#0f172a', color: '#ffffff', borderRadius: '8px' }}
            >
              <PlusCircle size={16} /> Registrar Salida
            </Link>
          )}
        </div>
      </PageHeading>

      <ErrorBox error={error} retry={() => void mutate()} />

      {showFilter && (
        <Card className="mb-4">
          <div className="table-toolbar">
            <SearchInput value={q} onChange={setQ} placeholder="Buscar por motivo o producto..." />
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
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Lote</th>
                  <th>Sucursal</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((e: ProductExit) => (
                  <tr key={e.id}>
                    <td>
                      {typeof e.fecha === 'string'
                        ? e.fecha.substring(0, 10)
                        : new Date(e.fecha).toISOString().substring(0, 10)}
                    </td>
                    <td>
                      <strong>{e.productoNombre || 'Producto'}</strong>
                      {e.productoCodigo && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{e.productoCodigo}</div>
                      )}
                    </td>
                    <td>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>-{e.cantidad}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                        {e.loteCodigo || 'General'}
                      </span>
                    </td>
                    <td>{e.sucursalNombre || '—'}</td>
                    <td>{e.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!data.items.length && (
            <Empty title="No hay salidas registradas" text="Registre una baja de inventario por merma, vencimiento o uso interno." />
          )}

          <Pagination page={page} pageSize={10} total={data.total} onChange={setPage} />
        </Card>
      )}
    </div>
  );
}

// Alias de componente «UI» para trazabilidad UML (CU19: UI.Salidas / UISalida)
export const UISalida = ProductExits;
export const UISalidas = ProductExits;
