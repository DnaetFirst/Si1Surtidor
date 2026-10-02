import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from '../modules/security/auth/presentation/decorators';
@Controller('health')
export class HealthController {
    constructor(private readonly db: DataSource) { }
    @Public()
    @Get()
    async health() { await this.db.query('SELECT 1'); return { status: 'ok' }; }
}
