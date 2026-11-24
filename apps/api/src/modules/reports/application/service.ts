import { Injectable } from '@nestjs/common';
import { AuditWriter, AuthRequest } from '../../../shared/domain/context';
import { csv } from '../../../shared/domain/csv';
import { BadRequestException } from '../../../shared/domain/errors';
import { AiReportAdvisor, AiReportAnalysisResult, ReportDocumentExporter, ReportExportDataset } from '../domain/ai-advisor';
import { assertReportDateRange, reportCalendarRange } from '../domain/calendar';
import { DashboardSummary, SalesReportResult } from '../domain/models';
import { ReportsRepository } from '../domain/repository';
import { PREDEFINED_VOICE_COMMANDS, branchContactFields, parseVoiceReportIntent } from '../domain/voice-intents';

/**
 * CU14. Gestionar reportes (Actores: ASU, ATI, GG, GS).
 * Consultas tabulares, filtrado paramétrico por período (semana|mes|ano),
 * exportación CSV/Excel/PDF y asistente IA (Gemini) con comandos por voz predefinidos.
 */
@Injectable()
export class ReportsService {
  constructor(
    private readonly repository: ReportsRepository,
    private readonly auditWriter: AuditWriter,
    private readonly aiAdvisor: AiReportAdvisor,
    private readonly documentExporter: ReportDocumentExporter,
  ) {}

  private resolveDateRange(desde?: string, hasta?: string, periodo?: string) {
    let from = desde;
    let to = hasta;
    if (periodo && periodo !== 'todo' && !from && !to) {
      const range = reportCalendarRange(periodo);
      from = range.desde;
      to = range.hasta;
    }
    assertReportDateRange(from, to);
    return { from, to };
  }

  async getDashboardSummary(branchId?: number): Promise<DashboardSummary> {
    return this.repository.getDashboardSummary(branchId);
  }

  async getSalesReport(from?: string, to?: string, branchId?: number, periodo?: string): Promise<SalesReportResult> {
    const range = this.resolveDateRange(from, to, periodo);
    return this.repository.getSalesReport(range.from, range.to, branchId);
  }

  async getDispenserSalesReport(from?: string, to?: string, branchId?: number, periodo?: string) {
    const range = this.resolveDateRange(from, to, periodo);
    return this.repository.getDispenserSalesReport(range.from, range.to, branchId);
  }

  async getPurchasesReport(from?: string, to?: string, branchId?: number, periodo?: string) {
    const range = this.resolveDateRange(from, to, periodo);
    return this.repository.getPurchasesReport(range.from, range.to, branchId);
  }

  async getInventoryStatusReport(branchId?: number) {
    return this.repository.getInventoryStatusReport(branchId);
  }

  async getExitsReport(from?: string, to?: string, branchId?: number, periodo?: string) {
    const range = this.resolveDateRange(from, to, periodo);
    return this.repository.getExitsReport(range.from, range.to, branchId);
  }

  async getTopCustomersReport(limit = 10) {
    return this.repository.getTopCustomersReport(limit);
  }

  neutralizarFormulas(headers: string[], rows: unknown[][]): string {
    return csv(headers, rows);
  }

  private buildPeriodLabel(options: { desde?: string; hasta?: string; periodo?: string; sucursalNombre?: string }): string {
    const parts: string[] = [];
    if (options.desde || options.hasta) {
      parts.push(`Rango: ${options.desde || 'Inicio'} a ${options.hasta || 'Actual'}`);
    } else if (options.periodo && options.periodo !== 'todo') {
      const labels: Record<string, string> = { semana: 'Última semana', mes: 'Mes actual', ano: 'Año actual' };
      parts.push(`Período: ${labels[options.periodo] || options.periodo}`);
    } else {
      parts.push('Período: Histórico completo');
    }
    if (options.sucursalNombre) {
      parts.push(`Sucursal: ${options.sucursalNombre}`);
    }
    return parts.join(' · ');
  }

  private async buildDataset(
    tipo: string,
    options: { desde?: string; hasta?: string; periodo?: string; sucursalId?: number; sucursalNombre?: string },
  ): Promise<ReportExportDataset> {
    if (tipo === 'sucursales') {
      const branches = (await this.repository.listBranchesForReport())
        .filter(branch => !options.sucursalId || branch.id === options.sucursalId);
      return {
        title: 'Directorio de sucursales',
        subtitle: 'Sucursales registradas',
        headers: ['Nombre', 'Estado', 'Teléfono', 'Dirección', 'Correo'],
        rows: branches.map(branch => [
          branch.nombre, branch.activo ? 'Activa' : 'Inactiva', branch.telefono, branch.direccion, branch.correo,
        ]),
        totals: [`Total de sucursales: ${branches.length}`],
      };
    }

    const { from, to } = this.resolveDateRange(options.desde, options.hasta, options.periodo);
    const branchId = options.sucursalId;
    const subtitle = this.buildPeriodLabel({
      desde: from,
      hasta: to,
      periodo: options.periodo,
      sucursalNombre: options.sucursalNombre,
    });

    if (tipo === 'ventas') {
      const data = await this.repository.getSalesReport(from, to, branchId);
      const totalVendido = data.items.reduce((acc, r) => acc + Number(r.total || 0), 0);
      return {
        title: 'Reporte de Ventas y Despachos (CU14)',
        subtitle,
        headers: ['Codigo', 'Fecha', 'Hora', 'Cliente', 'NIT', 'Placa', 'MetodoPago', 'TotalBs', 'Sucursal', 'Cajero'],
        rows: data.items.map(row => [
          row.codigo,
          row.fecha,
          row.hora,
          row.cliente,
          row.nit,
          row.placa,
          row.metodoPago,
          row.total,
          row.sucursal,
          row.cajero,
        ]),
        totals: [`Transacciones: ${data.items.length}`, `Total vendido: Bs. ${totalVendido.toFixed(2)}`],
      };
    }

    if (tipo === 'inventario') {
      const data = await this.repository.getInventoryStatusReport(branchId);
      const totalVal = data.reduce((acc, r) => acc + Number(r.valoracionEstimada || 0), 0);
      const criticos = data.filter(r => r.estadoStock === 'STOCK CRÍTICO' || r.estadoStock === 'AGOTADO').length;
      return {
        title: 'Estado del Inventario Valorado y Stock Mínimo',
        subtitle,
        headers: ['Codigo', 'Producto', 'Stock', 'StockMinimo', 'Unidad', 'PrecioVentaBs', 'Categoria', 'Sucursal', 'Estado', 'ValoracionEstimadaBs'],
        rows: data.map(row => [
          row.codigo,
          row.nombre,
          row.stock,
          row.stockMinimo,
          row.unidad,
          row.precioVenta,
          row.categoria,
          row.sucursal,
          row.estadoStock,
          row.valoracionEstimada,
        ]),
        totals: [`Ítems: ${data.length}`, `En alerta/agotados: ${criticos}`, `Valoración total: Bs. ${totalVal.toFixed(2)}`],
      };
    }

    if (tipo === 'dispensadores') {
      const data = await this.repository.getDispenserSalesReport(from, to, branchId);
      const totalLitros = data.reduce((acc, r) => acc + Number(r.litrosTotales || 0), 0);
      const totalMonto = data.reduce((acc, r) => acc + Number(r.montoTotalBs || 0), 0);
      return {
        title: 'Despacho de Combustibles por Dispensador y Manguera',
        subtitle,
        headers: ['Dispensador', 'Manguera', 'Combustible', 'Sucursal', 'Despachos', 'LitrosTotales', 'MontoTotalBs'],
        rows: data.map(row => [
          row.dispensador,
          row.manguera,
          row.combustible,
          row.sucursal,
          row.despachos,
          row.litrosTotales,
          row.montoTotalBs,
        ]),
        totals: [`Litros totales: ${totalLitros.toFixed(2)} L`, `Recaudación: Bs. ${totalMonto.toFixed(2)}`],
      };
    }

    if (tipo === 'compras') {
      const data = await this.repository.getPurchasesReport(from, to, branchId);
      const totalCompras = data.reduce((acc, r) => acc + Number(r.totalCompras || 0), 0);
      const totalMonto = data.reduce((acc, r) => acc + Number(r.montoTotalBs || 0), 0);
      return {
        title: 'Volumen de Compras por Proveedor',
        subtitle,
        headers: ['Proveedor', 'NIT', 'TotalCompras', 'MontoTotalBs'],
        rows: data.map(row => [row.proveedor, row.proveedorNit, row.totalCompras, row.montoTotalBs]),
        totals: [`Notas de compra: ${totalCompras}`, `Inversión total: Bs. ${totalMonto.toFixed(2)}`],
      };
    }

    if (tipo === 'salidas') {
      const data = await this.repository.getExitsReport(from, to, branchId);
      const totalUnidades = data.reduce((acc, r) => acc + Number(r.cantidadTotalBaja || 0), 0);
      return {
        title: 'Mermas, Vencimientos y Salidas de Inventario',
        subtitle,
        headers: ['Motivo', 'Producto', 'Sucursal', 'Ocurrencias', 'CantidadTotalBaja'],
        rows: data.map(row => [row.motivo, row.producto, row.sucursal, row.registros, row.cantidadTotalBaja]),
        totals: [`Registros agrupados: ${data.length}`, `Unidades dadas de baja: ${totalUnidades}`],
      };
    }

    if (tipo === 'clientes') {
      const data = await this.repository.getTopCustomersReport(50);
      const totalAcumulado = data.reduce((acc, r) => acc + Number(r.totalVentas || 0), 0);
      return {
        title: 'Top Clientes B-SISA y Fidelidad',
        subtitle,
        headers: ['ID', 'Cliente', 'NIT', 'Placa', 'TotalVentas', 'UltimaCompra', 'Sucursal'],
        rows: data.map(row => [row.id, row.nombre, row.nit, row.placa, row.totalVentas, row.ultimaCompra, row.sucursal]),
        totals: [`Clientes listados: ${data.length}`, `Volumen mensual acumulado: Bs. ${totalAcumulado.toFixed(2)}`],
      };
    }

    if (tipo === 'resumen') {
      const summary = await this.repository.getDashboardSummary(branchId);
      const topCombustible = summary.ventasPorCombustible[0];
      return {
        title: 'Resumen Ejecutivo Operativo (KPIs)',
        subtitle,
        headers: ['Indicador', 'Valor', 'Referencia'],
        rows: [
          ['Ventas de hoy (Bs)', Number(summary.ventasHoy || 0).toFixed(2), `${summary.transaccionesHoy || 0} transacciones`],
          ['Ventas del mes (Bs)', Number(summary.ventasMes || 0).toFixed(2), 'Consolidado mensual'],
          ['Litros despachados hoy', Number(summary.litrosDespachadosHoy || 0).toFixed(2), 'Estación de servicio'],
          ['Productos con stock bajo mínimo', summary.alertasStockBajo || 0, 'Alertas activas'],
          ['Dispensadores activos', summary.dispensadoresActivos || 0, 'Pista'],
          [
            'Combustible líder del mes',
            topCombustible ? topCombustible.combustible : 'Sin despachos',
            topCombustible ? `${Number(topCombustible.totalLitros).toFixed(2)} L / Bs. ${Number(topCombustible.totalBs).toFixed(2)}` : 'N/A',
          ],
        ],
        totals: [`Últimas ventas mostradas: ${(summary.ultimasVentas || []).length}`],
      };
    }

    throw new BadRequestException(`Tipo de reporte "${tipo}" no soportado para exportación.`);
  }

  private async prepareExportDataset(
    tipo: string,
    options: { desde?: string; hasta?: string; periodo?: string; sucursalId?: number },
    req?: AuthRequest,
  ): Promise<ReportExportDataset> {
    let sucursalNombre: string | undefined;
    if (options.sucursalId) {
      const branches = await this.repository.listActiveBranches();
      sucursalNombre = branches.find(b => b.id === Number(options.sucursalId))?.nombre;
    }

    const dataset = await this.buildDataset(tipo, { ...options, sucursalNombre });
    if (req?.user) {
      await this.auditWriter.record(req, 'reportes.exportar', 'reporte');
    }
    return dataset;
  }

  async exportCsv(
    tipo: string,
    options: { desde?: string; hasta?: string; periodo?: string; sucursalId?: number },
    req?: AuthRequest,
  ): Promise<string> {
    const dataset = await this.prepareExportDataset(tipo, options, req);
    return this.neutralizarFormulas(dataset.headers, dataset.rows);
  }

  async exportExcel(
    tipo: string,
    options: { desde?: string; hasta?: string; periodo?: string; sucursalId?: number },
    req?: AuthRequest,
  ): Promise<Buffer> {
    const dataset = await this.prepareExportDataset(tipo, options, req);
    return this.documentExporter.toExcel(dataset);
  }

  async exportPdf(
    tipo: string,
    options: { desde?: string; hasta?: string; periodo?: string; sucursalId?: number },
    req?: AuthRequest,
  ): Promise<Buffer> {
    const dataset = await this.prepareExportDataset(tipo, options, req);
    return this.documentExporter.toPdf(dataset);
  }

  getVoiceCommands() {
    return PREDEFINED_VOICE_COMMANDS;
  }

  async transcribeVoice(data: string, mimeType: string) {
    return { transcript: await this.aiAdvisor.transcribe(data, mimeType) };
  }

  async consultWithAi(
    input: {
      prompt: string;
      tipo?: string;
      desde?: string;
      hasta?: string;
      periodo?: string;
      sucursalId?: number;
      viaVoz?: boolean;
    },
    req?: AuthRequest,
  ) {
    const promptText = String(input.prompt || '').trim();
    if (!promptText) {
      throw new BadRequestException('Debe proporcionar una instrucción o consulta de voz para analizar.');
    }

    const branches = await this.repository.listActiveBranches();
    const parsed = parseVoiceReportIntent(promptText, branches);

    const validTabs = new Set(['resumen', 'ventas', 'dispensadores', 'compras', 'inventario', 'salidas', 'clientes']);
    const resolvedTipo = input.tipo && validTabs.has(input.tipo) ? (input.tipo as typeof parsed.tipo) : parsed.tipo;
    const validPeriodos = new Set(['todo', 'semana', 'mes', 'ano']);
    const resolvedPeriodo = input.periodo && validPeriodos.has(input.periodo)
      ? (input.periodo as typeof parsed.periodo)
      : parsed.periodo;
    const resolvedDesde = input.desde || parsed.desde;
    const resolvedHasta = input.hasta || parsed.hasta;
    const resolvedSucursalId =
      parsed.sucursalId !== undefined
        ? parsed.sucursalId
        : input.sucursalId !== undefined
          ? Number(input.sucursalId)
          : undefined;
    const resolvedSucursalNombre = resolvedSucursalId
      ? branches.find(b => b.id === resolvedSucursalId)?.nombre || parsed.sucursalNombre
      : undefined;

    const effectiveIntent = resolvedTipo === 'sucursales' ? {
      tipo: resolvedTipo,
      periodo: 'todo' as const,
      sucursalId: parsed.sucursalId,
      formato: parsed.formato,
      preguntaIa: parsed.preguntaIa,
    } : {
      ...parsed,
      tipo: resolvedTipo,
      periodo: resolvedDesde || resolvedHasta ? ('todo' as const) : resolvedPeriodo,
      desde: resolvedDesde,
      hasta: resolvedHasta,
      sucursalId: resolvedSucursalId,
      sucursalNombre: resolvedSucursalNombre,
    };

    const dataset = await this.buildDataset(effectiveIntent.tipo, effectiveIntent);
    let analysis: AiReportAnalysisResult;
    if (effectiveIntent.tipo === 'sucursales') {
      const names = dataset.rows.map(([name]) => String(name));
      const fields = branchContactFields(promptText);
      const contacts = fields.length ? dataset.rows.map(row => {
        const details = fields.map(field => `${field}: ${row[dataset.headers.indexOf(field)] || 'sin registro'}`);
        return `${row[0]} — ${details.join(', ')}`;
      }) : [];
      const answer = names.length === 0
        ? 'No hay sucursales registradas para esta consulta.'
        : fields.length
          ? `Datos de contacto de ${names.length} sucursal(es).`
          : `Sucursales registradas (${names.length}): ${names.join(', ')}.`;
      analysis = {
        estado: names.length ? 'respondida' : 'sin-datos',
        resumenEjecutivo: answer,
        hallazgos: contacts,
        recomendaciones: [],
        speechText: [answer, ...contacts].join('. '),
        provider: 'local-data',
        model: 'directorio',
        intent: effectiveIntent,
      };
    } else {
      analysis = await this.aiAdvisor.analyze({
        prompt: promptText,
        intent: effectiveIntent,
        summary: await this.repository.getDashboardSummary(resolvedSucursalId),
        dataset,
      });
    }

    if (req?.user) {
      await this.auditWriter.record(req, input.viaVoz ? 'reportes.ia.voz' : 'reportes.ia', 'reporte');
    }

    return {
      ...analysis,
      datasetTitle: dataset.title,
      datasetSubtitle: dataset.subtitle,
      previewHeaders: dataset.headers,
      previewRows: dataset.rows.slice(0, 8),
      totals: dataset.totals || [],
    };
  }

  // Alias de trazabilidad con diagramas UML (CU14)
  obtenerFiltrado(from?: string, to?: string, branchId?: number, periodo?: string) {
    return this.getSalesReport(from, to, branchId, periodo);
  }
  filtrarParametrico(from?: string, to?: string, branchId?: number, periodo?: string) {
    return this.getSalesReport(from, to, branchId, periodo);
  }
}

export const ServicioReporte = ReportsService;
