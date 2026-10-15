import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../../../shared/domain/context';
import { RequirePermissions } from '../../../security/auth/presentation/decorators';
import { CategoryGroupService } from '../application/service';
import { CreateCategoryDto, CreateGroupDto, UpdateCategoryDto, UpdateGroupDto } from './dto';

@ApiTags('Categorías')
@ApiCookieAuth()
@Controller('categorias')
export class CategoryController {
  constructor(private readonly service: CategoryGroupService) {}

  @Get()
  @RequirePermissions('categorias.gestionar')
  async obtener() {
    return this.service.obtenerCategorias();
  }

  @Get(':id')
  @RequirePermissions('categorias.gestionar')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerCategoriaPorId(id);
  }

  @Post()
  @RequirePermissions('categorias.gestionar')
  async crear(@Body() dto: CreateCategoryDto, @Req() req: AuthRequest) {
    return this.service.crearCategoria(dto, req);
  }

  @Patch(':id')
  @RequirePermissions('categorias.gestionar')
  async modificar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
    @Req() req: AuthRequest
  ) {
    return this.service.modificarCategoria(id, dto, req);
  }

  @Delete(':id')
  @RequirePermissions('categorias.gestionar')
  async eliminar(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.eliminarCategoria(id, req);
  }

  // Alias para retrocompatibilidad
  async list() { return this.obtener(); }
  async detail(id: number) { return this.obtenerPorId(id); }
  async create(dto: CreateCategoryDto, req: AuthRequest) { return this.crear(dto, req); }
  async update(id: number, dto: UpdateCategoryDto, req: AuthRequest) { return this.modificar(id, dto, req); }
  async remove(id: number, req: AuthRequest) { return this.eliminar(id, req); }
}

@ApiTags('Grupos')
@ApiCookieAuth()
@Controller('grupos')
export class GroupController {
  constructor(private readonly service: CategoryGroupService) {}

  @Get()
  @RequirePermissions('grupos.gestionar')
  async obtener() {
    return this.service.obtenerGrupos();
  }

  @Get(':id')
  @RequirePermissions('grupos.gestionar')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerGrupoPorId(id);
  }

  @Post()
  @RequirePermissions('grupos.gestionar')
  async crear(@Body() dto: CreateGroupDto, @Req() req: AuthRequest) {
    return this.service.crearGrupo(dto, req);
  }

  @Patch(':id')
  @RequirePermissions('grupos.gestionar')
  async modificar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGroupDto,
    @Req() req: AuthRequest
  ) {
    return this.service.modificarGrupo(id, dto, req);
  }

  @Delete(':id')
  @RequirePermissions('grupos.gestionar')
  async eliminar(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.eliminarGrupo(id, req);
  }

  // Alias para retrocompatibilidad
  async list() { return this.obtener(); }
  async detail(id: number) { return this.obtenerPorId(id); }
  async create(dto: CreateGroupDto, req: AuthRequest) { return this.crear(dto, req); }
  async update(id: number, dto: UpdateGroupDto, req: AuthRequest) { return this.modificar(id, dto, req); }
  async remove(id: number, req: AuthRequest) { return this.eliminar(id, req); }
}

// Alias en español para el análisis y defensa de arquitectura
export { CategoryController as ControladorCategoria, GroupController as ControladorGrupo };

