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
  async list() {
    return this.service.listCategories();
  }

  @Get(':id')
  @RequirePermissions('categorias.gestionar')
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getCategory(id);
  }

  @Post()
  @RequirePermissions('categorias.gestionar')
  async create(@Body() dto: CreateCategoryDto, @Req() req: AuthRequest) {
    return this.service.createCategory(dto, req);
  }

  @Patch(':id')
  @RequirePermissions('categorias.gestionar')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
    @Req() req: AuthRequest
  ) {
    return this.service.updateCategory(id, dto, req);
  }

  @Delete(':id')
  @RequirePermissions('categorias.gestionar')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.deleteCategory(id, req);
  }
}

@ApiTags('Grupos')
@ApiCookieAuth()
@Controller('grupos')
export class GroupController {
  constructor(private readonly service: CategoryGroupService) {}

  @Get()
  @RequirePermissions('grupos.gestionar')
  async list() {
    return this.service.listGroups();
  }

  @Get(':id')
  @RequirePermissions('grupos.gestionar')
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getGroup(id);
  }

  @Post()
  @RequirePermissions('grupos.gestionar')
  async create(@Body() dto: CreateGroupDto, @Req() req: AuthRequest) {
    return this.service.createGroup(dto, req);
  }

  @Patch(':id')
  @RequirePermissions('grupos.gestionar')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGroupDto,
    @Req() req: AuthRequest
  ) {
    return this.service.updateGroup(id, dto, req);
  }

  @Delete(':id')
  @RequirePermissions('grupos.gestionar')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.deleteGroup(id, req);
  }
}
