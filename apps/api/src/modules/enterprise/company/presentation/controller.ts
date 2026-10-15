import { Body, Controller, Get, Patch, Post, Req, Res } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthRequest } from '../../../../shared/domain/context';
import { RequirePermissions } from '../../../security/auth/presentation/decorators';
import { CompanyService } from '../application/service';
import { CompanyDto, UpdateCompanyDto } from './dto';
@ApiTags('Empresa')
@ApiCookieAuth()
@Controller('empresa')
export class CompanyController {
    constructor(private readonly service: CompanyService) { }
    @Get()
    @RequirePermissions('empresa.gestionar', 'empresa.ver', 'empresa.editar')
    async obtener(
    @Res()
    response: Response) { response.json(await this.service.company()); }
    @Post()
    @RequirePermissions('empresa.gestionar', 'empresa.crear')
    crear(
    @Body()
    dto: CompanyDto,
    @Req()
    req: AuthRequest) { return this.service.createCompany(dto, req); }
    @Patch()
    @RequirePermissions('empresa.gestionar', 'empresa.editar')
    modificar(
    @Body()
    dto: UpdateCompanyDto,
    @Req()
    req: AuthRequest) { return this.service.updateCompany(dto, req); }

    // Alias para retrocompatibilidad
    async detail(response: Response) { return this.obtener(response); }
    create(dto: CompanyDto, req: AuthRequest) { return this.crear(dto, req); }
    update(dto: UpdateCompanyDto, req: AuthRequest) { return this.modificar(dto, req); }
}

// Alias en español para el análisis y defensa de arquitectura
export { CompanyController as ControladorEmpresa };

