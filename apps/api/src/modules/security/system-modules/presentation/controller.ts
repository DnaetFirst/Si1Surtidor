import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../../../shared/domain/context';
import { RequirePermissions } from '../../auth/presentation/decorators';
import { SystemModuleService } from '../application/service';
import { CreateSystemModuleDto, UpdateSystemModuleDto } from './dto';

@ApiTags('Módulos del Sistema')
@ApiCookieAuth()
@Controller('modulos')
export class SystemModuleController {
  constructor(private readonly service: SystemModuleService) {}

  @Get()
  @RequirePermissions('modulos.gestionar')
  async obtener() {
    return this.service.obtener();
  }

  @Get(':id')
  @RequirePermissions('modulos.gestionar')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerPorId(id);
  }

  @Post()
  @RequirePermissions('modulos.gestionar')
  async crear(@Body() dto: CreateSystemModuleDto, @Req() req: AuthRequest) {
    return this.service.crear(dto, req);
  }

  @Patch(':id')
  @RequirePermissions('modulos.gestionar')
  async modificar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemModuleDto,
    @Req() req: AuthRequest
  ) {
    return this.service.modificar(id, dto, req);
  }

  @Delete(':id')
  @RequirePermissions('modulos.gestionar')
  async eliminar(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.eliminar(id, req);
  }

  // Alias para retrocompatibilidad
  async list() { return this.obtener(); }
  async detail(id: number) { return this.obtenerPorId(id); }
  async create(dto: CreateSystemModuleDto, req: AuthRequest) { return this.crear(dto, req); }
  async update(id: number, dto: UpdateSystemModuleDto, req: AuthRequest) { return this.modificar(id, dto, req); }
  async remove(id: number, req: AuthRequest) { return this.eliminar(id, req); }
}

// Alias en español para el análisis y defensa de arquitectura
export { SystemModuleController as ControladorModuloSistema };

