import { ArrowLeft, Package, ShoppingCart, XCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { allowed, setNotice, useAppDispatch, useSession } from '../../security/auth/application/session';
import { Card } from '../../../shared/presentation/layout';
import { ErrorBox, Loading } from '../../../shared/presentation/feedback';
import { usePurchasesApi } from '../application/repository-context';
import { PurchaseReceipt } from '../domain/models';

export function PurchaseDetail() {
  const { id } = useParams<{ id: string }>();
  const api = usePurchasesApi();
  const { user } = useSession();
  const dispatch = useAppDispatch();

  const { data: purchase, error, isLoading, mutate } = useSWR<PurchaseReceipt>(
    `/compras/${id}`,
    () => api.getPurchase(Number(id))
  );

  if (isLoading) return <Loading />;
  if (error || !purchase) return <ErrorBox error={error || new Error('Compra no encontrada')} />;

  const canAnnul = purchase.estado !== 'ANULADA' && allowed(user, 'compras', 'deshabilitar');

  const handleAnnul = async () => {
    if (!window.confirm(`¿Anular la compra ${purchase.codigo}? Se descontará el stock ingresado si aún está disponible.`)) return;
    try {
      await api.annulPurchase(purchase.id);
      await mutate();
      dispatch(setNotice(`Compra ${purchase.codigo} anulada y lotes revertidos.`));
    } catch (err: any) {
      dispatch(setNotice(err?.message || 'Error al anular compra'));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/compras" className="button icon-button">
            <ArrowLeft size={16} />
          </Link>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>
            Compra #{purchase.codigo}
          </h1>
          <span
            className="badge"
            style={{
              background: purchase.estado === 'ANULADA' ? '#fee2e2' : '#dcfce7',
              color: purchase.estado === 'ANULADA' ? '#991b1b' : '#166534',
            }}
          >
            {purchase.estado || 'REGISTRADA'}
          </span>
        </div>
        {canAnnul && (
          <button
            type="button"
            className="button"
            style={{ color: '#991b1b', borderColor: '#fecaca', background: '#fef2f2' }}
            onClick={handleAnnul}
          >
            <XCircle size={16} /> Anular Compra
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        {/* Left column */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingCart size={22} color="#0f172a" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>#{purchase.codigo}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                {purchase.fecha} {purchase.hora}
              </span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--muted)' }}>Detalles de la compra</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Productos:</span>
              <strong>{purchase.detalles?.length || 1}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Total:</span>
              <strong style={{ fontSize: '1.05rem' }}>Bs. {Number(purchase.montoTotal).toFixed(2)}</strong>
            </div>
            {purchase.proveedorNombre && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Proveedor:</span>
                <strong>{purchase.proveedorNombre}</strong>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--muted)' }}>Información del usuario</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: 'var(--muted)' }}>Nombre: </span>
                <strong>{purchase.usuarioNombre}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--muted)' }}>CI: </span>
                <span>{purchase.ciUsuario}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--muted)' }}>Sucursal</h4>
            <div style={{ fontSize: '0.88rem' }}>
              <strong>{purchase.sucursalNombre || 'Sucursal Principal'}</strong>
            </div>
          </div>
        </Card>

        {/* Right column: Items table */}
        <Card title="Productos" subtitle="Ítems recibidos e ingresados a lotes de inventario">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Lote</th>
                  <th>Cantidad</th>
                  <th>Precio de compra</th>
                  <th>SubTotal</th>
                </tr>
              </thead>
              <tbody>
                {(purchase.detalles || []).map(d => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '4px',
                            background: '#f8fafc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Package size={16} color="#64748b" />
                        </div>
                        <div>
                          <strong>{d.productoNombre}</strong>
                          {d.productoCodigo && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{d.productoCodigo}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                        {d.loteCodigo || '—'}
                      </span>
                    </td>
                    <td>
                      <strong>{d.cantidad}</strong> {d.productoUnidadMedida || 'u'}
                    </td>
                    <td>Bs. {Number(d.precio).toFixed(2)}</td>
                    <td>
                      <strong>Bs. {Number(d.subtotal).toFixed(2)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '2px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Total: Bs. {Number(purchase.montoTotal).toFixed(2)}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export const UIDetalleCompra = PurchaseDetail;
export const UICompraDetalle = PurchaseDetail;
