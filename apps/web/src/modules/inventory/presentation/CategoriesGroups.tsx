import { FolderTree, Layers, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { useInventoryApi } from '../application/repository-context';
import { Category, Group } from '../domain/models';
import { setNotice, useAppDispatch } from '../../security/auth/application/session';
import { Empty, Loading, ErrorBox } from '../../../shared/presentation/index';

export function CategoriesGroups() {
  const api = useInventoryApi();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'categorias' | 'grupos'>('categorias');

  const { data: categories, error: errorCat, isLoading: loadingCat, mutate: mutateCat } = useSWR<Category[]>(api.listCategoriesKey());
  const { data: groups, error: errorGrp, isLoading: loadingGrp, mutate: mutateGrp } = useSWR<Group[]>(api.listGroupsKey());

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta categoría?')) return;
    try {
      setActionError(null);
      setDeletingId(id);
      await api.deleteCategory(id);
      await mutateCat();
      dispatch(setNotice('Categoría eliminada exitosamente.'));
    } catch (err) {
      setActionError(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este grupo?')) return;
    try {
      setActionError(null);
      setDeletingId(id);
      await api.deleteGroup(id);
      await mutateGrp();
      dispatch(setNotice('Grupo eliminado exitosamente.'));
    } catch (err) {
      setActionError(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header: Tabs and Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', gap: '4px' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('categorias'); setActionError(null); }}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              background: activeTab === 'categorias' ? '#ffffff' : 'transparent',
              color: activeTab === 'categorias' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'categorias' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Categorías
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('grupos'); setActionError(null); }}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              background: activeTab === 'grupos' ? '#ffffff' : 'transparent',
              color: activeTab === 'grupos' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'grupos' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Grupos
          </button>
        </div>

        <Link
          to="/productos/categorias-grupos/crear"
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
          <span>{activeTab === 'categorias' ? 'Crear Categoría' : 'Crear Grupo'}</span>
        </Link>
      </div>

      <ErrorBox error={errorCat || errorGrp || actionError} />

      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {activeTab === 'categorias' ? (
          loadingCat ? (
            <div style={{ padding: '40px' }}><Loading text="Cargando categorías..." /></div>
          ) : (categories || []).length === 0 ? (
            <div style={{ padding: '40px' }}><Empty title="No hay categorías registradas" text="Cree una categoría con el botón superior." /></div>
          ) : (
            <div className="table-scroll" style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', width: '56px' }}></th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Nombre</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Descripción</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Estado</th>
                    <th style={{ padding: '12px 16px', width: '80px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(categories || []).map((cat, index) => (
                    <tr
                      key={cat.id}
                      style={{
                        borderBottom: index < (categories?.length || 0) - 1 ? '1px solid #f1f5f9' : 'none',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: '#eff6ff',
                            border: '1px solid #dbeafe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#2563eb',
                          }}
                        >
                          <FolderTree size={20} />
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                        {cat.nombre}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>
                        {cat.descripcion || '-'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: cat.activo ? '#f1f5f9' : '#fee2e2',
                            color: cat.activo ? '#334155' : '#b91c1c',
                          }}
                        >
                          {cat.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          disabled={deletingId === cat.id}
                          style={{
                            background: 'transparent',
                            border: '1px solid #fecaca',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                            color: '#dc2626',
                          }}
                          aria-label="Eliminar categoría"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          loadingGrp ? (
            <div style={{ padding: '40px' }}><Loading text="Cargando grupos..." /></div>
          ) : (groups || []).length === 0 ? (
            <div style={{ padding: '40px' }}><Empty title="No hay grupos registrados" text="Cree un grupo con el botón superior." /></div>
          ) : (
            <div className="table-scroll" style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', width: '56px' }}></th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Nombre</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Descripción</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Estado</th>
                    <th style={{ padding: '12px 16px', width: '80px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(groups || []).map((grp, index) => (
                    <tr
                      key={grp.id}
                      style={{
                        borderBottom: index < (groups?.length || 0) - 1 ? '1px solid #f1f5f9' : 'none',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: '#fef3c7',
                            border: '1px solid #fde68a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#d97706',
                          }}
                        >
                          <Layers size={20} />
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                        {grp.nombre}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>
                        {grp.descripcion || '-'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: grp.activo ? '#f1f5f9' : '#fee2e2',
                            color: grp.activo ? '#334155' : '#b91c1c',
                          }}
                        >
                          {grp.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(grp.id)}
                          disabled={deletingId === grp.id}
                          style={{
                            background: 'transparent',
                            border: '1px solid #fecaca',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                            color: '#dc2626',
                          }}
                          aria-label="Eliminar grupo"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
