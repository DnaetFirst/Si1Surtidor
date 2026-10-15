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
  async list() {
    return this.service.list();
  }

  @Get(':id')
  @RequirePermissions('combustibles.gestionar')
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.get(id);
  }

  @Post()
  @RequirePermissions('combustibles.gestionar')
  async create(@Body() dto: CreateFuelDto, @Req() req: AuthRequest) {
    return this.service.create(dto, req);
  }

  @Patch(':id')
  @RequirePermissions('combustibles.gestionar')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFuelDto,
    @Req() req: AuthRequest
  ) {
    return this.service.update(id, dto, req);
  }

  @Delete(':id')
  @RequirePermissions('combustibles.gestionar')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.delete(id, req);
  }
}
