import { ArrowLeft, MoreVertical, Package, PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { allowed, setNotice, useAppDispatch, useSession } from '../../security/auth/application/session';
import { Card } from '../../../shared/presentation/layout';
import { Empty, ErrorBox, Loading } from '../../../shared/presentation/feedback';
import { Field, SearchInput } from '../../../shared/presentation/forms';
import { useInventoryApi } from '../../inventory/application/repository-context';
import { Product } from '../../inventory/domain/models';
import { usePurchasesApi } from '../application/repository-context';
import { Provider, ProviderProduct } from '../domain/models';

export function ProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const providerId = Number(id);
  const api = usePurchasesApi();
  const inventoryApi = useInventoryApi();
  const { user } = useSession();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<'productos' | 'compras'>('productos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [agreedPrice, setAgreedPrice] = useState<number | ''>('');
  const [detailText, setDetailText] = useState('');
  const [linking, setLinking] = useState(false);
  const [filterText, setFilterText] = useState('');

  const { data: provider, error: providerError, isLoading: providerLoading } = useSWR<Provider>(
    `/proveedores/${providerId}`,
    () => api.getProvider(providerId)
  );

  const {
    data: products,
    isLoading: productsLoading,
    mutate: mutateProducts,
  } = useSWR<ProviderProduct[]>(
    `/proveedores/${providerId}/productos`,
    () => api.getProviderProducts(providerId)
  );

  const { data: allProducts } = useSWR<Product[]>(inventoryApi.listProductsKey());

  if (providerLoading) return <Loading />;
  if (providerError || !provider) return <ErrorBox error={providerError || new Error('Proveedor no encontrado')} />;

  const handleLinkProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !agreedPrice) return;
    setLinking(true);
    try {
      await api.linkProviderProduct(providerId, {
        idProducto: Number(selectedProductId),
        ultimoPrecio: Number(agreedPrice),
        detalle: detailText,
      });
      await mutateProducts();
      setShowAddModal(false);
      setSelectedProductId('');
      setAgreedPrice('');
      setDetailText('');
      dispatch(setNotice('Producto asociado exitosamente al proveedor.'));
    } catch (err: any) {
      dispatch(setNotice(err?.message || 'Error al asociar producto'));
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (productId: number) => {
    if (!window.confirm('¿Desea desvincular este producto del proveedor?')) return;
    try {
      await api.unlinkProviderProduct(providerId, productId);
      await mutateProducts();
      dispatch(setNotice('Producto desvinculado del proveedor.'));
    } catch (err: any) {
      dispatch(setNotice(err?.message || 'Error al desvincular producto'));
    }
  };

  const filteredProducts = (products || []).filter(p => {
    if (!filterText) return true;
    return (
      (p.productoNombre || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (p.productoCodigo || '').toLowerCase().includes(filterText.toLowerCase())
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/compras/proveedores" className="button icon-button">
            <ArrowLeft size={16} />
          </Link>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>
            Detalles de {provider.nombre}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('productos')}
              style={{
                border: 'none',
                background: activeTab === 'productos' ? '#ffffff' : 'transparent',
                fontWeight: activeTab === 'productos' ? 600 : 400,
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: activeTab === 'productos' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Productos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('compras')}
              style={{
                border: 'none',
                background: activeTab === 'compras' ? '#ffffff' : 'transparent',
                fontWeight: activeTab === 'compras' ? 600 : 400,
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: activeTab === 'compras' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Compras
            </button>
          </div>
          <Link to={`/compras/proveedores/${provider.id}/editar`} className="button icon-button">
            <MoreVertical size={16} />
          </Link>
        </div>
      </div>

      <div className="responsive-split-sidebar">
        {/* Left Column: Provider Info Card */}
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', margin: '0 0 4px 0' }}>{provider.nombre}</h2>
            <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
              {provider.razonSocial || 'proveedor de productos'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.78rem' }}>NIT</span>
              <strong>{provider.nit}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.78rem' }}>Teléfono</span>
              <span>{provider.telefono || '—'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.78rem' }}>Correo</span>
              <span>{provider.correo || '—'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.78rem' }}>Contacto</span>
              <span>{provider.contacto || '—'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.78rem' }}>Estado</span>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  backgroundColor: provider.activo ? '#0f172a' : '#f1f5f9',
                  color: provider.activo ? '#ffffff' : '#64748b',
                }}
              >
                {provider.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.78rem' }}>Dirección</span>
              <span>{provider.direccion || '—'}</span>
            </div>
            {provider.detalle && (
              <div>
                <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.78rem' }}>Detalle</span>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>{provider.detalle}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Right Column: Tab Content */}
        <div>
          {activeTab === 'productos' ? (
            <Card>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Productos del proveedor</h3>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <SearchInput value={filterText} onChange={setFilterText} placeholder="Buscar producto..." />
                  {allowed(user, 'proveedores', 'editar') && (
                    <button
                      className="button primary"
                      style={{ background: '#0f172a', color: '#ffffff', borderRadius: '8px' }}
                      onClick={() => setShowAddModal(true)}
                    >
                      <PlusCircle size={15} /> Agregar
                    </button>
                  )}
                </div>
              </div>

              {productsLoading ? (
                <Loading />
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Imagen</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Stock Min.</th>
                        <th>Stock</th>
                        <th>Precio de compra</th>
                        <th>Estado</th>
                        <th><span className="sr-only">Acciones</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(item => (
                        <tr key={item.id}>
                          <td>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '6px',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Package size={18} color="#64748b" />
                            </div>
                          </td>
                          <td>
                            <strong>{item.productoNombre}</strong>
                            {item.productoCodigo && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{item.productoCodigo}</div>
                            )}
                          </td>
                          <td>{item.productoDescripcion || item.detalle || '—'}</td>
                          <td>{item.productoStockMinimo ?? 0}</td>
                          <td>{item.productoStock ?? 0}</td>
                          <td>
                            <strong>Bs. {Number(item.ultimoPrecio).toFixed(2)}</strong>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                backgroundColor: item.activo ? '#0f172a' : '#f1f5f9',
                                color: item.activo ? '#ffffff' : '#64748b',
                              }}
                            >
                              {item.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="menu-cell">
                            {allowed(user, 'proveedores', 'editar') && (
                              <button
                                className="button icon-button"
                                title="Desvincular producto"
                                onClick={() => handleUnlink(item.idProducto)}
                              >
                                <Trash2 size={15} color="#ef4444" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!filteredProducts.length && (
                    <Empty
                      title="Sin productos vinculados"
                      text="Haga clic en «Agregar» para asociar los productos que suministra este proveedor."
                    />
                  )}
                </div>
              )}
              <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                Mostrando 1-{filteredProducts.length} de {filteredProducts.length} productos
              </div>
            </Card>
          ) : (
            <Card title="Historial de Compras">
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                Para visualizar todas las compras emitidas hacia este proveedor, consulte el módulo de{' '}
                <Link to="/compras" style={{ color: '#0284c7', textDecoration: 'underline' }}>
                  Compras y Recepciones
                </Link>
                .
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Modal to link product */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1400,
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', maxWidth: '480px', width: '100%', maxHeight: '90dvh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Vincular Producto al Proveedor</h3>
            <form onSubmit={handleLinkProduct} className="stack">
              <Field label="Producto del Catálogo">
                <select
                  required
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(Number(e.target.value))}
                >
                  <option value="">Seleccione un producto...</option>
                  {(allProducts || []).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (ID: {p.id})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Precio Pactado de Compra (Bs.)">
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={agreedPrice}
                  onChange={e => setAgreedPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                />
              </Field>

              <Field label="Detalle o Presentación (Opcional)">
                <input
                  value={detailText}
                  onChange={e => setDetailText(e.target.value)}
                  placeholder="Ej. Caja de 24 unidades, tambor de 200L"
                />
              </Field>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="button" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="button primary"
                  disabled={linking}
                  style={{ background: '#0f172a', color: '#ffffff' }}
                >
                  {linking ? 'Guardando...' : 'Asociar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
