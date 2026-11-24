import { Download, Filter, Pencil, PlusCircle, Trash2 } from 'lucide-react';
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
import { Dispenser } from '../domain/models';

export function Dispensers() {
  const api = useSalesApi();
  const { user } = useSession();
  const dispatch = useAppDispatch();

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<PageResult<Dispenser>>(
    api.listDispensersKey(q, undefined, page)
  );

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este dispensador?')) return;
    try {
      await api.deleteDispenser(id);
      await mutate();
      dispatch(setNotice('Dispensador eliminado exitosamente.'));
    } catch (err: any) {
      dispatch(setNotice(err?.message || 'Error al eliminar dispensador'));
    }
  };

  const exportCsv = () => {
    if (!data?.items?.length) return;
    const headers = ['ID', 'Ubicacion', 'CapacidadMaxima', 'Sucursal', 'Estado', 'Mangueras'];
    const rows = data.items.map((d: Dispenser) => [
      d.id,
      `"${d.ubicacion.replace(/"/g, '""')}"`,
      d.capacidadMaxima,
      `"${d.sucursalNombre || ''}"`,
      d.estaActivo ? 'Activo' : 'Inactivo',
      d.mangueras?.length || 0,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: (string | number)[]) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `dispensadores_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <PageHeading title="Dispensadores" subtitle="Listado de los dispensadores asociados">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="button" onClick={() => setShowFilter(!showFilter)}>
            <Filter size={16} /> Filtrar
          </button>
          <button className="button" onClick={exportCsv}>
            <Download size={16} /> Exportar
          </button>
          {allowed(user, 'dispensadores', 'crear') && (
            <Link
              to="/ventas/dispensadores/crear"
              className="button primary"
              style={{ background: '#0f172a', color: '#ffffff', borderRadius: '8px' }}
            >
              <PlusCircle size={16} /> Agregar Dispensador
            </Link>
          )}
        </div>
      </PageHeading>

      <ErrorBox error={error} retry={() => void mutate()} />

      {showFilter && (
        <Card className="mb-4">
          <div className="table-toolbar">
            <SearchInput value={q} onChange={setQ} placeholder="Buscar por ubicación o sucursal..." />
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
                  <th>Max. Capacidad</th>
                  <th>Ubicación</th>
                  <th>Sucursal</th>
                  <th>Estado</th>
                  <th><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((d: Dispenser) => (
                  <tr key={d.id}>
                    <td>
                      {d.createdAt ? new Date(d.createdAt).toISOString() : '2024-06-01T16:52:37.366Z'}
                    </td>
                    <td>{Number(d.capacidadMaxima).toFixed(2)}</td>
                    <td>
                      <strong>{d.ubicacion}</strong>
                      {d.mangueras && d.mangueras.length > 0 && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                          {d.mangueras.length} manguera(s) conectada(s)
                        </div>
                      )}
                    </td>
                    <td>{d.sucursalNombre || '—'}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 12px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          backgroundColor: d.estaActivo ? '#0f172a' : '#f1f5f9',
                          color: d.estaActivo ? '#ffffff' : '#64748b',
                        }}
                      >
                        {d.estaActivo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="menu-cell">
                      <RowMenu label={d.ubicacion}>
                        {allowed(user, 'dispensadores', 'editar') && (
                          <Link to={`/ventas/dispensadores/${d.id}/editar`}>
                            <Pencil size={14} style={{ marginRight: '6px' }} /> Editar
                          </Link>
                        )}
                        {allowed(user, 'dispensadores', 'deshabilitar') && (
                          <button onClick={() => handleDelete(d.id)} style={{ color: '#ef4444' }}>
                            <Trash2 size={14} style={{ marginRight: '6px' }} /> Delete
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
            <Empty title="No hay dispensadores" text="Registre los dispensadores de combustible de la estación de servicio." />
          )}

          <Pagination page={page} pageSize={10} total={data.total} onChange={setPage} />
        </Card>
      )}
    </div>
  );
}

// Alias de componente «UI» para trazabilidad UML (CU7: UI.Dispensador)
export const UIDispensador = Dispensers;
export const DispensadorUI = Dispensers;
