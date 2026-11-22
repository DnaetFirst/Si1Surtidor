import { Download, Filter, Info, Pencil, PlusCircle, Power } from 'lucide-react';
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
import { Provider } from '../domain/models';

export function Providers() {
  const api = usePurchasesApi();
  const { user } = useSession();
  const dispatch = useAppDispatch();

  const [q, setQ] = useState('');
  const [active, setActive] = useState('all');
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<PageResult<Provider>>(
    api.listProvidersKey(q, active, page)
  );

  const handleToggleStatus = async (p: Provider) => {
    try {
      await api.toggleProviderStatus(p.id);
      await mutate();
      dispatch(setNotice(`Proveedor "${p.nombre}" ${p.activo ? 'desactivado' : 'activado'} exitosamente.`));
    } catch (err: any) {
      dispatch(setNotice(err?.message || 'Error al cambiar estado del proveedor'));
    }
  };

  const exportCsv = () => {
    if (!data?.items?.length) return;
    const headers = ['Nombre', 'Correo', 'Telefono', 'NIT', 'Direccion', 'Estado'];
    const rows = data.items.map((p: Provider) => [
      `"${p.nombre.replace(/"/g, '""')}"`,
      `"${p.correo || ''}"`,
      `"${p.telefono || ''}"`,
      `"${p.nit}"`,
      `"${(p.direccion || '').replace(/"/g, '""')}"`,
      p.activo ? 'Activo' : 'Inactivo',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: (string | number)[]) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `proveedores_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <PageHeading title="Proveedores" subtitle="Listado de todos los proveedores de la empresa.">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="button" onClick={() => setShowFilter(!showFilter)}>
            <Filter size={16} /> Filtrar
          </button>
          <button className="button" onClick={exportCsv}>
            <Download size={16} /> Exportar
          </button>
          {allowed(user, 'proveedores', 'crear') && (
            <Link
              to="/compras/proveedores/crear"
              className="button primary"
              style={{ background: '#0f172a', color: '#ffffff', borderRadius: '8px' }}
            >
              <PlusCircle size={16} /> Agregar Proveedor
            </Link>
          )}
        </div>
      </PageHeading>

      <ErrorBox error={error} retry={() => void mutate()} />

      {showFilter && (
        <Card className="mb-4">
          <div className="table-toolbar" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <SearchInput value={q} onChange={setQ} placeholder="Buscar por nombre, NIT, contacto..." />
            <label className="select-filter">
              <span>Estado</span>
              <select value={active} onChange={e => { setActive(e.target.value); setPage(1); }}>
                <option value="all">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </label>
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
                  <th>Correo electrónico</th>
                  <th>Teléfono</th>
                  <th>NIT</th>
                  <th>Estado</th>
                  <th><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p: Provider) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.nombre}</strong>
                      {p.razonSocial && <div style={{ fontSize: '0.85em', color: 'var(--muted)' }}>{p.razonSocial}</div>}
                    </td>
                    <td>{p.correo || '—'}</td>
                    <td>{p.telefono || '—'}</td>
                    <td>{p.nit}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          backgroundColor: p.activo ? '#0f172a' : '#f1f5f9',
                          color: p.activo ? '#ffffff' : '#64748b',
                          border: p.activo ? 'none' : '1px solid #cbd5e1',
                        }}
                      >
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="menu-cell">
                      <RowMenu label={p.nombre}>
                        <Link to={`/compras/proveedores/${p.id}`}>
                          <Info size={14} style={{ marginRight: '6px' }} /> Detalles
                        </Link>
                        {allowed(user, 'proveedores', 'editar') && (
                          <Link to={`/compras/proveedores/${p.id}/editar`}>
                            <Pencil size={14} style={{ marginRight: '6px' }} /> Editar
                          </Link>
                        )}
                        {allowed(user, 'proveedores', 'deshabilitar') && (
                          <button onClick={() => handleToggleStatus(p)}>
                            <Power size={14} style={{ marginRight: '6px' }} />
                            {p.activo ? 'Desactivar' : 'Activar'}
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
            <Empty title="No hay proveedores" text="No se encontraron proveedores registrados con los filtros aplicados." />
          )}

          <Pagination page={page} pageSize={10} total={data.total} onChange={setPage} />
        </Card>
      )}
    </div>
  );
}
