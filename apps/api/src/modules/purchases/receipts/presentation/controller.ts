import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../../../shared/domain/context';
import { ListQuery } from '../../../../shared/presentation/list-query.dto';
import { RequirePermissions } from '../../../security/auth/presentation/decorators';
import { PurchaseReceiptService } from '../application/service';
import { CreatePurchaseReceiptDto, UpdatePurchaseReceiptDto } from './dto';

/**
 * CU10. Gestionar compras (Diagramas UML: BuyController / CompraController / PurchaseController).
 */
@ApiTags('Compras / Recepciones')
@ApiCookieAuth()
@Controller('compras')
export class PurchaseReceiptsController {
  constructor(private readonly service: PurchaseReceiptService) {}

  @Get()
  @RequirePermissions('compras.gestionar', 'compras.ver')
  @ApiOperation({ summary: 'Listar notas de compra (recepciones).' })
  obtener(@Query() query: ListQuery, @Query('sucursalId') sucursalId?: number) {
    return this.service.obtener(query, sucursalId ? Number(sucursalId) : undefined);
  }

  @Get('lotes')
  @RequirePermissions('compras.gestionar', 'compras.ver')
  @ApiOperation({ summary: 'Listar lotes de inventario ingresados por compras.' })
  obtenerLotes(@Query() query: ListQuery, @Query('productoId') productoId?: number) {
    return this.service.obtenerLotes(query, productoId ? Number(productoId) : undefined);
  }

  @Get(':id')
  @RequirePermissions('compras.gestionar', 'compras.ver')
  @ApiOperation({ summary: 'Obtener detalle de una nota de compra con lotes e ítems.' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerPorId(id);
  }

  @Post()
  @RequirePermissions('compras.gestionar', 'compras.crear')
  @ApiOperation({ summary: 'Registrar nueva compra/recepción con incremento de stock y lotes.' })
  crear(@Body() dto: CreatePurchaseReceiptDto, @Req() req: AuthRequest) {
    return this.service.crear(dto, req);
  }

  @Patch(':id')
  @RequirePermissions('compras.gestionar', 'compras.editar')
  @ApiOperation({ summary: 'Editar glosa o moneda de una nota de compra.' })
  editar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePurchaseReceiptDto, @Req() req: AuthRequest) {
    return this.service.editar(id, dto, req);
  }

  @Put(':id')
  @RequirePermissions('compras.gestionar', 'compras.editar')
  @ApiOperation({ summary: 'Actualizar nota de compra (alias PUT).' })
  actualizarPut(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePurchaseReceiptDto, @Req() req: AuthRequest) {
    return this.service.editar(id, dto, req);
  }

  @Post(':id/anular')
  @HttpCode(200)
  @RequirePermissions('compras.gestionar', 'compras.deshabilitar')
  @ApiOperation({ summary: 'Anular recepción mediante reversión trazable de stock y lotes.' })
  anular(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.anular(id, req);
  }

  // Alias de métodos para trazabilidad con diagramas UML (CU10)
  Crear(dto: CreatePurchaseReceiptDto, req: AuthRequest) { return this.crear(dto, req); }
  Editar(id: number, dto: UpdatePurchaseReceiptDto, req: AuthRequest) { return this.editar(id, dto, req); }
  Obtener(query: ListQuery, sucursalId?: number) { return this.obtener(query, sucursalId); }
  CrearCompra(dto: CreatePurchaseReceiptDto, req: AuthRequest) { return this.crear(dto, req); }
}

// Alias exactos para documentación y defensa (CU10)
export const ControladorNotaCompra = PurchaseReceiptsController;
export const BuyController = PurchaseReceiptsController;
export const CompraController = PurchaseReceiptsController;
export const PurchaseController = PurchaseReceiptsController;
