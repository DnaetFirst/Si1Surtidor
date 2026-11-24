import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateIf, ValidateNested } from 'class-validator';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class LinkProductDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  idProducto!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  ultimoPrecio!: number;

  @ApiPropertyOptional({ maxLength: 255 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  detalle?: string;
}

export class CreateProviderDto {
  @ApiProperty({ maxLength: 150 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  razonSocial?: string;

  @ApiProperty({ maxLength: 20 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nit!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contacto?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @Transform(trim)
  @ValidateIf((_o, value) => value !== undefined && value !== '')
  @IsEmail({}, { message: 'El correo del proveedor no tiene un formato válido.' })
  @MaxLength(100)
  correo?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  detalle?: string;

  @ApiPropertyOptional({ type: [LinkProductDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkProductDto)
  productos?: LinkProductDto[];
}

export class UpdateProviderDto {
  @ApiPropertyOptional({ maxLength: 150 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombre?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  razonSocial?: string;

  @ApiPropertyOptional({ maxLength: 20 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  nit?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contacto?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @Transform(trim)
  @ValidateIf((_o, value) => value !== undefined && value !== '')
  @IsEmail({}, { message: 'El correo del proveedor no tiene un formato válido.' })
  @MaxLength(100)
  correo?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  detalle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
