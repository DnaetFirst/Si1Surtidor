import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsISO8601, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ListQuery } from '../../../../shared/presentation/list-query.dto';
const trim = ({ value }: {
    value: unknown;
}) => typeof value === 'string' ? value.trim() : value;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,128}$/;
export class AuditQuery extends ListQuery {
    @ApiPropertyOptional({ format: 'date-time', description: 'Inicio inclusivo con Z u offset explícito.' })
    @IsOptional()
    @IsISO8601({ strict: true })
    @Matches(/(?:Z|[+-]\d{2}:\d{2})$/)
    desde?: string;
    @ApiPropertyOptional({ format: 'date-time', description: 'Fin inclusivo con Z u offset explícito.' })
    @IsOptional()
    @IsISO8601({ strict: true })
    @Matches(/(?:Z|[+-]\d{2}:\d{2})$/)
    hasta?: string;
    @ApiPropertyOptional()
    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(160)
    usuario?: string;
    @ApiPropertyOptional()
    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(100)
    accion?: string;
    @ApiPropertyOptional({ enum: ['true', 'false'], default: 'false' })
    @IsOptional()
    @IsIn(['true', 'false'])
    archivado: string = 'false';
    @ApiPropertyOptional({ enum: ['semana', 'mes', 'ano', 'año', 'todo'], description: 'Período calendario en America/La_Paz; se usa cuando no se proporcionan fechas.' })
    @IsOptional()
    @IsIn(['semana', 'mes', 'ano', 'año', 'todo'])
    periodo?: string;
}
export class ArchiveDto {
    @ApiProperty({ format: 'date-time', description: 'Inicio inclusivo con zona horaria.' })
    @IsISO8601({ strict: true })
    @Matches(/(?:Z|[+-]\d{2}:\d{2})$/)
    desde!: string;
    @ApiProperty({ format: 'date-time', description: 'Fin inclusivo con zona horaria.' })
    @IsISO8601({ strict: true })
    @Matches(/(?:Z|[+-]\d{2}:\d{2})$/)
    hasta!: string;
}
