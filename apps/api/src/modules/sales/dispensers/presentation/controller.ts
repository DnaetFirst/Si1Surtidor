import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../../../shared/domain/context';
import { ListQuery } from '../../../../shared/presentation/list-query.dto';
import { RequirePermissions } from '../../../security/auth/presentation/decorators';
import { DispenserService } from '../application/service';
import { CreateDispenserDto, CreateHoseDto, UpdateDispenserDto, UpdateHoseDto } from './dto';

/**
 * CU7. Gestionar dispensadores (Diagrama de Comunicación / Análisis / Secuencia: DispenserController).
 */
@ApiTags('Dispensadores')
@ApiCookieAuth()
@Controller('dispensadores')
export class DispensersController {
  constructor(private readonly service: DispenserService) {}

  @Get()
  @RequirePermissions('dispensadores.gestionar', 'dispensadores.ver')
  @ApiOperation({ summary: 'Listar dispensadores y sus mangueras activas.' })
  obtener(@Query() query: ListQuery, @Req() req: AuthRequest) {
    return this.service.obtener(query, req);
  }

  @Get(':id')
  @RequirePermissions('dispensadores.gestionar', 'dispensadores.ver')
  @ApiOperation({ summary: 'Obtener detalle de un dispensador por ID.' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerPorId(id);
  }

  @Post()
  @RequirePermissions('dispensadores.gestionar', 'dispensadores.crear')
  @ApiOperation({ summary: 'Registrar nuevo dispensador en una sucursal.' })
  crear(@Body() dto: CreateDispenserDto, @Req() req: AuthRequest) {
    return this.service.crear(dto, req);
  }

  @Patch(':id')
  @RequirePermissions('dispensadores.gestionar', 'dispensadores.editar')
  @ApiOperation({ summary: 'Modificar datos del dispensador.' })
  modificar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDispenserDto, @Req() req: AuthRequest) {
    return this.service.modificar(id, dto, req);
  }

  @Put(':id')
  @RequirePermissions('dispensadores.gestionar', 'dispensadores.editar')
  @ApiOperation({ summary: 'Actualizar dispensador (alias PUT de diagrama de secuencia CU7).' })
  actualizarPut(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDispenserDto, @Req() req: AuthRequest) {
    return this.service.modificar(id, dto, req);
  }

  @Post(':id/deshabilitar')
  @HttpCode(200)
  @RequirePermissions('dispensadores.gestionar', 'dispensadores.deshabilitar')
  @ApiOperation({ summary: 'Deshabilitar dispensador.' })
  deshabilitar(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.deshabilitar(id, req);
  }

  @Delete(':id')
  @RequirePermissions('dispensadores.gestionar', 'dispensadores.deshabilitar')
  @ApiOperation({ summary: 'Deshabilitar dispensador mediante DELETE.' })
  eliminar(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.deshabilitar(id, req);
  }

  @Post(':id/mangueras')
  @RequirePermissions('dispensadores.gestionar', 'dispensadores.crear')
  @ApiOperation({ summary: 'Agregar manguera de combustible a un dispensador.' })
  agregarManguera(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateHoseDto, @Req() req: AuthRequest) {
    return this.service.agregarManguera(id, dto, req);
  }

  @Patch('mangueras/:hoseId')
  @RequirePermissions('dispensadores.gestionar', 'dispensadores.editar')
  @ApiOperation({ summary: 'Modificar manguera.' })
  modificarManguera(@Param('hoseId', ParseIntPipe) hoseId: number, @Body() dto: UpdateHoseDto, @Req() req: AuthRequest) {
    return this.service.modificarManguera(hoseId, dto, req);
  }

  @Delete('mangueras/:hoseId')
  @RequirePermissions('dispensadores.gestionar', 'dispensadores.deshabilitar')
  @ApiOperation({ summary: 'Deshabilitar manguera.' })
  deshabilitarManguera(@Param('hoseId', ParseIntPipe) hoseId: number, @Req() req: AuthRequest) {
    return this.service.deshabilitarManguera(hoseId, req);
  }

  // Alias de métodos para trazabilidad con diagramas UML (CU7)
  Crear(dto: CreateDispenserDto, req: AuthRequest) { return this.crear(dto, req); }
  Modificar(id: number, dto: UpdateDispenserDto, req: AuthRequest) { return this.modificar(id, dto, req); }
  Eliminar(id: number, req: AuthRequest) { return this.eliminar(id, req); }
  Obtener(query: ListQuery, req: AuthRequest) { return this.obtener(query, req); }
  AgregarDispensador(dto: CreateDispenserDto, req: AuthRequest) { return this.crear(dto, req); }
  ModificarDispensador(id: number, dto: UpdateDispenserDto, req: AuthRequest) { return this.modificar(id, dto, req); }
  EliminarDispensador(id: number, req: AuthRequest) { return this.eliminar(id, req); }
  ObtenerDispensador(query: ListQuery, req: AuthRequest) { return this.obtener(query, req); }
}

// Alias exactos para documentación y defensa (CU7)
export { DispensersController as ControladorDispensador };
export { DispensersController as DispenserController };
