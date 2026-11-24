import { Injectable } from '@nestjs/common';
import { AuditWriter, AuthRequest } from '../../../shared/domain/context';
import { csv } from '../../../shared/domain/csv';
import { BadRequestException } from '../../../shared/domain/errors';
import { assertReportDateRange, reportCalendarRange } from '../domain/calendar';
import { DashboardSummary, SalesReportResult } from '../domain/models';
import { ReportsRepository } from '../domain/repository';

/**
 * CU14. Gestionar reportes (Actores: ASU, ATI, GG, GS).
 * Consultas tabulares, filtrado paramétrico por período (semana|mes|ano) y exportación CSV neutralizada.
 */
@Injectable()
export class ReportsService {
  constructor(
    private readonly repository: ReportsRepository,
    private readonly auditWriter: AuditWriter,
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

  async exportCsv(
    tipo: string,
    options: { desde?: string; hasta?: string; periodo?: string; sucursalId?: number },
    req?: AuthRequest,
  ): Promise<string> {
    const { from, to } = this.resolveDateRange(options.desde, options.hasta, options.periodo);
    const branchId = options.sucursalId;
    let content = '';

    if (tipo === 'ventas') {
      const data = await this.repository.getSalesReport(from, to, branchId);
      content = this.neutralizarFormulas(
        ['Codigo', 'Fecha', 'Hora', 'Cliente', 'NIT', 'Placa', 'MetodoPago', 'TotalBs', 'Sucursal', 'Cajero'],
        data.items.map(row => [row.codigo, row.fecha, row.hora, row.cliente, row.nit, row.placa, row.metodoPago, row.total, row.sucursal, row.cajero]),
      );
    } else if (tipo === 'inventario') {
      const data = await this.repository.getInventoryStatusReport(branchId);
      content = this.neutralizarFormulas(
        ['Codigo', 'Producto', 'Stock', 'StockMinimo', 'Unidad', 'PrecioVentaBs', 'Categoria', 'Sucursal', 'Estado', 'ValoracionEstimadaBs'],
        data.map(row => [row.codigo, row.nombre, row.stock, row.stockMinimo, row.unidad, row.precioVenta, row.categoria, row.sucursal, row.estadoStock, row.valoracionEstimada]),
      );
    } else if (tipo === 'dispensadores') {
      const data = await this.repository.getDispenserSalesReport(from, to, branchId);
      content = this.neutralizarFormulas(
        ['Dispensador', 'Manguera', 'Combustible', 'Sucursal', 'Despachos', 'LitrosTotales', 'MontoTotalBs'],
        data.map(row => [row.dispensador, row.manguera, row.combustible, row.sucursal, row.despachos, row.litrosTotales, row.montoTotalBs]),
      );
    } else if (tipo === 'compras') {
      const data = await this.repository.getPurchasesReport(from, to, branchId);
      content = this.neutralizarFormulas(
        ['Proveedor', 'NIT', 'TotalCompras', 'MontoTotalBs'],
        data.map(row => [row.proveedor, row.proveedorNit, row.totalCompras, row.montoTotalBs]),
      );
    } else if (tipo === 'salidas') {
      const data = await this.repository.getExitsReport(from, to, branchId);
      content = this.neutralizarFormulas(
        ['Motivo', 'Producto', 'Sucursal', 'Ocurrencias', 'CantidadTotalBaja'],
        data.map(row => [row.motivo, row.producto, row.sucursal, row.registros, row.cantidadTotalBaja]),
      );
    } else if (tipo === 'clientes') {
      const data = await this.repository.getTopCustomersReport(50);
      content = this.neutralizarFormulas(
        ['ID', 'Cliente', 'NIT', 'Placa', 'TotalVentas', 'UltimaCompra', 'Sucursal'],
        data.map(row => [row.id, row.nombre, row.nit, row.placa, row.totalVentas, row.ultimaCompra, row.sucursal]),
      );
    } else {
      throw new BadRequestException(`Tipo de reporte "${tipo}" no soportado para exportación CSV.`);
    }

    if (req?.user) {
      await this.auditWriter.record(req, 'reportes.exportar', 'reporte');
    }

    return content;
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
