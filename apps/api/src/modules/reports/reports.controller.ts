import { Controller, Get, Header, Query, Res } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { RequirePermissions } from '../security/auth/presentation/decorators';
import { ReportsService } from './reports.service';

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
  @ApiOperation({ summary: 'Reporte consolidado de ventas por rango de fechas.' })
  ventas(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('sucursalId') sucursalId?: number,
  ) {
    return this.service.getSalesReport(desde, hasta, sucursalId ? Number(sucursalId) : undefined);
  }

  @Get('dispensadores')
  @RequirePermissions('reportes.ver', 'reportes.gestionar', 'dispensadores.ver')
  @ApiOperation({ summary: 'Reporte de ventas de combustible por dispensador y manguera.' })
  dispensadores(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('sucursalId') sucursalId?: number,
  ) {
    return this.service.getDispenserSalesReport(desde, hasta, sucursalId ? Number(sucursalId) : undefined);
  }

  @Get('compras')
  @RequirePermissions('reportes.ver', 'reportes.gestionar', 'compras.ver')
  @ApiOperation({ summary: 'Reporte de compras agrupadas por proveedor.' })
  compras(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('sucursalId') sucursalId?: number,
  ) {
    return this.service.getPurchasesReport(desde, hasta, sucursalId ? Number(sucursalId) : undefined);
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
  ) {
    return this.service.getExitsReport(desde, hasta, sucursalId ? Number(sucursalId) : undefined);
  }

  @Get('clientes')
  @RequirePermissions('reportes.ver', 'reportes.gestionar', 'ventas.ver')
  @ApiOperation({ summary: 'Ranking de clientes por volumen de compra y fidelidad.' })
  clientes(@Query('limite') limite?: number) {
    return this.service.getTopCustomersReport(limite ? Number(limite) : 10);
  }

  @Get('exportar-csv')
  @RequirePermissions('reportes.ver', 'reportes.gestionar')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiOperation({ summary: 'Descargar datos de reportes en formato CSV estructurado.' })
  async exportarCsv(
    @Query('tipo') tipo: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('sucursalId') sucursalId?: number,
    @Res() res?: Response,
  ) {
    let filename = `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.csv`;
    let csvData = '';

    if (tipo === 'ventas') {
      const data = await this.service.getSalesReport(desde, hasta, sucursalId ? Number(sucursalId) : undefined);
      csvData = 'Codigo,Fecha,Hora,Cliente,NIT,Placa,MetodoPago,TotalBs,Sucursal,Cajero\n';
      for (const row of data.items) {
        csvData += `"${row.codigo}","${row.fecha}","${row.hora}","${row.cliente}","${row.nit}","${row.placa}","${row.metodoPago}",${row.total},"${row.sucursal}","${row.cajero}"\n`;
      }
    } else if (tipo === 'inventario') {
      const data = await this.service.getInventoryStatusReport(sucursalId ? Number(sucursalId) : undefined);
      csvData = 'Codigo,Producto,Stock,StockMinimo,Unidad,PrecioVentaBs,Categoria,Sucursal,Estado,ValoracionEstimadaBs\n';
      for (const row of data) {
        csvData += `"${row.codigo}","${row.nombre}",${row.stock},${row.stockMinimo},"${row.unidad}",${row.precioVenta},"${row.categoria}","${row.sucursal}","${row.estadoStock}",${row.valoracionEstimada}\n`;
      }
    } else {
      csvData = 'Tipo de reporte no soportado para exportación directa.\n';
    }

    if (res) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csvData);
    }
    return csvData;
  }

  @Get('exportar/csv')
  @RequirePermissions('reportes.ver', 'reportes.gestionar')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  exportarCsvAlias(
    @Query('tipo') tipo: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('sucursalId') sucursalId?: number,
    @Res() res?: Response,
  ) {
    return this.exportarCsv(tipo, desde, hasta, sucursalId, res);
  }
}
