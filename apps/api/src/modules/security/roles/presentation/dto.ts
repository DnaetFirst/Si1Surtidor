import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
const trim = ({ value }: {
    value: unknown;
}) => typeof value === 'string' ? value.trim() : value;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,128}$/;
export class RoleDto {
    @ApiProperty({ maxLength: 100 })
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre!: string;
    @ApiProperty({ type: [Number], description: 'IDs únicos de permisos activos y asignables.' })
    @IsArray()
    @ArrayUnique()
    @IsInt({ each: true })
    @Min(1, { each: true })
    permisoIds!: number[];
}
export class UpdateRoleDto extends PartialType(RoleDto, { skipNullProperties: false }) {
}
