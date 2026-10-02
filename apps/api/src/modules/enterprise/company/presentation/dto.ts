import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsISO8601, IsNotEmpty, IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';
const trim = ({ value }: {
    value: unknown;
}) => typeof value === 'string' ? value.trim() : value;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,128}$/;
export class CompanyDto {
    @ApiProperty({ maxLength: 100 })
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre!: string;
    @ApiProperty({ maxLength: 30 })
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(30)
    telefono!: string;
    @ApiProperty({ maxLength: 255 })
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    direccion!: string;
    @ApiProperty({ maxLength: 100, format: 'email' })
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    @IsEmail()
    @MaxLength(100)
    correo!: string;
    @ApiProperty({ maxLength: 100 })
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombrePropietario!: string;
    @ApiProperty({ format: 'date' })
    @IsISO8601({ strict: true })
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    fechaCreacion!: string;
    @ApiPropertyOptional({ format: 'uri', nullable: true, maxLength: 2048 })
    @IsOptional()
    @Transform(({ value }) => value === '' ? null : value)
    @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
    @MaxLength(2048)
    logoUrl?: string | null;
    @ApiProperty({ maxLength: 20 })
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    nit!: string;
}
export class UpdateCompanyDto extends PartialType(CompanyDto, { skipNullProperties: false }) {
}
