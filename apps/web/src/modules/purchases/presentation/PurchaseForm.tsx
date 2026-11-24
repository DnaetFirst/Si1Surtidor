import { Plus, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { setNotice, useAppDispatch } from '../../security/auth/application/session';
import { Card, FormTop } from '../../../shared/presentation/layout';
import { ErrorBox } from '../../../shared/presentation/feedback';
import { Field } from '../../../shared/presentation/forms';
import { useBranchOptions } from '../../enterprise/branches/application/use-branches';
import { useInventoryApi } from '../../inventory/application/repository-context';
import { Product } from '../../inventory/domain/models';
import { usePurchasesApi } from '../application/repository-context';
import { Provider, PurchaseOrder } from '../domain/models';

interface ReceiptLine {
  idProducto: number;
  loteCodigo: string;
  fechaVencimiento: string;
  cantidad: number;
  precio: number;
}

export function PurchaseForm() {
  const [searchParams] = useSearchParams();
  const defaultOrderId = searchParams.get('ordenId');

  const api = usePurchasesApi();
  const inventoryApi = useInventoryApi();
  const { data: branchesData } = useBranchOptions();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [selectedOrderId, setSelectedOrderId] = useState<number | ''>(
    defaultOrderId ? Number(defaultOrderId) : ''
  );
  const [idSucursal, setIdSucursal] = useState<number | ''>('');
  const [idProveedor, setIdProveedor] = useState<number | ''>('');
  const [motivo, setMotivo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [moneda] = useState('BOB');
  const [detalles, setDetalles] = useState<ReceiptLine[]>([
    { idProducto: 0, loteCodigo: '', fechaVencimiento: '', cantidad: 1, precio: 0 },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const { data: pendingOrders } = useSWR<{ items: PurchaseOrder[] }>(
    api.listOrdersKey('', undefined, 1)
  );
  const { data: providersData } = useSWR<{ items: Provider[] }>(api.listProvidersKey('', 'true', 1));
  const { data: productsData } = useSWR<Product[]>(inventoryApi.listProductsKey());

  useEffect(() => {
    if (!selectedOrderId && branchesData?.length && (!idSucursal || !branchesData.some(b => b.id === Number(idSucursal)))) {
      setIdSucursal(branchesData[0].id);
    }
  }, [selectedOrderId, branchesData, idSucursal]);

  // If order selected, load its full details
  const { data: orderDetail } = useSWR<PurchaseOrder>(
    selectedOrderId ? `/ordenes-compra/${selectedOrderId}` : null,
    () => api.getOrder(Number(selectedOrderId))
  );

  useEffect(() => {
    if (orderDetail) {
      if (orderDetail.idSucursal) setIdSucursal(orderDetail.idSucursal);
      if (orderDetail.idProveedor) setIdProveedor(orderDetail.idProveedor);
      if (orderDetail.motivo) setMotivo(`Recepción de ${orderDetail.codigo}: ${orderDetail.motivo}`);
      if (orderDetail.detalles?.length) {
        setDetalles(
          orderDetail.detalles.map(d => ({
            idProducto: d.idProducto,
            loteCodigo: `LOT-${orderDetail.codigo}-${d.idProducto}`,
            fechaVencimiento: '',
            cantidad: d.cantidad,
            precio: 0,
          }))
        );
      }
    }
  }, [orderDetail]);

  const handleAddItem = () => {
    setDetalles([
      ...detalles,
      { idProducto: 0, loteCodigo: '', fechaVencimiento: '', cantidad: 1, precio: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (detalles.length === 1) return;
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ReceiptLine, value: any) => {
    const updated = [...detalles];
    updated[index] = { ...updated[index], [field]: value };
    setDetalles(updated);
  };

  const totalCalculado = detalles.reduce(
    (acc, d) => acc + (Number(d.cantidad) || 0) * (Number(d.precio) || 0),
    0
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validLines = detalles.filter(d => d.idProducto > 0 && d.cantidad > 0);
    if (!validLines.length) {
      alert('Debe incluir al menos un producto válido con cantidad.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.createPurchase({
        codigo: codigo.trim() || undefined,
        motivo: motivo.trim() || 'Recepción de compra',
        moneda,
        idSucursal: idSucursal ? Number(idSucursal) : undefined,
        idProveedor: idProveedor ? Number(idProveedor) : undefined,
        idOrden: selectedOrderId ? Number(selectedOrderId) : undefined,
        detalles: validLines.map(d => ({
          idProducto: Number(d.idProducto),
          cantidad: Number(d.cantidad),
          precio: Number(d.precio),
          loteCodigo: d.loteCodigo.trim() || undefined,
          fechaVencimiento: d.fechaVencimiento || undefined,
        })),
      });
      dispatch(setNotice('Nota de compra registrada y stock actualizado en inventario.'));
      navigate('/compras');
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormTop
        title="Crear Nota de Compra"
        back="/compras"
        saving={saving}
        saveLabel="Guardar"
      />
      <ErrorBox error={error} />

      <div className="responsive-split-sidebar">
        {/* Left card: Detalles de la compra */}
        <Card title="Detalles de la compra" subtitle="Seleccione orden de compra o ingrese proveedor">
          <fieldset className="stack" disabled={saving}>
            <Field label="Orden de compra (Opcional)">
              <select
                value={selectedOrderId}
                onChange={e => setSelectedOrderId(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">Ninguna / Compra directa</option>
                {(pendingOrders?.items || []).filter(o => o.estado === 'PENDIENTE' || o.estado === 'APROBADA').map(o => (
                  <option key={o.id} value={o.id}>
                    {o.codigo} ({o.estado}) - {o.motivo || 'Orden'}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Sucursal *">
              <select
                required
                value={idSucursal}
                onChange={e => setIdSucursal(e.target.value === '' ? '' : Number(e.target.value))}
              >
                {!(branchesData || []).length && <option value="">Cargando sucursales...</option>}
                {(branchesData || []).map(b => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Proveedor">
              <select
                value={idProveedor}
                onChange={e => setIdProveedor(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">Seleccione proveedor...</option>
                {(providersData?.items || []).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.nit})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Motivo o Glosa">
              <input
                maxLength={255}
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ej. Factura 9912 - Abastecimiento"
              />
            </Field>

            <Field label="Código de Nota (Opcional)">
              <input
                maxLength={50}
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                placeholder="Generado automáticamente si se omite"
              />
            </Field>
          </fieldset>
        </Card>

        {/* Right card: Productos */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Productos</h3>
            <button
              type="button"
              className="button primary"
              style={{ background: '#0f172a', color: '#ffffff', borderRadius: '8px' }}
              onClick={handleAddItem}
            >
              <Plus size={16} /> Agregar
            </button>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Lote</th>
                  <th>Fecha Exp.</th>
                  <th>Cantidad</th>
                  <th>Precio Unit. (Bs)</th>
                  <th>SubTotal</th>
                  <th><span className="sr-only">Eliminar</span></th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((d, index) => {
                  const sub = (Number(d.cantidad) || 0) * (Number(d.precio) || 0);
                  return (
                    <tr key={index}>
                      <td style={{ minWidth: '180px' }}>
                        <select
                          required
                          value={d.idProducto}
                          onChange={e => handleItemChange(index, 'idProducto', Number(e.target.value))}
                          style={{ width: '100%' }}
                        >
                          <option value={0}>Seleccionar...</option>
                          {(productsData || []).map(p => (
                            <option key={p.id} value={p.id}>
                              {p.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          placeholder="Lote..."
                          value={d.loteCodigo}
                          onChange={e => handleItemChange(index, 'loteCodigo', e.target.value)}
                          style={{ width: '110px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          value={d.fechaVencimiento}
                          onChange={e => handleItemChange(index, 'fechaVencimiento', e.target.value)}
                          style={{ width: '130px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          value={d.cantidad}
                          onChange={e => handleItemChange(index, 'cantidad', e.target.value)}
                          style={{ width: '80px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={d.precio}
                          onChange={e => handleItemChange(index, 'precio', e.target.value)}
                          style={{ width: '90px' }}
                        />
                      </td>
                      <td>
                        <strong>Bs. {sub.toFixed(2)}</strong>
                      </td>
                      <td className="menu-cell">
                        <button
                          type="button"
                          className="button icon-button"
                          disabled={detalles.length === 1}
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Total: Bs. {totalCalculado.toFixed(2)}
            </div>
          </div>
        </Card>
      </div>
    </form>
  );
}
