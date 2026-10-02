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
    async detail(
    @Res()
    response: Response) { response.json(await this.service.company()); }
    @Post()
    @RequirePermissions('empresa.gestionar', 'empresa.crear')
    create(
    @Body()
    dto: CompanyDto,
    @Req()
    req: AuthRequest) { return this.service.createCompany(dto, req); }
    @Patch()
    @RequirePermissions('empresa.gestionar', 'empresa.editar')
    update(
    @Body()
    dto: UpdateCompanyDto,
    @Req()
    req: AuthRequest) { return this.service.updateCompany(dto, req); }
}
