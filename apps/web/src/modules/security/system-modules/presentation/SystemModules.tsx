import { Boxes, Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { useSystemModulesApi } from '../application/repository-context';
import { SystemModule } from '../domain/models';
import { setNotice, useAppDispatch } from '../../auth/application/session';
import { Empty, Loading, ErrorBox } from '../../../../shared/presentation/index';

export function SystemModules() {
  const api = useSystemModulesApi();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: modules, error, isLoading, mutate } = useSWR<SystemModule[]>(api.listKey());

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este módulo del sistema?')) return;
    try {
      setActionError(null);
      setDeletingId(id);
      await api.delete(id);
      await mutate();
      dispatch(setNotice('Módulo del sistema eliminado exitosamente.'));
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
            Módulos del Sistema
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Control de módulos y componentes del sistema para Administrador Super Usuario (CU20).
          </p>
        </div>

        <Link
          to="/usuarios/modulos/crear"
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
          <span>Agregar Módulo</span>
        </Link>
      </div>

      <ErrorBox error={error || actionError} />

      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '40px' }}><Loading text="Cargando módulos..." /></div>
        ) : (modules || []).length === 0 ? (
          <div style={{ padding: '40px' }}>
            <Empty title="No hay módulos registrados" text="Agregue un nuevo componente utilizando el botón superior." />
          </div>
        ) : (
          <div className="table-scroll" style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', width: '56px' }}></th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Código</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Nombre</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Descripción</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: '12px 16px', width: '100px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(modules || []).map((m, index) => (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: index < (modules?.length || 0) - 1 ? '1px solid #f1f5f9' : 'none',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: '#f5f3ff',
                          border: '1px solid #ede9fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#7c3aed',
                        }}
                      >
                        <Boxes size={20} />
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                      <code>{m.codigo}</code>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>
                      {m.nombre}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {m.descripcion || '-'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: m.activo ? '#f1f5f9' : '#fee2e2',
                          color: m.activo ? '#334155' : '#b91c1c',
                        }}
                      >
                        {m.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/usuarios/modulos/${m.id}/editar`)}
                          style={{
                            background: 'transparent',
                            border: '1px solid #cbd5e1',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                            color: '#334155',
                          }}
                          aria-label="Editar módulo"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(m.id)}
                          disabled={deletingId === m.id}
                          style={{
                            background: 'transparent',
                            border: '1px solid #fecaca',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                            color: '#dc2626',
                          }}
                          aria-label="Eliminar módulo"
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
