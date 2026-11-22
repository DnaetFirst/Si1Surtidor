import { Download, Filter, Pencil, PlusCircle, Power, Trash2 } from 'lucide-react';
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
import { Discount } from '../domain/models';

export function Discounts() {
  const api = useSalesApi();
  const { user } = useSession();
  const dispatch = useAppDispatch();

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<PageResult<Discount>>(
    api.listDiscountsKey(q, undefined, page)
  );

  const handleToggleStatus = async (d: Discount) => {
    try {
      await api.toggleDiscountStatus(d.id);
      await mutate();
      dispatch(setNotice(`Descuento "${d.nombre}" ${d.activo ? 'desactivado' : 'activado'}.`));
    } catch (err: any) {
      dispatch(setNotice(err?.message || 'Error al cambiar estado'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este descuento?')) return;
    try {
      await api.deleteDiscount(id);
      await mutate();
      dispatch(setNotice('Descuento eliminado exitosamente.'));
    } catch (err: any) {
      dispatch(setNotice(err?.message || 'Error al eliminar descuento'));
    }
  };

  const exportCsv = () => {
    if (!data?.items?.length) return;
    const headers = ['Nombre', 'Tipo', 'Valor', 'Sucursal', 'Estado', 'Descripcion'];
    const rows = data.items.map((d: Discount) => [
      `"${d.nombre.replace(/"/g, '""')}"`,
      d.tipo,
      d.valor,
      `"${d.sucursalNombre || 'Todas'}"`,
      d.activo ? 'Activo' : 'Inactivo',
      `"${d.descripcion.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: (string | number)[]) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `descuentos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <PageHeading title="Descuentos" subtitle="Listado de descuentos y promociones aplicables en ventas.">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="button" onClick={() => setShowFilter(!showFilter)}>
            <Filter size={16} /> Filtrar
          </button>
          <button className="button" onClick={exportCsv}>
            <Download size={16} /> Exportar
          </button>
          {allowed(user, 'descuentos', 'crear') && (
            <Link
              to="/ventas/descuentos/crear"
              className="button primary"
              style={{ background: '#0f172a', color: '#ffffff', borderRadius: '8px' }}
            >
              <PlusCircle size={16} /> Agregar Descuento
            </Link>
          )}
        </div>
      </PageHeading>

      <ErrorBox error={error} retry={() => void mutate()} />

      {showFilter && (
        <Card className="mb-4">
          <div className="table-toolbar">
            <SearchInput value={q} onChange={setQ} placeholder="Buscar por nombre o descripción..." />
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
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Valor Aplicable</th>
                  <th>Sucursal</th>
                  <th>Estado</th>
                  <th><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((d: Discount) => (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.nombre}</strong>
                      {d.descripcion && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{d.descripcion}</div>
                      )}
                    </td>
                    <td>{d.tipo === 'PORCENTAJE' ? 'Porcentual' : 'Monto Fijo'}</td>
                    <td>
                      <strong>
                        {d.tipo === 'PORCENTAJE' ? `${d.valor}%` : `Bs. ${Number(d.valor).toFixed(2)}`}
                      </strong>
                    </td>
                    <td>{d.sucursalNombre || 'Todas las sucursales'}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 12px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          backgroundColor: d.activo ? '#0f172a' : '#f1f5f9',
                          color: d.activo ? '#ffffff' : '#64748b',
                        }}
                      >
                        {d.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="menu-cell">
                      <RowMenu label={d.nombre}>
                        {allowed(user, 'descuentos', 'editar') && (
                          <Link to={`/ventas/descuentos/${d.id}/editar`}>
                            <Pencil size={14} style={{ marginRight: '6px' }} /> Editar
                          </Link>
                        )}
                        {allowed(user, 'descuentos', 'editar') && (
                          <button onClick={() => handleToggleStatus(d)}>
                            <Power size={14} style={{ marginRight: '6px' }} />
                            {d.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                        {allowed(user, 'descuentos', 'eliminar') && (
                          <button onClick={() => handleDelete(d.id)} style={{ color: '#ef4444' }}>
                            <Trash2 size={14} style={{ marginRight: '6px' }} /> Eliminar
                          </button>
                        )}
                      </RowMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!data.items.length && (
            <Empty title="No hay descuentos configurados" text="Registre descuentos para fidelización o promociones de combustible y tienda." />
          )}

          <Pagination page={page} pageSize={10} total={data.total} onChange={setPage} />
        </Card>
      )}
    </div>
  );
}
