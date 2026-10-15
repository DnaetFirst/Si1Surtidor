import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../../../shared/domain/context';
import { RequirePermissions } from '../../../security/auth/presentation/decorators';
import { ProductService } from '../application/service';
import { CreateProductDto, UpdateProductDto } from './dto';

@ApiTags('Productos')
@ApiCookieAuth()
@Controller('productos')
export class ProductController {
  constructor(private readonly service: ProductService) {}

  @Get()
  @RequirePermissions('productos.gestionar')
  async obtener() {
    return this.service.obtener();
  }

  @Get(':id')
  @RequirePermissions('productos.gestionar')
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerPorId(id);
  }

  @Post()
  @RequirePermissions('productos.gestionar')
  async crear(@Body() dto: CreateProductDto, @Req() req: AuthRequest) {
    return this.service.crear(dto, req);
  }

  @Patch(':id')
  @RequirePermissions('productos.gestionar')
  async modificar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @Req() req: AuthRequest
  ) {
    return this.service.modificar(id, dto, req);
  }

  @Delete(':id')
  @RequirePermissions('productos.gestionar')
  async eliminar(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.eliminar(id, req);
  }

  // Alias para retrocompatibilidad
  async list() { return this.obtener(); }
  async detail(id: number) { return this.obtenerPorId(id); }
  async create(dto: CreateProductDto, req: AuthRequest) { return this.crear(dto, req); }
  async update(id: number, dto: UpdateProductDto, req: AuthRequest) { return this.modificar(id, dto, req); }
  async remove(id: number, req: AuthRequest) { return this.eliminar(id, req); }
}

// Alias en español para el análisis y defensa de arquitectura
export { ProductController as ControladorProducto };

