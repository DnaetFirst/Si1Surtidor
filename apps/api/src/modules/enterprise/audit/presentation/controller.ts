import { Body, Controller, Get, HttpCode, Post, Query, Req, Res } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthRequest } from '../../../../shared/domain/context';
import { RequirePermissions } from '../../../security/auth/presentation/decorators';
import { AuditService } from '../application/service';
import { ArchiveDto, AuditQuery } from './dto';
@ApiTags('Bitácora')
@ApiCookieAuth()
@Controller('bitacora')
export class AuditController {
    constructor(private readonly service: AuditService) { }
    @Get('exportar')
    @RequirePermissions('bitacora.exportar')
    @ApiProduces('text/csv')
    @ApiOperation({ summary: 'Exporta todos los registros filtrados, sin límite de paginación.' })
    async export(
    @Query()
    query: AuditQuery,
    @Req()
    req: AuthRequest,
    @Res()
    res: Response) {
        const content = await this.service.exportAudit(query, req);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="bitacora.csv"');
        res.send(content);
    }
    @Get()
    @RequirePermissions('bitacora.ver')
    list(
    @Query()
    query: AuditQuery) { return this.service.auditRecords(query); }
    @Post('archivar')
    @HttpCode(200)
    @RequirePermissions('bitacora.archivar')
    @ApiOperation({ summary: 'Archiva eventos por rango inclusivo; conserva su contenido para consulta.' })
    archive(
    @Body()
    dto: ArchiveDto,
    @Req()
    req: AuthRequest) { return this.service.archive(dto, req); }
}
