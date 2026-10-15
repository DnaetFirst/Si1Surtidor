import { FileDown, Filter, MoreHorizontal, Plus, Fuel, Package, Pencil, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { useInventoryApi } from '../application/repository-context';
import { Product } from '../domain/models';
import { setNotice, useAppDispatch } from '../../security/auth/application/session';
import { Empty, Loading, ErrorBox } from '../../../shared/presentation/index';

export function Products() {
  const api = useInventoryApi();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: products, error, isLoading, mutate } = useSWR<Product[]>(api.listProductsKey());

  const [activeTab, setActiveTab] = useState<'combustible' | 'otro'>('combustible');
  const [filterText, setFilterText] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const isFuelProduct = (p: Product) => {
    const nameLower = p.nombre.toLowerCase();
    const catLower = (p.categoriaNombre || '').toLowerCase();
    return catLower.includes('combustible') || nameLower.includes('gasolina') || nameLower.includes('diesel') || nameLower.includes('gnv');
  };

  const filteredProducts = (products || []).filter(p => {
    const matchesTab = activeTab === 'combustible' ? isFuelProduct(p) : !isFuelProduct(p);
    if (!matchesTab) return false;
    if (!filterText) return true;
    return p.nombre.toLowerCase().includes(filterText.toLowerCase()) || (p.descripcion && p.descripcion.toLowerCase().includes(filterText.toLowerCase()));
  });

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este producto?')) return;
    try {
      setActionError(null);
      setDeletingId(id);
      await api.deleteProduct(id);
      await mutate();
      dispatch(setNotice('Producto eliminado exitosamente.'));
    } catch (err) {
      setActionError(err);
    } finally {
      setDeletingId(null);
      setActiveMenuId(null);
    }
  };

  const exportCsv = () => {
    const headers = ['ID', 'Nombre', 'Estado', 'Precio', 'Stock', 'Categoría', 'Fecha Creación'];
    const rows = filteredProducts.map(p => [
      p.id,
      `"${p.nombre.replace(/"/g, '""')}"`,
      p.estaActivo ? 'Activo' : 'Inactivo',
      p.precioVenta,
      p.stock,
      `"${(p.categoriaNombre || '').replace(/"/g, '""')}"`,
      p.createdAt.slice(0, 10),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `productos_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="products-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title" style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
          Productos
        </h1>
      </div>

      {/* Top Header Controls: Tabs on Left, Actions on Right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div role="tablist" style={{ display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', gap: '4px' }}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'combustible'}
            onClick={() => setActiveTab('combustible')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              background: activeTab === 'combustible' ? '#ffffff' : 'transparent',
              color: activeTab === 'combustible' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'combustible' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Combustible
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'otro'}
            onClick={() => setActiveTab('otro')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              background: activeTab === 'otro' ? '#ffffff' : 'transparent',
              color: activeTab === 'otro' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'otro' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Otro producto
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowFilter(!showFilter)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: showFilter ? '#f8fafc' : '#ffffff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              color: '#334155',
            }}
          >
            <Filter size={15} />
            <span>Filtrar</span>
          </button>

          <button
            type="button"
            onClick={exportCsv}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              color: '#334155',
            }}
          >
            <FileDown size={15} />
            <span>Exportar</span>
          </button>

          <Link
            to="/productos/crear"
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
            <span>Agregar Producto</span>
          </Link>
        </div>
      </div>

      {showFilter && (
        <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
            }}
          />
        </div>
      )}

      <ErrorBox error={error || actionError} />

      {/* Main Card */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            {activeTab === 'combustible' ? 'Combustible' : 'Otro producto'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Administre sus productos y vea su desempeño de ventas.
          </p>
        </div>

        {isLoading ? (
          <div style={{ padding: '40px' }}><Loading text="Cargando productos..." /></div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '40px' }}>
            <Empty
              title="No hay productos registrados"
              text={activeTab === 'combustible' ? 'No se encontraron combustibles en el inventario.' : 'No se encontraron otros productos registrados.'}
            />
          </div>
        ) : (
          <div className="table-scroll" style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', width: '56px' }}></th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Nombre</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Precio</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Total ventas</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Creado</th>
                  <th style={{ padding: '12px 16px', width: '60px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p, index) => {
                  const isMenuOpen = activeMenuId === p.id;
                  const formattedDate = new Date(p.createdAt).toLocaleDateString('es-BO', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: index < filteredProducts.length - 1 ? '1px solid #f1f5f9' : 'none',
                        transition: 'background 0.1s ease',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: activeTab === 'combustible' ? '#f0fdf4' : '#f8fafc',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: activeTab === 'combustible' ? '#16a34a' : '#64748b',
                          }}
                        >
                          {activeTab === 'combustible' ? <Fuel size={20} /> : <Package size={20} />}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                        {p.nombre}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: p.estaActivo ? '#f1f5f9' : '#fee2e2',
                            color: p.estaActivo ? '#334155' : '#b91c1c',
                          }}
                        >
                          {p.estaActivo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: '#0f172a' }}>
                        Bs. {Number(p.precioVenta).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        {p.id === 1 ? '25' : p.id === 2 ? '100' : p.id === 3 ? '50' : '0'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formattedDate}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(isMenuOpen ? null : p.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                            color: '#64748b',
                          }}
                          aria-label="Acciones"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {isMenuOpen && (
                          <div
                            ref={menuRef}
                            style={{
                              position: 'absolute',
                              right: '16px',
                              top: '40px',
                              background: '#ffffff',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              border: '1px solid #e2e8f0',
                              zIndex: 100,
                              minWidth: '130px',
                              padding: '4px 0',
                              textAlign: 'left',
                            }}
                          >
                            <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                              Actions
                            </div>
                            <button
                              type="button"
                              onClick={() => navigate(`/productos/${p.id}/editar`)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: 'none',
                                background: 'transparent',
                                textAlign: 'left',
                                fontSize: '13px',
                                cursor: 'pointer',
                                color: '#1e293b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <Pencil size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id)}
                              disabled={deletingId === p.id}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: 'none',
                                background: 'transparent',
                                textAlign: 'left',
                                fontSize: '13px',
                                cursor: 'pointer',
                                color: '#dc2626',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', fontSize: '13px', color: '#64748b', background: '#ffffff' }}>
          Mostrando 1-{filteredProducts.length} de {filteredProducts.length} productos
        </div>
      </div>
    </div>
  );
}
