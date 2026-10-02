import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
const trim = ({ value }: {
    value: unknown;
}) => typeof value === 'string' ? value.trim() : value;
export class ListQuery {
    @ApiPropertyOptional({ default: 1, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;
    @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    pageSize = 10;
    @ApiPropertyOptional({ description: 'Búsqueda por texto.' })
    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(160)
    q?: string;
    @ApiPropertyOptional({ enum: ['true', 'false', 'all'], default: 'all' })
    @IsOptional()
    @IsIn(['true', 'false', 'all'])
    activo: string = 'all';
}
