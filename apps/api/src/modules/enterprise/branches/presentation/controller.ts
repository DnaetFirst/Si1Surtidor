import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../security/auth/presentation/decorators';
import { BranchesService } from '../application/service';
@ApiTags('Sucursales')
@ApiCookieAuth()
@Controller('sucursales')
export class BranchesController {
    constructor(private readonly service: BranchesService) { }
    @Get()
    @RequirePermissions('usuarios.gestionar', 'usuarios.ver', 'usuarios.crear', 'usuarios.editar')
    @ApiOperation({ summary: 'Sucursales existentes para asignación opcional; sin administración en ciclo 1.' })
    obtener() { return this.service.branches(); }

    // Alias para retrocompatibilidad
    list() { return this.obtener(); }
}

// Alias en español para el análisis y defensa de arquitectura
export { BranchesController as ControladorSucursal };

