import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../../../shared/domain/context';
import { RequirePermissions } from '../../../security/auth/presentation/decorators';
import { FuelService } from '../application/service';
import { CreateFuelDto, UpdateFuelDto } from './dto';

@ApiTags('Combustibles')
@ApiCookieAuth()
@Controller('combustibles')
export class FuelController {
  constructor(private readonly service: FuelService) {}

  @Get()
  @RequirePermissions('combustibles.gestionar')
  async obtener() {
    return this.service.obtener();
  }

  @Get(':id')
  @RequirePermissions('combustibles.gestionar')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerPorId(id);
  }

  @Post()
  @RequirePermissions('combustibles.gestionar')
  async crear(@Body() dto: CreateFuelDto, @Req() req: AuthRequest) {
    return this.service.crear(dto, req);
  }

  @Patch(':id')
  @RequirePermissions('combustibles.gestionar')
  async modificar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFuelDto,
    @Req() req: AuthRequest
  ) {
    return this.service.modificar(id, dto, req);
  }

  @Delete(':id')
  @RequirePermissions('combustibles.gestionar')
  async eliminar(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.eliminar(id, req);
  }

  // Alias para retrocompatibilidad
  async list() { return this.obtener(); }
  async detail(id: number) { return this.obtenerPorId(id); }
  async create(dto: CreateFuelDto, req: AuthRequest) { return this.crear(dto, req); }
  async update(id: number, dto: UpdateFuelDto, req: AuthRequest) { return this.modificar(id, dto, req); }
  async remove(id: number, req: AuthRequest) { return this.eliminar(id, req); }
}

// Alias en español para el análisis y defensa de arquitectura
export { FuelController as ControladorCombustible };

