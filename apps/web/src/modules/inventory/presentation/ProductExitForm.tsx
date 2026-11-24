import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { setNotice, useAppDispatch } from '../../security/auth/application/session';
import { Card, FormTop } from '../../../shared/presentation/layout';
import { ErrorBox } from '../../../shared/presentation/feedback';
import { Field } from '../../../shared/presentation/forms';
import { useInventoryApi } from '../application/repository-context';
import { Product } from '../domain/models';

export function ProductExitForm() {
  const api = useInventoryApi();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [idProducto, setIdProducto] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState<number | ''>(1);
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const { data: products } = useSWR<Product[]>(api.listProductsKey());

  const selectedProduct = (products || []).find(p => p.id === idProducto);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idProducto || !cantidad || !motivo.trim()) {
      alert('Complete todos los campos requeridos.');
      return;
    }
    if (selectedProduct && Number(cantidad) > Number(selectedProduct.stock)) {
      setError(new Error(`Stock insuficiente: el producto "${selectedProduct.nombre}" solo tiene ${selectedProduct.stock} unidades disponibles.`));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.createExit({
        idProducto: Number(idProducto),
        cantidad: Number(cantidad),
        motivo: motivo.trim(),
      });
      dispatch(setNotice('Salida de producto registrada y stock deducido.'));
      navigate('/inventario/salidas');
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormTop
        title="Registrar Salida de Producto"
        back="/inventario/salidas"
        saving={saving}
        saveLabel="Confirmar Salida"
      />
      <ErrorBox error={error} />

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <Card title="Datos de la Baja o Merma" subtitle="Se descontará la cantidad del stock en almacén">
          <fieldset className="stack" disabled={saving}>
            <Field label="Producto a Dar de Baja *">
              <select
                required
                value={idProducto}
                onChange={e => setIdProducto(Number(e.target.value))}
              >
                <option value="">Seleccione un producto...</option>
                {(products || []).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} (Stock actual: {p.stock})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Cantidad a Retirar *">
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={cantidad}
                onChange={e => setCantidad(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </Field>

            <Field label="Motivo de la Salida *">
              <textarea
                required
                rows={3}
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ej. Producto dañado en transporte, vencimiento de fecha, rotura de envase, uso interno de estación..."
              />
            </Field>
          </fieldset>
        </Card>
      </div>
    </form>
  );
}

export const UISalidaForm = ProductExitForm;
export const UISalidaProductoForm = ProductExitForm;
