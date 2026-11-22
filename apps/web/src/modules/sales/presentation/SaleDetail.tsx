import { ArrowLeft, Printer, ShieldCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { Card } from '../../../shared/presentation/layout';
import { ErrorBox, Loading } from '../../../shared/presentation/feedback';
import { useSalesApi } from '../application/repository-context';
import { Sale } from '../domain/models';

export function SaleDetail() {
  const { id } = useParams<{ id: string }>();
  const api = useSalesApi();

  const { data: sale, error, isLoading } = useSWR<Sale>(
    `/ventas/${id}`,
    () => api.getSale(Number(id))
  );

  if (isLoading) return <Loading />;
  if (error || !sale) return <ErrorBox error={error || new Error('Nota de venta no encontrada')} />;

  const total = Number(sale.montoPagado) - Number(sale.montoCambio);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/ventas" className="button icon-button">
            <ArrowLeft size={16} />
          </Link>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>
            Comprobante de Venta #{sale.codigo}
          </h1>
        </div>
        <button className="button" onClick={() => window.print()}>
          <Printer size={16} /> Imprimir Ticket
        </button>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <Card>
          <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '16px', marginBottom: '16px' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem' }}>ESTACIÓN DE SERVICIO</h2>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{sale.sucursalNombre || 'Sucursal Principal'}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px' }}>
              Fecha: {sale.fecha} {sale.hora} · Nota: <strong>{sale.codigo}</strong>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '8px',
                padding: '4px 10px',
                background: '#ecfdf5',
                borderRadius: '16px',
                fontSize: '0.8rem',
                color: '#065f46',
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={16} /> ANH B-SISA AUTORIZADO
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem', marginBottom: '16px' }}>
            <div>
              <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.8rem' }}>CLIENTE:</span>
              <strong>{sale.nombreCliente}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.8rem' }}>NIT / CI:</span>
              <strong>{sale.nit}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.8rem' }}>PLACA:</span>
              <strong>{sale.placa || 'SIN PLACA'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.8rem' }}>DISPENSADOR:</span>
              <span>{sale.dispensadorUbicacion || 'Venta Mostrador'}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginBottom: '16px' }}>
            <table style={{ width: '100%', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '6px 0' }}>Detalle</th>
                  <th style={{ padding: '6px 0', textAlign: 'right' }}>Cant.</th>
                  <th style={{ padding: '6px 0', textAlign: 'right' }}>P.U.</th>
                  <th style={{ padding: '6px 0', textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(sale.detalles || []).map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 0' }}>
                      {d.combustibleNombre || d.productoNombre || 'Combustible / Producto'}
                      {d.mangueraNombre && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{d.mangueraNombre}</div>
                      )}
                    </td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>{Number(d.cantidad).toFixed(2)}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>{Number(d.precio).toFixed(2)}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>
                      <strong>Bs. {Number(d.subtotal).toFixed(2)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: '2px solid #0f172a', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800 }}>
              <span>TOTAL PAGADO:</span>
              <span>Bs. {total.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--muted)', marginTop: '4px' }}>
              <span>Método de pago:</span>
              <span>{sale.metodoPago}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--muted)' }}>
              <span>Efectivo recibido:</span>
              <span>Bs. {Number(sale.montoPagado).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--muted)' }}>
              <span>Cambio:</span>
              <span>Bs. {Number(sale.montoCambio).toFixed(2)}</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.8rem', color: 'var(--muted)' }}>
            Cajero: {sale.usuarioNombre} · ¡Gracias por su preferencia!
          </div>
        </Card>
      </div>
    </div>
  );
}
