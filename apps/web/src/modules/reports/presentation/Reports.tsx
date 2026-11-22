import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  DollarSign,
  Download,
  Fuel,
} from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';
import { Card, PageHeading } from '../../../shared/presentation/layout';
import { ErrorBox, Loading } from '../../../shared/presentation/feedback';
import { Field } from '../../../shared/presentation/forms';
import { useBranches } from '../../enterprise/branches/application/use-branches';
import { useReportsApi } from '../application/repository-context';
import { DashboardSummary } from '../domain/models';

export function Reports() {
  const api = useReportsApi();
  const branchesState = useBranches();

  const [activeTab, setActiveTab] = useState<
    'resumen' | 'ventas' | 'dispensadores' | 'compras' | 'inventario' | 'salidas' | 'clientes'
  >('resumen');

  const [idSucursal, setIdSucursal] = useState<number | ''>('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  // 1. Dashboard summary
  const { data: summary, error: summaryError, isLoading: summaryLoading } = useSWR<DashboardSummary>(
    api.getSummaryKey(idSucursal ? Number(idSucursal) : undefined)
  );

  // 2. Tab data loaders
  const { data: salesData, isLoading: salesLoading } = useSWR(
    activeTab === 'ventas' ? ['/reportes/ventas', desde, hasta, idSucursal] : null,
    () => api.getSalesReport(desde, hasta, idSucursal ? Number(idSucursal) : undefined)
  );

  const { data: dispensersData, isLoading: dispensersLoading } = useSWR(
    activeTab === 'dispensadores' ? ['/reportes/dispensadores', desde, hasta, idSucursal] : null,
    () => api.getDispensersReport(desde, hasta, idSucursal ? Number(idSucursal) : undefined)
  );

  const { data: purchasesData, isLoading: purchasesLoading } = useSWR(
    activeTab === 'compras' ? ['/reportes/compras', desde, hasta, idSucursal] : null,
    () => api.getPurchasesReport(desde, hasta, idSucursal ? Number(idSucursal) : undefined)
  );

  const { data: inventoryData, isLoading: inventoryLoading } = useSWR(
    activeTab === 'inventario' ? ['/reportes/inventario', idSucursal] : null,
    () => api.getInventoryReport(idSucursal ? Number(idSucursal) : undefined)
  );

  const { data: exitsData, isLoading: exitsLoading } = useSWR(
    activeTab === 'salidas' ? ['/reportes/salidas', desde, hasta, idSucursal] : null,
    () => api.getExitsReport(desde, hasta, idSucursal ? Number(idSucursal) : undefined)
  );

  const { data: customersData, isLoading: customersLoading } = useSWR(
    activeTab === 'clientes' ? '/reportes/clientes' : null,
    () => api.getCustomersReport(20)
  );

  const handleExportCsv = (tipo: string) => {
    window.open(api.exportCsvUrl(tipo, desde, hasta, idSucursal ? Number(idSucursal) : undefined), '_blank');
  };

  const tabs = [
    { key: 'resumen', label: 'Resumen Ejecutivo' },
    { key: 'ventas', label: 'Ventas Diarias' },
    { key: 'dispensadores', label: 'Dispensadores & Combustibles' },
    { key: 'compras', label: 'Compras por Proveedor' },
    { key: 'inventario', label: 'Inventario Valorado' },
    { key: 'salidas', label: 'Mermas y Bajas' },
    { key: 'clientes', label: 'Top Clientes' },
  ];

  return (
    <div>
      <PageHeading
        title="Reportes y Estadísticas"
        subtitle="Analítica en tiempo real de operaciones, ventas, inventario y abastecimiento."
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="button"
            onClick={() => handleExportCsv(activeTab === 'inventario' ? 'inventario' : 'ventas')}
          >
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </PageHeading>

      <ErrorBox error={summaryError} />

      {/* KPI Cards Row */}
      {summaryLoading ? (
        <Loading />
      ) : summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '16px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>VENTAS HOY</span>
              <DollarSign size={18} color="#059669" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              Bs. {summary.ventasHoy.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              {summary.transaccionesHoy} transacciones registradas
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '16px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>VENTAS DEL MES</span>
              <BarChart3 size={18} color="#2563eb" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              Bs. {summary.ventasMes.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Acumulado mensual</div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '16px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>LITROS HOY</span>
              <Fuel size={18} color="#d97706" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              {summary.litrosDespachadosHoy.toFixed(2)} L
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Combustible despachado</div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '16px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>STOCK CRÍTICO</span>
              <AlertTriangle size={18} color={summary.alertasStockBajo > 0 ? '#ef4444' : '#10b981'} />
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: summary.alertasStockBajo > 0 ? '#ef4444' : '#0f172a',
              }}
            >
              {summary.alertasStockBajo}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Productos bajo mínimo</div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '16px 20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>DISPENSADORES</span>
              <CheckCircle2 size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              {summary.dispensadoresActivos}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Equipos activos en pista</div>
          </div>
        </div>
      )}

      {/* Tabs navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '20px',
          paddingBottom: '8px',
        }}
      >
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key as any)}
            style={{
              border: 'none',
              background: activeTab === t.key ? '#0f172a' : '#f8fafc',
              color: activeTab === t.key ? '#ffffff' : '#475569',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters bar for tabs that support dates */}
      {activeTab !== 'resumen' && activeTab !== 'inventario' && activeTab !== 'clientes' && (
        <Card className="mb-4">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
            <Field label="Desde">
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
            </Field>
            <Field label="Hasta">
              <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
            </Field>
            <Field label="Sucursal">
              <select value={idSucursal} onChange={e => setIdSucursal(e.target.value === '' ? '' : Number(e.target.value))}>
                <option value="">Todas las sucursales</option>
                {(branchesState.data?.items || []).map(b => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </Field>
            {(desde || hasta || idSucursal) && (
              <button
                className="button"
                onClick={() => {
                  setDesde('');
                  setHasta('');
                  setIdSucursal('');
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </Card>
      )}

      {/* TAB CONTENT */}

      {/* 1. Resumen Ejecutivo */}
      {activeTab === 'resumen' && summary && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <Card title="Ventas por Tipo de Combustible (Mes Actual)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {summary.ventasPorCombustible.map((c, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>{c.combustible}</strong>
                    <span>
                      {c.totalLitros.toFixed(2)} L · <strong>Bs. {c.totalBs.toFixed(2)}</strong>
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: '#0f172a',
                        width: `${Math.min(100, summary.ventasMes ? (c.totalBs / summary.ventasMes) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {!summary.ventasPorCombustible.length && (
                <p style={{ color: 'var(--muted)', textAlign: 'center', margin: '20px 0' }}>
                  No se registran ventas de combustible este mes.
                </p>
              )}
            </div>
          </Card>

          <Card title="Últimas Ventas Emitidas">
            <div className="table-scroll">
              <table style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Cliente</th>
                    <th>Placa</th>
                    <th>Total</th>
                    <th>Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.ultimasVentas.map(v => (
                    <tr key={v.id}>
                      <td>
                        <strong>{v.codigo}</strong>
                      </td>
                      <td>{v.nombreCliente}</td>
                      <td>{v.placa || '—'}</td>
                      <td>
                        <strong>Bs. {v.total.toFixed(2)}</strong>
                      </td>
                      <td>{v.metodoPago}</td>
                    </tr>
                  ))}
                  {!summary.ultimasVentas.length && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                        No hay ventas recientes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 2. Ventas Diarias */}
      {activeTab === 'ventas' && (
        <Card title="Consolidado Diario de Ventas">
          {salesLoading ? (
            <Loading />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Transacciones</th>
                    <th>Total Combustible (Bs)</th>
                    <th>Total Tienda (Bs)</th>
                    <th>Total Vendido (Bs)</th>
                  </tr>
                </thead>
                <tbody>
                  {(salesData?.daily || []).map((row, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{typeof row.fecha === 'string' ? row.fecha.substring(0, 10) : ''}</strong>
                      </td>
                      <td>{row.transacciones}</td>
                      <td>Bs. {Number(row.totalCombustible).toFixed(2)}</td>
                      <td>Bs. {Number(row.totalTienda).toFixed(2)}</td>
                      <td>
                        <strong style={{ fontSize: '1rem', color: '#059669' }}>
                          Bs. {Number(row.totalVendido).toFixed(2)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                  {(!salesData?.daily || !salesData.daily.length) && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                        No se encontraron registros de ventas en el período seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* 3. Dispensadores & Combustibles */}
      {activeTab === 'dispensadores' && (
        <Card title="Despacho de Combustible por Dispensador y Manguera">
          {dispensersLoading ? (
            <Loading />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Dispensador</th>
                    <th>Manguera</th>
                    <th>Combustible</th>
                    <th>Sucursal</th>
                    <th>Despachos</th>
                    <th>Litros Despachados</th>
                    <th>Total Recaudado (Bs)</th>
                  </tr>
                </thead>
                <tbody>
                  {(dispensersData || []).map((d, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{d.dispensador}</strong>
                      </td>
                      <td>{d.manguera}</td>
                      <td>{d.combustible}</td>
                      <td>{d.sucursal}</td>
                      <td>{d.despachos}</td>
                      <td>
                        <strong>{Number(d.litrosTotales).toFixed(2)} L</strong>
                      </td>
                      <td>
                        <strong>Bs. {Number(d.montoTotalBs).toFixed(2)}</strong>
                      </td>
                    </tr>
                  ))}
                  {(!dispensersData || !dispensersData.length) && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                        No hay despachos registrados para los filtros indicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* 4. Compras por Proveedor */}
      {activeTab === 'compras' && (
        <Card title="Volumen de Compras por Proveedor">
          {purchasesLoading ? (
            <Loading />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>NIT</th>
                    <th>Total Facturas / Notas</th>
                    <th>Monto Total Facturado (Bs)</th>
                  </tr>
                </thead>
                <tbody>
                  {(purchasesData || []).map((p, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{p.proveedor}</strong>
                      </td>
                      <td>{p.proveedorNit}</td>
                      <td>{p.totalCompras}</td>
                      <td>
                        <strong style={{ fontSize: '1rem' }}>Bs. {Number(p.montoTotalBs).toFixed(2)}</strong>
                      </td>
                    </tr>
                  ))}
                  {(!purchasesData || !purchasesData.length) && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                        No hay compras registradas en el período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* 5. Inventario Valorado */}
      {activeTab === 'inventario' && (
        <Card title="Estado del Inventario Valorado y Niveles de Stock">
          {inventoryLoading ? (
            <Loading />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock Actual</th>
                    <th>Stock Mín.</th>
                    <th>P. Venta</th>
                    <th>Valoración Estimada</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(inventoryData || []).map(p => {
                    const isCritical = p.estadoStock === 'STOCK CRÍTICO' || p.estadoStock === 'AGOTADO';
                    return (
                      <tr key={p.id}>
                        <td>{p.codigo || `P-${p.id}`}</td>
                        <td>
                          <strong>{p.nombre}</strong>
                        </td>
                        <td>{p.categoria || 'General'}</td>
                        <td>
                          <strong>{p.stock}</strong> {p.unidad || 'u'}
                        </td>
                        <td>{p.stockMinimo}</td>
                        <td>Bs. {Number(p.precioVenta).toFixed(2)}</td>
                        <td>
                          <strong>Bs. {Number(p.valoracionEstimada).toFixed(2)}</strong>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: isCritical ? '#fee2e2' : p.estadoStock === 'BAJO' ? '#fef3c7' : '#ecfdf5',
                              color: isCritical ? '#991b1b' : p.estadoStock === 'BAJO' ? '#92400e' : '#065f46',
                            }}
                          >
                            {p.estadoStock}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {(!inventoryData || !inventoryData.length) && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                        No hay productos registrados en el inventario.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* 6. Mermas y Salidas */}
      {activeTab === 'salidas' && (
        <Card title="Resumen de Mermas y Bajas de Inventario">
          {exitsLoading ? (
            <Loading />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Motivo de Baja</th>
                    <th>Producto Afectado</th>
                    <th>Sucursal</th>
                    <th>Ocurrencias</th>
                    <th>Cantidad Total Retirada</th>
                  </tr>
                </thead>
                <tbody>
                  {(exitsData || []).map((ex, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{ex.motivo}</strong>
                      </td>
                      <td>{ex.producto}</td>
                      <td>{ex.sucursal || '—'}</td>
                      <td>{ex.registros}</td>
                      <td>
                        <strong style={{ color: '#ef4444' }}>-{Number(ex.cantidadTotalBaja).toFixed(2)}</strong>
                      </td>
                    </tr>
                  ))}
                  {(!exitsData || !exitsData.length) && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                        No se registran salidas en el período seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* 7. Ranking Clientes */}
      {activeTab === 'clientes' && (
        <Card title="Top Clientes por Frecuencia y Volumen de Carga">
          {customersLoading ? (
            <Loading />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cliente / Razón Social</th>
                    <th>NIT</th>
                    <th>Placa Habitual</th>
                    <th>Cargas / Visitas</th>
                    <th>Última Compra</th>
                  </tr>
                </thead>
                <tbody>
                  {(customersData || []).map((c, i) => (
                    <tr key={c.id}>
                      <td>
                        <strong>#{i + 1}</strong>
                      </td>
                      <td>
                        <strong>{c.nombre}</strong>
                      </td>
                      <td>{c.nit}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.placa || '—'}</span>
                      </td>
                      <td>
                        <strong>{c.totalVentas}</strong> compras
                      </td>
                      <td>{c.ultimaCompra || 'Reciente'}</td>
                    </tr>
                  ))}
                  {(!customersData || !customersData.length) && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                        Aún no se registran clientes en el sistema.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
