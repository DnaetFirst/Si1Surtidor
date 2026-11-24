import { Controller, Get, Header, Query, Req, Res } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthRequest } from '../../../shared/domain/context';
import { RequirePermissions } from '../../security/auth/presentation/decorators';
import { ReportsService } from '../application/service';

/**
 * CU14. Gestionar reportes (Diagramas UML: ReportController / Audit / ReportController).
 */
@ApiTags('Reportes')
@ApiCookieAuth()
@Controller('reportes')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('resumen')
  @RequirePermissions('reportes.ver', 'reportes.gestionar', 'ventas.ver')
  @ApiOperation({ summary: 'Obtener métricas y KPIs clave para el Dashboard principal.' })
  resumen(@Query('sucursalId') sucursalId?: number) {
    return this.service.getDashboardSummary(sucursalId ? Number(sucursalId) : undefined);
  }

  @Get('ventas')
  @RequirePermissions('reportes.ver', 'reportes.gestionar', 'ventas.ver')
  @ApiOperation({ summary: 'Reporte consolidado de ventas por rango de fechas o período.' })
  ventas(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('sucursalId') sucursalId?: number,
    @Query('periodo') periodo?: string,
  ) {
    return this.service.getSalesReport(desde, hasta, sucursalId ? Number(sucursalId) : undefined, periodo);
  }

  @Get('dispensadores')
  @RequirePermissions('reportes.ver', 'reportes.gestionar', 'dispensadores.ver')
  @ApiOperation({ summary: 'Reporte de ventas de combustible por dispensador y manguera.' })
  dispensadores(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('sucursalId') sucursalId?: number,
    @Query('periodo') periodo?: string,
  ) {
    return this.service.getDispenserSalesReport(desde, hasta, sucursalId ? Number(sucursalId) : undefined, periodo);
  }

  @Get('compras')
  @RequirePermissions('reportes.ver', 'reportes.gestionar', 'compras.ver')
  @ApiOperation({ summary: 'Reporte de compras agrupadas por proveedor.' })
  compras(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('sucursalId') sucursalId?: number,
    @Query('periodo') periodo?: string,
  ) {
    return this.service.getPurchasesReport(desde, hasta, sucursalId ? Number(sucursalId) : undefined, periodo);
  }

  @Get('inventario')
  @RequirePermissions('reportes.ver', 'reportes.gestionar', 'productos.ver')
  @ApiOperation({ summary: 'Reporte del estado del inventario valorado y niveles de stock.' })
  inventario(@Query('sucursalId') sucursalId?: number) {
    return this.service.getInventoryStatusReport(sucursalId ? Number(sucursalId) : undefined);
  }

  @Get('salidas')
  @RequirePermissions('reportes.ver', 'reportes.gestionar', 'salidas.ver')
  @ApiOperation({ summary: 'Reporte de salidas y mermas de productos.' })
  salidas(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('sucursalId') sucursalId?: number,
    @Query('periodo') periodo?: string,
  ) {
    return this.service.getExitsReport(desde, hasta, sucursalId ? Number(sucursalId) : undefined, periodo);
  }

  @Get('clientes')
  @RequirePermissions('reportes.ver', 'reportes.gestionar', 'ventas.ver')
  @ApiOperation({ summary: 'Ranking de clientes por volumen de compra y fidelidad.' })
  clientes(@Query('limite') limite?: number) {
    return this.service.getTopCustomersReport(limite ? Number(limite) : 10);
  }

  @Get('exportar-csv')
  @RequirePermissions('reportes.ver', 'reportes.gestionar', 'reportes.exportar')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiProduces('text/csv')
  @ApiOperation({ summary: 'Descargar datos de reportes en formato CSV con neutralización de fórmulas.' })
  async exportarCsv(
    @Query('tipo') tipo: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('sucursalId') sucursalId?: number,
    @Query('periodo') periodo?: string,
    @Req() req?: AuthRequest,
    @Res() res?: Response,
  ) {
    const filename = `reporte_${tipo || 'general'}_${new Date().toISOString().split('T')[0]}.csv`;
    const csvData = await this.service.exportCsv(
      tipo,
      { desde, hasta, periodo, sucursalId: sucursalId ? Number(sucursalId) : undefined },
      req,
    );

    if (res) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csvData);
    }
    return csvData;
  }

  @Get('exportar/csv')
  @RequirePermissions('reportes.ver', 'reportes.gestionar', 'reportes.exportar')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiProduces('text/csv')
  exportarCsvAlias(
    @Query('tipo') tipo: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('sucursalId') sucursalId?: number,
    @Query('periodo') periodo?: string,
    @Req() req?: AuthRequest,
    @Res() res?: Response,
  ) {
    return this.exportarCsv(tipo, desde, hasta, sucursalId, periodo, req, res);
  }

  // Alias de métodos para trazabilidad con diagramas UML (CU14)
  ObtenerFiltrado(desde?: string, hasta?: string, sucursalId?: number, periodo?: string) {
    return this.ventas(desde, hasta, sucursalId, periodo);
  }
  FiltrarParametrico(desde?: string, hasta?: string, sucursalId?: number, periodo?: string) {
    return this.ventas(desde, hasta, sucursalId, periodo);
  }
  ExportarCSV(tipo: string, desde?: string, hasta?: string, sucursalId?: number, periodo?: string, req?: AuthRequest, res?: Response) {
    return this.exportarCsv(tipo, desde, hasta, sucursalId, periodo, req, res);
  }
  NeutralizarFormulas(headers: string[], rows: unknown[][]) {
    return this.service.neutralizarFormulas(headers, rows);
  }
}

export const ReportController = ReportsController;
export const ControladorReporte = ReportsController;
