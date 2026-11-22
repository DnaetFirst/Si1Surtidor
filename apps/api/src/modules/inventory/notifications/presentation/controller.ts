import { Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../../../shared/domain/context';
import { ListQuery } from '../../../../shared/presentation/list-query.dto';
import { RequirePermissions } from '../../../security/auth/presentation/decorators';
import { NotificationService } from '../application/service';

@ApiTags('Inventario - Notificaciones y Alertas')
@ApiCookieAuth()
@Controller('inventario/notificaciones')
export class NotificationsController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  @RequirePermissions('notificaciones.gestionar', 'notificaciones.ver')
  @ApiOperation({ summary: 'Listar alertas de stock mínimo y vencimientos.' })
  obtener(@Query() query: ListQuery, @Req() req: AuthRequest) {
    return this.service.obtener(query, req);
  }

  @Get('conteo-no-leidas')
  @RequirePermissions('notificaciones.gestionar', 'notificaciones.ver')
  @ApiOperation({ summary: 'Obtener cantidad de alertas no leídas para la campana de notificación.' })
  contarNoLeidas(@Req() req: AuthRequest) {
    return this.service.contarNoLeidas(req);
  }

  @Post(':id/leida')
  @HttpCode(204)
  @RequirePermissions('notificaciones.gestionar', 'notificaciones.ver')
  @ApiOperation({ summary: 'Marcar alerta como leída por el usuario actual.' })
  marcarLeida(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.marcarLeida(id, req);
  }

  @Patch(':id/resolver')
  @HttpCode(204)
  @RequirePermissions('notificaciones.gestionar')
  @ApiOperation({ summary: 'Resolver definitivamente una alerta de stock.' })
  resolver(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.resolver(id, req);
  }
}

export const ControladorNotificacion = NotificationsController;
