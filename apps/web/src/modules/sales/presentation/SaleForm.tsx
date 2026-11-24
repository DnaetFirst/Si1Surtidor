import { Fuel, Package, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { setNotice, useAppDispatch } from '../../security/auth/application/session';
import { Card, FormTop } from '../../../shared/presentation/layout';
import { ErrorBox } from '../../../shared/presentation/feedback';
import { Field } from '../../../shared/presentation/forms';
import { useBranchOptions } from '../../enterprise/branches/application/use-branches';
import { useInventoryApi } from '../../inventory/application/repository-context';
import { Product } from '../../inventory/domain/models';
import { useSalesApi } from '../application/repository-context';
import { Discount, Dispenser } from '../domain/models';

interface SaleItemLine {
  tipo: 'COMBUSTIBLE' | 'TIENDA';
  idDispensador?: number;
  idManguera?: number;
  idProducto?: number;
  nombreItem: string;
  cantidad: number;
  precio: number;
  idDescuento?: number;
}

export function SaleForm() {
  const api = useSalesApi();
  const inventoryApi = useInventoryApi();
  const { data: branchesData } = useBranchOptions();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [idSucursal, setIdSucursal] = useState<number | ''>('');
  const [nombreCliente, setNombreCliente] = useState('Cliente Casual');
  const [nit, setNit] = useState('0');
  const [placa, setPlaca] = useState('');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [montoEntregado, setMontoEntregado] = useState<number | ''>('');
  const [estadoBSisa, setEstadoBSisa] = useState(true);

  // Line items
  const [items, setItems] = useState<SaleItemLine[]>([]);

  // Item builder state
  const [itemType, setItemType] = useState<'COMBUSTIBLE' | 'TIENDA'>('COMBUSTIBLE');
  const [selectedDispenserId, setSelectedDispenserId] = useState<number | ''>('');
  const [selectedHoseId, setSelectedHoseId] = useState<number | ''>('');
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [inputQuantity, setInputQuantity] = useState<number | ''>(10);
  const [inputPrice, setInputPrice] = useState<number | ''>(6.96);
  const [selectedDiscountId, setSelectedDiscountId] = useState<number | ''>('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (branchesData?.length && (!idSucursal || !branchesData.some(b => b.id === Number(idSucursal)))) {
      setIdSucursal(branchesData[0].id);
    }
  }, [branchesData, idSucursal]);

  const { data: dispensersData } = useSWR<{ items: Dispenser[] }>(
    api.listDispensersKey('', idSucursal ? Number(idSucursal) : undefined, 1)
  );
  const { data: productsData } = useSWR<Product[]>(inventoryApi.listProductsKey());
  const { data: discountsData } = useSWR<Discount[]>(
    idSucursal ? `/descuentos/activos?sucursalId=${idSucursal}` : null,
    () => api.listActiveDiscounts(Number(idSucursal))
  );

  // When dispenser changes, auto-select first hose
  useEffect(() => {
    if (selectedDispenserId && dispensersData?.items) {
      const d = dispensersData.items.find(x => x.id === selectedDispenserId);
      if (d?.mangueras?.length) {
        setSelectedHoseId(d.mangueras[0].id);
      } else {
        setSelectedHoseId('');
      }
    }
  }, [selectedDispenserId, dispensersData]);

  // When product changes, auto-fill price
  useEffect(() => {
    if (selectedProductId && productsData) {
      const p = productsData.find(x => x.id === selectedProductId);
      if (p) {
        setInputPrice(Number(p.precioVenta));
      }
    }
  }, [selectedProductId, productsData]);

  const handleAddLine = () => {
    if (itemType === 'COMBUSTIBLE') {
      if (!selectedDispenserId || !selectedHoseId) {
        alert('Seleccione un dispensador y una manguera de combustible.');
        return;
      }
      const d = dispensersData?.items.find(x => x.id === selectedDispenserId);
      const m = d?.mangueras?.find(x => x.id === selectedHoseId);
      const qty = Number(inputQuantity) || 1;
      const prc = Number(inputPrice) || 3.74;

      setItems([
        ...items,
        {
          tipo: 'COMBUSTIBLE',
          idDispensador: Number(selectedDispenserId),
          idManguera: Number(selectedHoseId),
          nombreItem: `${m?.nombre || 'Manguera'} (${m?.combustibleNombre || 'Combustible'})`,
          cantidad: qty,
          precio: prc,
          idDescuento: selectedDiscountId ? Number(selectedDiscountId) : undefined,
        },
      ]);
    } else {
      if (!selectedProductId) {
        alert('Seleccione un producto.');
        return;
      }
      const p = productsData?.find(x => x.id === selectedProductId);
      const qty = Number(inputQuantity) || 1;
      const prc = Number(inputPrice) || Number(p?.precioVenta) || 0;

      setItems([
        ...items,
        {
          tipo: 'TIENDA',
          idProducto: Number(selectedProductId),
          nombreItem: p?.nombre || 'Producto',
          cantidad: qty,
          precio: prc,
          idDescuento: selectedDiscountId ? Number(selectedDiscountId) : undefined,
        },
      ]);
    }

    // Reset inputs
    setInputQuantity(10);
  };

  const handleRemoveLine = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const totalBruto = items.reduce((acc, it) => acc + it.cantidad * it.precio, 0);
  const totalNeto = items.reduce((acc, it) => {
    const raw = it.cantidad * it.precio;
    const disc = it.idDescuento ? (discountsData || []).find(d => d.id === it.idDescuento) : undefined;
    if (!disc) return acc + raw;
    const sub = disc.tipo === 'PORCENTAJE'
      ? Math.max(0, raw * (1 - Number(disc.valor) / 100))
      : Math.max(0, raw - Number(disc.valor));
    return acc + Math.round(sub * 100) / 100;
  }, 0);
  const montoRecibido = montoEntregado === '' ? totalNeto : Number(montoEntregado);
  const cambio = Math.max(0, montoRecibido - totalNeto);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) {
      alert('Debe agregar al menos un ítem a la venta.');
      return;
    }
    if (montoRecibido < totalNeto) {
      alert('El monto pagado no puede ser menor al total.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.createSale({
        nombreCliente: nombreCliente.trim() || 'Sin Nombre',
        nit: nit.trim() || '0',
        placa: placa.trim().toUpperCase(),
        metodoPago,
        montoPagado: montoRecibido,
        estadoBSisa,
        idDispensador: items.find(it => it.idDispensador)?.idDispensador,
        idSucursal: Number(idSucursal),
        detalles: items.map(it => ({
          idProducto: it.idProducto,
          idManguera: it.idManguera,
          idDescuento: it.idDescuento,
          cantidad: it.cantidad,
          precio: it.precio,
        })),
      });
      dispatch(setNotice('Venta registrada exitosamente con validación B-SISA.'));
      navigate('/ventas');
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormTop
        title="Terminal de Venta (POS / Despacho)"
        back="/ventas"
        saving={saving}
        saveLabel="Finalizar Venta e Imprimir"
      />
      <ErrorBox error={error} />

      <div className="responsive-split">
        {/* Left Column: Cliente y B-SISA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          <Card title="Datos del Cliente y Vehículo" subtitle="Control B-SISA y facturación">
            <fieldset className="stack" disabled={saving}>
              <div className="responsive-inline-2">
                <Field label="Placa del Vehículo">
                  <input
                    maxLength={20}
                    value={placa}
                    onChange={e => setPlaca(e.target.value.toUpperCase())}
                    placeholder="Ej. 3849-XYZ"
                  />
                </Field>

                <Field label="NIT / CI">
                  <input
                    required
                    maxLength={20}
                    value={nit}
                    onChange={e => setNit(e.target.value)}
                    placeholder="0 si no requiere factura"
                  />
                </Field>
              </div>

              <Field label="Razón Social / Nombre">
                <input
                  required
                  maxLength={100}
                  value={nombreCliente}
                  onChange={e => setNombreCliente(e.target.value)}
                  placeholder="Cliente Casual o Nombre"
                />
              </Field>

              <div
                style={{
                  background: estadoBSisa ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${estadoBSisa ? '#a7f3d0' : '#fecaca'}`,
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} color={estadoBSisa ? '#059669' : '#dc2626'} />
                  <div>
                    <strong style={{ color: estadoBSisa ? '#065f46' : '#991b1b', fontSize: '0.9rem' }}>
                      {estadoBSisa ? 'B-SISA: Vehículo Habilitado para Carga' : 'B-SISA: Bloqueado / Restringido'}
                    </strong>
                    <div style={{ fontSize: '0.8rem', color: estadoBSisa ? '#047857' : '#b91c1c' }}>
                      Validación en línea con la Agencia Nacional de Hidrocarburos
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="button"
                  style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  onClick={() => setEstadoBSisa(!estadoBSisa)}
                >
                  Cambiar
                </button>
              </div>

              <Field label="Sucursal">
                <select
                  required
                  value={idSucursal}
                  onChange={e => {
                    setIdSucursal(e.target.value === '' ? '' : Number(e.target.value));
                    setSelectedDispenserId('');
                    setSelectedHoseId('');
                    setSelectedDiscountId('');
                  }}
                >
                  {!(branchesData || []).length && <option value="">Cargando sucursales...</option>}
                  {(branchesData || []).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
              </Field>
            </fieldset>
          </Card>

          {/* Builder Box */}
          <Card title="Agregar Despacho o Producto">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                className="button"
                style={{
                  flex: '1 1 150px',
                  background: itemType === 'COMBUSTIBLE' ? '#0f172a' : '#f8fafc',
                  color: itemType === 'COMBUSTIBLE' ? '#ffffff' : '#0f172a',
                }}
                onClick={() => setItemType('COMBUSTIBLE')}
              >
                <Fuel size={16} /> Combustible (Pista)
              </button>
              <button
                type="button"
                className="button"
                style={{
                  flex: '1 1 150px',
                  background: itemType === 'TIENDA' ? '#0f172a' : '#f8fafc',
                  color: itemType === 'TIENDA' ? '#ffffff' : '#0f172a',
                }}
                onClick={() => setItemType('TIENDA')}
              >
                <Package size={16} /> Tienda / Lubricantes
              </button>
            </div>

            {itemType === 'COMBUSTIBLE' ? (
              <div className="stack">
                <div className="responsive-inline-2">
                  <Field label="Dispensador">
                    <select
                      value={selectedDispenserId}
                      onChange={e => setSelectedDispenserId(e.target.value === '' ? '' : Number(e.target.value))}
                    >
                      <option value="">Seleccione dispensador...</option>
                      {(dispensersData?.items || []).map(d => (
                        <option key={d.id} value={d.id}>
                          {d.ubicacion}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Manguera">
                    <select
                      value={selectedHoseId}
                      onChange={e => setSelectedHoseId(e.target.value === '' ? '' : Number(e.target.value))}
                    >
                      <option value="">Seleccione manguera...</option>
                      {(
                        dispensersData?.items.find(x => x.id === selectedDispenserId)?.mangueras || []
                      ).map(m => (
                        <option key={m.id} value={m.id}>
                          {m.nombre} ({m.combustibleNombre})
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="responsive-inline-2">
                  <Field label="Litros Despachados">
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={inputQuantity}
                      onChange={e => setInputQuantity(Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Precio / Litro (Bs)">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={inputPrice}
                      onChange={e => setInputPrice(Number(e.target.value))}
                    />
                  </Field>
                </div>
              </div>
            ) : (
              <div className="stack">
                <Field label="Producto de Tienda">
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value === '' ? '' : Number(e.target.value))}
                  >
                    <option value="">Seleccione producto...</option>
                    {(productsData || []).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (Bs. {p.precioVenta}) - Stock: {p.stock}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="responsive-inline-2">
                  <Field label="Cantidad">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={inputQuantity}
                      onChange={e => setInputQuantity(Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Precio Venta (Bs)">
                    <input
                      type="number"
                      step="0.01"
                      value={inputPrice}
                      onChange={e => setInputPrice(Number(e.target.value))}
                    />
                  </Field>
                </div>
              </div>
            )}

            <Field label="Descuento (Opcional)">
              <select
                value={selectedDiscountId}
                onChange={e => setSelectedDiscountId(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">Sin descuento</option>
                {(discountsData || []).map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} ({d.tipo === 'PORCENTAJE' ? `${d.valor}%` : `Bs. ${d.valor}`})
                  </option>
                ))}
              </select>
            </Field>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="button primary"
                onClick={handleAddLine}
                style={{ background: '#0f172a', color: '#ffffff' }}
              >
                <Plus size={16} /> Agregar al ticket
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column: Ticket Summary & Payment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          <Card title="Ticket de Venta" subtitle="Detalle de ítems despachados">
            <div style={{ minHeight: '160px', maxHeight: '240px', overflowY: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '6px' }}>Ítem</th>
                    <th style={{ padding: '6px' }}>Cant.</th>
                    <th style={{ padding: '6px' }}>P.U.</th>
                    <th style={{ padding: '6px' }}>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px' }}>
                        <strong>{it.nombreItem}</strong>
                      </td>
                      <td style={{ padding: '6px' }}>{it.cantidad}</td>
                      <td style={{ padding: '6px' }}>Bs. {it.precio.toFixed(2)}</td>
                      <td style={{ padding: '6px' }}>
                        <strong>Bs. {(it.cantidad * it.precio).toFixed(2)}</strong>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="button icon-button"
                          onClick={() => handleRemoveLine(idx)}
                        >
                          <Trash2 size={14} color="#ef4444" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                        No hay ítems agregados al ticket
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '2px solid #0f172a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Total a Cobrar:</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                Bs. {totalNeto.toFixed(2)}
              </span>
            </div>
            {totalBruto > totalNeto && (
              <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#059669', marginTop: '4px' }}>
                Descuento aplicado: -Bs. {(totalBruto - totalNeto).toFixed(2)}
              </div>
            )}
          </Card>

          <Card title="Cobro y Método de Pago">
            <fieldset className="stack" disabled={saving}>
              <Field label="Método de Pago">
                <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="QR">Transferencia / QR Simple</option>
                  <option value="TARJETA">Tarjeta de Débito / Crédito</option>
                </select>
              </Field>

              <div className="responsive-inline-2">
                <Field label="Monto Recibido (Bs)">
                  <input
                    type="number"
                    step="0.01"
                    min={totalNeto}
                    value={montoEntregado}
                    onChange={e => setMontoEntregado(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={`Mínimo ${totalNeto.toFixed(2)}`}
                  />
                </Field>

                <Field label="Cambio / Vuelto">
                  <input
                    readOnly
                    value={`Bs. ${cambio.toFixed(2)}`}
                    style={{ background: '#f8fafc', fontWeight: 700, color: '#059669' }}
                  />
                </Field>
              </div>
            </fieldset>
          </Card>
        </div>
      </div>
    </form>
  );
}

export const UIVentaForm = SaleForm;
export const UIRealizarVenta = SaleForm;
