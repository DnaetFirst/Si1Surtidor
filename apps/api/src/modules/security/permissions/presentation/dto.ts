import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';
const trim = ({ value }: {
    value: unknown;
}) => typeof value === 'string' ? value.trim() : value;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,128}$/;
export class PermissionDto {
    @ApiProperty({ maxLength: 100 })
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre!: string;
    @ApiProperty({ maxLength: 255 })
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    descripcion!: string;
    @ApiProperty({ enum: ['usuarios', 'roles', 'permisos', 'empresa', 'bitacora'] })
    @IsString()
    @IsIn(['usuarios', 'roles', 'permisos', 'empresa', 'bitacora'])
    modulo!: string;
    @ApiProperty({ enum: ['gestionar', 'ver', 'crear', 'editar', 'deshabilitar', 'exportar', 'archivar'], description: 'Debe formar una capacidad válida con módulo; consultar /permisos/capacidades.' })
    @IsString()
    @IsIn(['gestionar', 'ver', 'crear', 'editar', 'deshabilitar', 'exportar', 'archivar'])
    accion!: string;
}
export class UpdatePermissionDto {
    @ApiPropertyOptional({ maxLength: 100 })
    @ValidateIf((_object, value) => value !== undefined)
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre?: string;
    @ApiPropertyOptional({ maxLength: 255 })
    @ValidateIf((_object, value) => value !== undefined)
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    descripcion?: string;
}
