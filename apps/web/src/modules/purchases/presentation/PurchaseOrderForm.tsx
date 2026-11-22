import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { setNotice, useAppDispatch, useSession } from '../../security/auth/application/session';
import { Card, FormTop } from '../../../shared/presentation/layout';
import { ErrorBox } from '../../../shared/presentation/feedback';
import { Field } from '../../../shared/presentation/forms';
import { useBranches } from '../../enterprise/branches/application/use-branches';
import { useInventoryApi } from '../../inventory/application/repository-context';
import { Product } from '../../inventory/domain/models';
import { usePurchasesApi } from '../application/repository-context';
import { Provider } from '../domain/models';

interface OrderItemLine {
  idProducto: number;
  cantidad: number;
}

export function PurchaseOrderForm() {
  const api = usePurchasesApi();
  const inventoryApi = useInventoryApi();
  const branchesState = useBranches();
  const { user } = useSession();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [idSucursal, setIdSucursal] = useState<number | ''>(
    user?.rol?.codigo === 'GS' ? 1 : 1
  );
  const [idProveedor, setIdProveedor] = useState<number | ''>('');
  const [motivo, setMotivo] = useState('');
  const [detalles, setDetalles] = useState<OrderItemLine[]>([
    { idProducto: 0, cantidad: 1 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const { data: providersData } = useSWR<{ items: Provider[] }>(api.listProvidersKey('', 'true', 1));
  const { data: productsData } = useSWR<Product[]>(inventoryApi.listProductsKey());

  const handleAddItem = () => {
    setDetalles([...detalles, { idProducto: 0, cantidad: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (detalles.length === 1) return;
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof OrderItemLine, value: any) => {
    const updated = [...detalles];
    updated[index] = { ...updated[index], [field]: Number(value) };
    setDetalles(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idSucursal) {
      alert('Seleccione una sucursal.');
      return;
    }
    const validDetails = detalles.filter(d => d.idProducto > 0 && d.cantidad > 0);
    if (!validDetails.length) {
      alert('Debe agregar al menos un producto con cantidad válida.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.createOrder({
        idSucursal: Number(idSucursal),
        idProveedor: idProveedor ? Number(idProveedor) : undefined,
        motivo: motivo.trim() || 'Abastecimiento de stock',
        detalles: validDetails,
      });
      dispatch(setNotice('Orden de compra registrada exitosamente.'));
      navigate('/compras/ordenes');
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormTop
        title="Crear Orden de Compra"
        back="/compras/ordenes"
        saving={saving}
        saveLabel="Generar Orden"
      />
      <ErrorBox error={error} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        <Card title="Datos de la Orden" subtitle="Parámetros de la solicitud">
          <fieldset className="stack" disabled={saving}>
            <Field label="Sucursal Solicitante *">
              <select
                required
                value={idSucursal}
                onChange={e => setIdSucursal(Number(e.target.value))}
              >
                <option value="">Seleccione sucursal...</option>
                {(branchesState.data?.items || []).map(b => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Proveedor Sugerido (Opcional)">
              <select
                value={idProveedor}
                onChange={e => setIdProveedor(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">Cualquier proveedor...</option>
                {(providersData?.items || []).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.nit})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Motivo de la Orden">
              <input
                maxLength={255}
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ej. Reposición de lubricantes y bebidas"
              />
            </Field>
          </fieldset>
        </Card>

        <Card title="Productos a Solicitar" subtitle="Detalle de ítems requeridos">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {detalles.map((d, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 1.5fr 40px',
                  gap: '12px',
                  alignItems: 'end',
                  padding: '8px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Field label={`Producto #${index + 1}`}>
                  <select
                    required
                    value={d.idProducto}
                    onChange={e => handleItemChange(index, 'idProducto', e.target.value)}
                  >
                    <option value={0}>Seleccione un producto...</option>
                    {(productsData || []).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (Stock actual: {p.stock})
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Cantidad">
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={d.cantidad}
                    onChange={e => handleItemChange(index, 'cantidad', e.target.value)}
                  />
                </Field>

                <button
                  type="button"
                  className="button icon-button"
                  disabled={detalles.length === 1}
                  onClick={() => handleRemoveItem(index)}
                  style={{ height: '38px', marginBottom: '4px' }}
                >
                  <Trash2 size={16} color="#ef4444" />
                </button>
              </div>
            ))}

            <button
              type="button"
              className="button"
              onClick={handleAddItem}
              style={{ alignSelf: 'flex-start', marginTop: '8px' }}
            >
              <Plus size={16} /> Añadir otro producto
            </button>
          </div>
        </Card>
      </div>
    </form>
  );
}
