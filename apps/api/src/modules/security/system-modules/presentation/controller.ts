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
  async list() {
    return this.service.list();
  }

  @Get(':id')
  @RequirePermissions('modulos.gestionar')
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.get(id);
  }

  @Post()
  @RequirePermissions('modulos.gestionar')
  async create(@Body() dto: CreateSystemModuleDto, @Req() req: AuthRequest) {
    return this.service.create(dto, req);
  }

  @Patch(':id')
  @RequirePermissions('modulos.gestionar')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemModuleDto,
    @Req() req: AuthRequest
  ) {
    return this.service.update(id, dto, req);
  }

  @Delete(':id')
  @RequirePermissions('modulos.gestionar')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.delete(id, req);
  }
}
