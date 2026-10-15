import { Fuel as FuelIcon, Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { useInventoryApi } from '../application/repository-context';
import { Fuel } from '../domain/models';
import { setNotice, useAppDispatch } from '../../security/auth/application/session';
import { Empty, Loading, ErrorBox } from '../../../shared/presentation/index';

export function Fuels() {
  const api = useInventoryApi();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: fuels, error, isLoading, mutate } = useSWR<Fuel[]>(api.listFuelsKey());

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este combustible?')) return;
    try {
      setActionError(null);
      setDeletingId(id);
      await api.deleteFuel(id);
      await mutate();
      dispatch(setNotice('Combustible eliminado exitosamente.'));
    } catch (err) {
      setActionError(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
            Combustibles
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Administre los tipos de combustible y sus especificaciones técnicas de octanaje.
          </p>
        </div>

        <Link
          to="/productos/combustibles/crear"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#0f172a',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          <Plus size={16} />
          <span>Crear Combustible</span>
        </Link>
      </div>

      <ErrorBox error={error || actionError} />

      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '40px' }}><Loading text="Cargando combustibles..." /></div>
        ) : (fuels || []).length === 0 ? (
          <div style={{ padding: '40px' }}>
            <Empty
              title="No hay combustibles registrados"
              text="Agregue un nuevo combustible utilizando el botón superior."
            />
          </div>
        ) : (
          <div className="table-scroll" style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', width: '56px' }}></th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Nombre</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tipo</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Octanaje</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Descripción</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: '12px 16px', width: '100px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(fuels || []).map((f, index) => (
                  <tr
                    key={f.id}
                    style={{
                      borderBottom: index < (fuels?.length || 0) - 1 ? '1px solid #f1f5f9' : 'none',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: '#f0fdf4',
                          border: '1px solid #dcfce7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#16a34a',
                        }}
                      >
                        <FuelIcon size={20} />
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                      {f.nombre}
                    </td>
                    <td style={{ padding: '12px 16px', textTransform: 'capitalize', color: '#475569' }}>
                      {f.tipo}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0284c7' }}>
                      {f.octanaje} oct
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', maxWidth: '250px' }}>
                      {f.descripcion || '-'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: f.estaActivo ? '#f1f5f9' : '#fee2e2',
                          color: f.estaActivo ? '#334155' : '#b91c1c',
                        }}
                      >
                        {f.estaActivo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/productos/combustibles/${f.id}/editar`)}
                          style={{
                            background: 'transparent',
                            border: '1px solid #cbd5e1',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                            color: '#334155',
                          }}
                          aria-label="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(f.id)}
                          disabled={deletingId === f.id}
                          style={{
                            background: 'transparent',
                            border: '1px solid #fecaca',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                            color: '#dc2626',
                          }}
                          aria-label="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
