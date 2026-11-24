import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  Download,
  Fuel,
  Mic,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { Card, PageHeading } from '../../../shared/presentation/layout';
import { ErrorBox, Loading } from '../../../shared/presentation/feedback';
import { Field } from '../../../shared/presentation/forms';
import { useBranchOptions } from '../../enterprise/branches/application/use-branches';
import { useReportsApi } from '../application/repository-context';
import { ParsedVoiceIntent, ReportTabType } from '../domain/models';
import { VoiceAiReportAssistant } from './VoiceAiReportAssistant';
import { DashboardSummary } from '../domain/models';

export function Reports() {
  const api = useReportsApi();
  const { data: branchesData } = useBranchOptions();

  const [activeTab, setActiveTab] = useState<
    'resumen' | 'ventas' | 'dispensadores' | 'compras' | 'inventario' | 'salidas' | 'clientes'
  >('resumen');

  const [idSucursal, setIdSucursal] = useState<number | ''>('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [periodo, setPeriodo] = useState<'todo' | 'semana' | 'mes' | 'ano'>('todo');

  // 1. Dashboard summary
  const { data: summary, error: summaryError, isLoading: summaryLoading } = useSWR<DashboardSummary>(
    api.getSummaryKey(idSucursal ? Number(idSucursal) : undefined)
  );

  // 2. Tab data loaders
  const { data: salesData, error: salesError, isLoading: salesLoading } = useSWR(
    activeTab === 'ventas' ? ['/reportes/ventas', desde, hasta, idSucursal, periodo] : null,
    () => api.getSalesReport(desde, hasta, idSucursal ? Number(idSucursal) : undefined, periodo)
  );

  const { data: dispensersData, error: dispensersError, isLoading: dispensersLoading } = useSWR(
    activeTab === 'dispensadores' ? ['/reportes/dispensadores', desde, hasta, idSucursal, periodo] : null,
    () => api.getDispensersReport(desde, hasta, idSucursal ? Number(idSucursal) : undefined, periodo)
  );

  const { data: purchasesData, error: purchasesError, isLoading: purchasesLoading } = useSWR(
    activeTab === 'compras' ? ['/reportes/compras', desde, hasta, idSucursal, periodo] : null,
    () => api.getPurchasesReport(desde, hasta, idSucursal ? Number(idSucursal) : undefined, periodo)
  );

  const { data: inventoryData, isLoading: inventoryLoading } = useSWR(
    activeTab === 'inventario' ? ['/reportes/inventario', idSucursal] : null,
    () => api.getInventoryReport(idSucursal ? Number(idSucursal) : undefined)
  );

  const { data: exitsData, error: exitsError, isLoading: exitsLoading } = useSWR(
    activeTab === 'salidas' ? ['/reportes/salidas', desde, hasta, idSucursal, periodo] : null,
    () => api.getExitsReport(desde, hasta, idSucursal ? Number(idSucursal) : undefined, periodo)
  );

  const { data: customersData, isLoading: customersLoading } = useSWR(
    activeTab === 'clientes' ? '/reportes/clientes' : null,
    () => api.getCustomersReport(20)
  );

  const { data: voiceCommands = [] } = useSWR('/reportes/voz/comandos', () => api.getVoiceCommands());
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!exportMenuRef.current?.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [exportMenuOpen]);

  const handleExport = (
    format: 'csv' | 'excel' | 'pdf',
    tipo: string,
    overrideIntent?: ParsedVoiceIntent,
  ) => {
    const targetFrom = overrideIntent?.desde ?? desde;
    const targetTo = overrideIntent?.hasta ?? hasta;
    const targetBranch = overrideIntent?.sucursalId ?? (idSucursal ? Number(idSucursal) : undefined);
    const targetPeriodo = overrideIntent?.periodo ?? periodo;

    const url =
      format === 'excel'
        ? api.exportExcelUrl(tipo, targetFrom, targetTo, targetBranch, targetPeriodo)
        : format === 'pdf'
          ? api.exportPdfUrl(tipo, targetFrom, targetTo, targetBranch, targetPeriodo)
          : api.exportCsvUrl(tipo, targetFrom, targetTo, targetBranch, targetPeriodo);
    window.open(url, '_blank');
  };

  const handleApplyVoiceIntent = (intent: ParsedVoiceIntent) => {
    setActiveTab(intent.tipo as typeof activeTab);
    if (intent.desde || intent.hasta) {
      setDesde(intent.desde || '');
      setHasta(intent.hasta || '');
      setPeriodo('todo');
    } else if (intent.periodo) {
      setDesde('');
      setHasta('');
      setPeriodo(intent.periodo);
    }
    if (intent.sucursalId !== undefined) {
      setIdSucursal(intent.sucursalId);
    }
    if (intent.formato) {
      const exportTipo = intent.tipo === 'resumen' ? 'ventas' : intent.tipo;
      handleExport(intent.formato, exportTipo, intent);
    }
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="button"
            onClick={() => setAiModalOpen(true)}
          >
            <Mic size={16} /> Voz / IA
          </button>

          <div ref={exportMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="button"
              aria-expanded={exportMenuOpen}
              onClick={() => setExportMenuOpen(v => !v)}
            >
              <Download size={16} /> Exportar <ChevronDown size={14} />
            </button>
            {exportMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  minWidth: '185px',
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                  padding: '6px',
                  zIndex: 1200,
                  display: 'grid',
                  gap: '2px',
                }}
              >
                <button
                  type="button"
                  className="button"
                  style={{ width: '100%', justifyContent: 'flex-start', border: 0 }}
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleExport('csv', activeTab === 'resumen' ? 'ventas' : activeTab);
                  }}
                >
                  Exportar CSV (.csv)
                </button>
                <button
                  type="button"
                  className="button"
                  style={{ width: '100%', justifyContent: 'flex-start', border: 0 }}
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleExport('excel', activeTab === 'resumen' ? 'ventas' : activeTab);
                  }}
                >
                  Exportar Excel (.xlsx)
                </button>
                <button
                  type="button"
                  className="button"
                  style={{ width: '100%', justifyContent: 'flex-start', border: 0 }}
                  onClick={() => {
                    setExportMenuOpen(false);
                    handleExport('pdf', activeTab === 'resumen' ? 'ventas' : activeTab);
                  }}
                >
                  Exportar PDF (.pdf)
                </button>
              </div>
            )}
          </div>
        </div>
      </PageHeading>

      <ErrorBox error={summaryError || salesError || dispensersError || purchasesError || exitsError} />

      <VoiceAiReportAssistant
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        activeTab={activeTab as ReportTabType}
        from={desde}
        to={hasta}
        periodo={periodo as 'todo' | 'semana' | 'mes' | 'ano'}
        branchId={idSucursal ? Number(idSucursal) : undefined}
        voiceCommands={voiceCommands}
        onTranscribe={(data, mimeType) => api.transcribeVoice(data, mimeType)}
        onConsult={payload => api.consultWithAi(payload)}
        onApplyIntent={handleApplyVoiceIntent}
      />

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
            <Field label="Período">
              <select value={periodo} onChange={e => setPeriodo(e.target.value as any)}>
                <option value="todo">Personalizado / Todo</option>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mes</option>
                <option value="ano">Este año</option>
              </select>
            </Field>
            <Field label="Desde">
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
            </Field>
            <Field label="Hasta">
              <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
            </Field>
            <Field label="Sucursal">
              <select value={idSucursal} onChange={e => setIdSucursal(e.target.value === '' ? '' : Number(e.target.value))}>
                <option value="">Todas las sucursales</option>
                {(branchesData || []).map(b => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </Field>
            {(desde || hasta || idSucursal || periodo !== 'todo') && (
              <button
                className="button"
                onClick={() => {
                  setDesde('');
                  setHasta('');
                  setIdSucursal('');
                  setPeriodo('todo');
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
        <div className="responsive-split">
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

// Alias de componente «UI» para trazabilidad UML (CU14: UI.Reporte / UIReportes)
export const UIReporte = Reports;
export const UIReportes = Reports;
