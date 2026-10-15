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
  async list() {
    return this.service.list();
  }

  @Get(':id')
  @RequirePermissions('productos.gestionar')
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.get(id);
  }

  @Post()
  @RequirePermissions('productos.gestionar')
  async create(@Body() dto: CreateProductDto, @Req() req: AuthRequest) {
    return this.service.create(dto, req);
  }

  @Patch(':id')
  @RequirePermissions('productos.gestionar')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @Req() req: AuthRequest
  ) {
    return this.service.update(id, dto, req);
  }

  @Delete(':id')
  @RequirePermissions('productos.gestionar')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.delete(id, req);
  }
}
